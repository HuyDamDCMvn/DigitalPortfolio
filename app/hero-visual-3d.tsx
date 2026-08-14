"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import { CanvasShell } from "./r3f/canvas-shell";
import { useLocale } from "./locale-provider";
import {
  DiagramPlane,
  type DiagramPointerState,
} from "./r3f/diagram-plane";

/** Full board from hero-system-full.png — tight crop cut the figure on the right. */
const HERO_SRC = "/images/hero-system.png?v=vent-3";
const HERO_WIDTH = 482;
const HERO_HEIGHT = 676;

useTexture.preload(HERO_SRC);

const PLANE_ASPECT = HERO_WIDTH / HERO_HEIGHT;
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
  const { t } = useLocale();
  const pointerRef = useRef<DiagramPointerState>({ x: 0, y: 0, hover: 0 });
  const alt = t.hero.visual;

  const fallback = (
    <img src={HERO_SRC} alt={alt} width={HERO_WIDTH} height={HERO_HEIGHT} />
  );

  return (
    <div className="hero-image-frame hero-image-frame-3d">
      <CanvasShell
        className="hero-r3f-canvas"
        fallback={fallback}
        alpha
        eager
        camera={{ position: [0, 0, 3.8], fov: 40 }}
        aria-label={alt}
      >
        <HeroScene pointerRef={pointerRef} />
      </CanvasShell>
    </div>
  );
}
