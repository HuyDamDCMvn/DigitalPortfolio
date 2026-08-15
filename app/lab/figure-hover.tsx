"use client";

import { useGSAP } from "@gsap/react";
import { useCursor } from "@react-three/drei";
import gsap from "gsap";
import { useRef } from "react";
import type { Object3D, PointLight } from "three";
import { collectGlowMaterials, setFigureGlow, type FigureLook } from "./figure-look";

gsap.registerPlugin(useGSAP);

export function FigureGlow({
  root,
  look,
  hovered,
  color = "#5fc7ec",
  lightY = 0.88,
}: {
  root: Object3D;
  look?: FigureLook;
  hovered: boolean;
  color?: string;
  lightY?: number;
}) {
  const glow = useRef({ v: 0 });
  const lightRef = useRef<PointLight>(null);
  const mats = useRef(collectGlowMaterials(root));
  const lightColor = look?.shirt ?? color;
  useCursor(hovered);

  useGSAP(
    () => {
      mats.current = collectGlowMaterials(root);
      return () => {
        gsap.killTweensOf(glow.current);
        setFigureGlow(mats.current, 0);
      };
    },
    { dependencies: [root] },
  );

  useGSAP(
    () => {
      gsap.to(glow.current, {
        v: hovered ? 1 : 0,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          setFigureGlow(mats.current, glow.current.v);
          if (lightRef.current) lightRef.current.intensity = glow.current.v * 2.6;
        },
      });
    },
    { dependencies: [hovered] },
  );

  return (
    <pointLight
      ref={lightRef}
      color={lightColor}
      intensity={0}
      distance={2.4}
      position={[0, lightY, 0]}
    />
  );
}
