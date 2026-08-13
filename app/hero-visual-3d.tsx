"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import { CanvasShell } from "./r3f/canvas-shell";
import {
  DiagramPlane,
  type DiagramPointerState,
} from "./r3f/diagram-plane";

/** Cropped asset: border removed, full puzzle + character kept. */
const HERO_SRC = "/images/hero-system.png?v=fit-full-2";
const HERO_ALT =
  "Connected building-services system visual from the team presentation";

useTexture.preload(HERO_SRC);

const PLANE_ASPECT = 385 / 629;
const PLANE_WIDTH = 2.4;
/**
 * object-fit: contain with padding — full content visible inside the
 * fixed tall hero frame (may show a slim navy letterbox if ratios differ).
 */
const FIT_MARGIN = 1.1;

function FitContainCamera({
  planeWidth,
  planeAspect,
  margin = FIT_MARGIN,
}: {
  planeWidth: number;
  planeAspect: number;
  margin?: number;
}) {
  useFrame((state) => {
    const cam = state.camera as PerspectiveCamera;
    if (!("isPerspectiveCamera" in cam) || !cam.isPerspectiveCamera) return;

    const { width, height } = state.size;
    if (width < 1 || height < 1) return;

    const planeHeight = planeWidth / planeAspect;
    const canvasAspect = width / height;
    const vFov = (cam.fov * Math.PI) / 180;
    const fitByHeight = (planeHeight * margin) / (2 * Math.tan(vFov / 2));
    const fitByWidth =
      (planeWidth * margin) / (2 * Math.tan(vFov / 2) * canvasAspect);

    const z = Math.max(fitByHeight, fitByWidth);
    cam.position.set(0, 0, z);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  });

  return null;
}

function HeroScene({
  pointerRef,
}: {
  pointerRef: RefObject<DiagramPointerState>;
}) {
  return (
    <>
      <FitContainCamera planeWidth={PLANE_WIDTH} planeAspect={PLANE_ASPECT} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[2.5, 3, 4]} intensity={0.75} color="#e8f7ff" />
      <directionalLight position={[-2, 1.5, 2]} intensity={0.35} color="#ffffff" />
      <DiagramPlane
        src={HERO_SRC}
        aspect={PLANE_ASPECT}
        width={PLANE_WIDTH}
        amp={0}
        pointerRef={pointerRef}
        hoverStrength={0}
        brightness={1.22}
        lift={0.06}
        backdrop="none"
      />
    </>
  );
}

export function HeroVisual3D() {
  const pointerRef = useRef<DiagramPointerState>({ x: 0, y: 0, hover: 0 });

  const fallback = (
    <img src={HERO_SRC} alt={HERO_ALT} width={385} height={629} />
  );

  return (
    <div className="hero-image-frame hero-image-frame-3d">
      <CanvasShell
        className="hero-r3f-canvas"
        fallback={fallback}
        alpha
        eager
        camera={{ position: [0, 0, 3.8], fov: 40 }}
        aria-label={HERO_ALT}
      >
        <HeroScene pointerRef={pointerRef} />
      </CanvasShell>
    </div>
  );
}
