"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  Color,
  MathUtils,
  MeshPhysicalMaterial,
  type Mesh,
  type Object3D,
} from "three";
import { cloneMeshMaterials, disposeMeshMaterials } from "../figure-look";
import { KIT } from "../kit";

/** Camera sits level with the chest, so the whole scene is lowered by this much. */
export const SCENE_LIFT = 1.16;

/** How much of the pointer each part follows. Falling values read as a spine. */
const LOOK = { head: 0.42, chest: 0.16, hips: 0.07 };

const SHELL = {
  color: "#0b0b0e",
  metalness: 0,
  roughness: 0.24,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1.4,
};
const VISOR = {
  color: "#04050a",
  metalness: 0.12,
  roughness: 0.06,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  envMapIntensity: 1.9,
};
const JOINT = {
  color: "#191c22",
  metalness: 0.85,
  roughness: 0.36,
  clearcoat: 0.35,
  clearcoatRoughness: 0.18,
  envMapIntensity: 1.1,
};
const GROOVE = {
  color: "#050507",
  metalness: 0.2,
  roughness: 0.55,
  clearcoat: 0.1,
  clearcoatRoughness: 0.4,
  envMapIntensity: 0.7,
};

function specFor(name: string) {
  if (name.startsWith("Eye")) {
    return {
      color: "#0b0b0e",
      metalness: 0,
      roughness: 0.28,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1,
      emissive: "#5fc7ec",
      emissiveIntensity: 2.6,
    };
  }
  if (name.startsWith("Vent")) {
    return {
      color: "#5fc7ec",
      metalness: 0.08,
      roughness: 0.28,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1,
      emissive: "#5fc7ec",
      emissiveIntensity: 1.8,
    };
  }
  if (
    name.startsWith("Visor") ||
    name.startsWith("Sternum") ||
    name.startsWith("Spine") ||
    name.includes("Plate")
  ) {
    return VISOR;
  }
  if (/Elbow|Knee|Wrist|Neck|Collar|Waist|Ring/.test(name)) return JOINT;
  if (/Groove|Seam|Sole/.test(name)) return GROOVE;
  return SHELL;
}

function paintRobot(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const prev = mesh.material;
    const spec = specFor(mesh.name);
    mesh.material = new MeshPhysicalMaterial({
      color: spec.color,
      metalness: spec.metalness,
      roughness: spec.roughness,
      clearcoat: spec.clearcoat,
      clearcoatRoughness: spec.clearcoatRoughness,
      envMapIntensity: spec.envMapIntensity,
      emissive: new Color("emissive" in spec ? spec.emissive : "#000000"),
      emissiveIntensity: "emissiveIntensity" in spec ? spec.emissiveIntensity : 0,
    });
    for (const mat of Array.isArray(prev) ? prev : [prev]) mat.dispose();
  });
}

useGLTF.preload(KIT.Neobot.src);

export function Neobot() {
  const { scene } = useGLTF(KIT.Neobot.src);
  const root = useMemo(() => {
    const clone = scene.clone(true);
    cloneMeshMaterials(clone);
    paintRobot(clone);
    return clone;
  }, [scene]);

  const chest = useMemo(() => root.getObjectByName("Chest"), [root]);
  const breath = useMemo(() => root.getObjectByName("Breath"), [root]);
  const head = useMemo(() => root.getObjectByName("Head"), [root]);
  const headRestY = head?.position.y ?? 0.4;

  useEffect(() => () => disposeMeshMaterials(root), [root]);

  useFrame((state, delta) => {
    const { x, y } = state.pointer;
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, 0.05);

    root.rotation.y = MathUtils.damp(root.rotation.y, x * LOOK.hips, 4, step);
    if (chest) {
      chest.rotation.y = MathUtils.damp(chest.rotation.y, x * LOOK.chest, 5, step);
      chest.rotation.x = MathUtils.damp(chest.rotation.x, -y * LOOK.chest * 0.5, 5, step);
    }
    if (head) {
      head.rotation.y = MathUtils.damp(head.rotation.y, x * LOOK.head, 7, step);
      head.rotation.x = MathUtils.damp(head.rotation.x, -y * LOOK.head * 0.62, 7, step);
      head.position.y = headRestY + Math.sin(time * 1.15 + 0.4) * 0.005;
    }
    if (breath) {
      breath.scale.y = 1 + Math.sin(time * 1.15) * 0.014;
    }
  });

  return <primitive object={root} />;
}
