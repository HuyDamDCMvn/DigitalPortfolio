"use client";

import { useGLTF } from "@react-three/drei";
import { type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Object3D } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CharacterMixer } from "./character-mixer";
import { FigureGlow } from "./figure-hover";
import {
  applyFigureLook,
  cloneMeshMaterials,
  disposeMeshMaterials,
  skipRaycast,
  type FigureLook,
} from "./figure-look";
import { KIT, kitIdBySrc, type IdleClip, type KitId } from "./kit";
import { ModelIdle } from "./model-idle";

function enableShadows(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as Object3D & { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

export function stripCharStrays(root: Object3D) {
  const stray: Object3D[] = [];
  root.traverse((obj) => {
    if (/^Icosphere/i.test(obj.name)) stray.push(obj);
  });
  for (const obj of stray) obj.removeFromParent();
  return root;
}

export function isolateMeshes(scene: Object3D, names: readonly string[] | "all", shadows = true) {
  const clone = scene.clone(true);
  if (names !== "all") {
    const keep = new Set(names);
    const remove: Object3D[] = [];
    clone.traverse((obj) => {
      const mesh = obj as Object3D & { isMesh?: boolean };
      if (mesh.isMesh && obj.name && !keep.has(obj.name)) remove.push(obj);
    });
    for (const obj of remove) obj.removeFromParent();
  }
  cloneMeshMaterials(clone);
  if (shadows) enableShadows(clone);
  return clone;
}

function isolateSkinned(scene: Object3D, shadows = true) {
  const clone = cloneSkinned(scene);
  stripCharStrays(clone);
  cloneMeshMaterials(clone);
  if (shadows) enableShadows(clone);
  return clone;
}

export function preloadKit(...ids: KitId[]) {
  for (const id of ids) useGLTF.preload(KIT[id].src);
}

type LabPartProps = Omit<ThreeElements["group"], "id"> & {
  id: KitId;
  /** Yaw around Y. 0 = local +Z is front. Ignored if `rotation` is set. */
  rotationY?: number;
  seed?: number;
  idle?: boolean;
  /** When false, mixer characters keep a Sit/Idle pose and do not tick. */
  live?: boolean;
  clip?: IdleClip;
  names?: "all" | readonly string[];
  look?: FigureLook;
  glowOnHover?: boolean;
  glowColor?: string;
  pick?: boolean;
  shadows?: boolean;
};

/**
 * Place a kit part in world space.
 * `position` is always metres on the shared floor (y = 0). Tabletop props
 * should use `onTable("HexTable" | "OctTable" | "LeadTable", x, z)`.
 */
export function LabPart({
  id,
  rotationY = 0,
  rotation,
  seed = 0,
  idle = true,
  live = true,
  clip,
  names = "all",
  look,
  glowOnHover = false,
  glowColor = "#5fc7ec",
  pick = true,
  shadows = true,
  children,
  onPointerOver,
  onPointerOut,
  ...props
}: LabPartProps) {
  const spec = KIT[id];
  const { scene, animations } = useGLTF(spec.src);
  const motionRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const highlight = glowOnHover;
  const mixer = spec.playback === "mixer";

  const part = useMemo(() => {
    const clone = mixer ? isolateSkinned(scene, shadows) : isolateMeshes(scene, names, shadows);
    if (look && !mixer) applyFigureLook(clone, look);
    if (!pick) skipRaycast(clone);
    return clone;
  }, [scene, names, look, pick, shadows, mixer]);

  useEffect(() => () => disposeMeshMaterials(part), [part]);

  const usedClip = idle ? (clip ?? spec.idle) : "none";

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (highlight) {
      event.stopPropagation();
      setHovered(true);
    }
    onPointerOver?.(event);
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    if (highlight) {
      event.stopPropagation();
      setHovered(false);
    }
    onPointerOut?.(event);
  };

  return (
    <group
      {...props}
      rotation={rotation ?? [0, rotationY, 0]}
      onPointerOver={highlight || onPointerOver ? handleOver : undefined}
      onPointerOut={highlight || onPointerOut ? handleOut : undefined}
    >
      <group ref={motionRef}>
        <primitive object={part} />
        {highlight ? (
          <FigureGlow root={part} look={look} color={glowColor} hovered={hovered} lightY={look ? 0.98 : mixer ? 0.7 : 0.62} />
        ) : null}
      </group>
      {mixer ? (
        <CharacterMixer
          root={part}
          clips={animations}
          clip={usedClip}
          active={idle && live}
          frozen={!live}
        />
      ) : (
        <ModelIdle root={part} seed={seed} clip={usedClip} bobRef={motionRef} />
      )}
      {children}
    </group>
  );
}

/** @deprecated Use LabPart with a kit id. Kept for src-based call sites. */
export function AnimatedGltf({
  src,
  seed = 0,
  active = true,
  ...props
}: ThreeElements["group"] & { src: string; seed?: number; active?: boolean }) {
  const id = kitIdBySrc(src);
  if (!id) return null;
  return <LabPart id={id} seed={seed} idle={active} {...props} />;
}
