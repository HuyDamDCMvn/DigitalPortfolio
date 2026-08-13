"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { DiagramMaterialImpl } from "./diagram-material";
import "./diagram-material";

export type DiagramPointerState = {
  x: number;
  y: number;
  hover: number;
};

type DiagramPlaneProps = {
  src: string;
  aspect?: number;
  width?: number;
  amp?: number;
  /** When this changes, kick a one-shot pulse boost */
  pulseKey?: string | number;
  /** Low-frequency hover (workflow). Prefer pointerRef for hero. */
  hover?: number;
  parallax?: { x: number; y: number };
  /** High-frequency pointer — read in useFrame, no React re-render */
  pointerRef?: RefObject<DiagramPointerState>;
  backdrop?: "navy" | "paper" | "none";
  /** Soften hover wash (hero images blow out easily) */
  hoverStrength?: number;
  /** Multiplier on texture RGB (1 = neutral) */
  brightness?: number;
  /** Additive lift on midtones */
  lift?: number;
};

export function DiagramPlane({
  src,
  aspect = 16 / 10,
  width = 2.4,
  amp = 0.018,
  pulseKey,
  hover = 0,
  parallax = { x: 0, y: 0 },
  pointerRef,
  backdrop = "none",
  hoverStrength = 1,
  brightness = 1,
  lift = 0,
}: DiagramPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<DiagramMaterialImpl>(null);
  const texture = useTexture(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  });

  const height = useMemo(() => width / aspect, [width, aspect]);
  const pulseRef = useRef(0);
  const lastPulseKey = useRef<string | number | undefined>(undefined);

  useFrame((state, delta) => {
    if (pulseKey !== undefined && pulseKey !== lastPulseKey.current) {
      lastPulseKey.current = pulseKey;
      pulseRef.current = 1;
    }
    pulseRef.current = THREE.MathUtils.damp(pulseRef.current, 0, 3.2, delta);

    const ptr = pointerRef?.current;
    const hoverTarget = (ptr ? ptr.hover : hover) * hoverStrength;
    const paraX = ptr ? ptr.x : parallax.x;
    const paraY = ptr ? ptr.y : parallax.y;

    const mat = matRef.current;
    if (mat) {
      mat.uTime = state.clock.elapsedTime;
      mat.uAmp = amp;
      mat.uPulseBoost = pulseRef.current;
      mat.uHover = THREE.MathUtils.damp(mat.uHover, hoverTarget, 6, delta);
      mat.uBright = brightness;
      mat.uLift = lift;
    }

    const group = groupRef.current;
    if (group) {
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, paraX * 0.16, 5, delta);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -paraY * 0.1, 5, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {backdrop === "navy" ? (
        <mesh position={[0, 0, -0.08]} scale={[width * 1.08, height * 1.12, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#031733" />
        </mesh>
      ) : null}
      {backdrop === "paper" ? (
        <mesh position={[0, 0, -0.06]} scale={[width * 1.06, height * 1.1, 1]}>
          <planeGeometry />
          <meshBasicMaterial color="#f7f9fb" />
        </mesh>
      ) : null}
      <mesh>
        <planeGeometry args={[width, height, 48, 32]} />
        <diagramMaterial
          ref={matRef}
          uMap={texture}
          uTint="#5fc7ec"
          uBright={brightness}
          uLift={lift}
          transparent
        />
      </mesh>
    </group>
  );
}
