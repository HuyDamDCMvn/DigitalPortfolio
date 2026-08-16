"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  MathUtils,
  SRGBColorSpace,
  type Mesh,
} from "three";
import { CanvasShell } from "../../r3f/canvas-shell";
import { Neobot, SCENE_LIFT } from "./robot";

/**
 * A gloss-black body is almost pure reflection, so shape comes from what surrounds it,
 * not from lamps. Each Lightformer aims at the origin by default; its scale becomes the
 * length of the highlight you see running down an arm or across the chest.
 */
function StudioRig() {
  return (
    <>
      <color attach="background" args={["#dce2ea"]} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={6.2} color="#ffffff" position={[1.2, 3.6, 2.4]} scale={[7, 3.2, 1]} />
        <Lightformer form="rect" intensity={2.6} color="#e4ecf4" position={[-3.4, 1.1, 1.6]} scale={[1.1, 5, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#c8d4e2" position={[3.4, 1.1, -1.1]} scale={[1.1, 5, 1]} />
        <Lightformer form="rect" intensity={0.85} color="#aebccd" position={[0, -2.4, 2.2]} scale={[6, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.18} />
      <directionalLight position={[1.6, 3.6, 2.8]} intensity={0.7} />
    </>
  );
}

function ToneMap() {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);
  return null;
}

function makeWordmarkTexture(text: string) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "800 280px ui-sans-serif, Segoe UI, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 10;
  ctx.strokeText(text, 1024, 270);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(text, 1024, 270);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function Wordmark({ text }: { text: string }) {
  const meshRef = useRef<Mesh>(null);
  const texture = useMemo(() => makeWordmarkTexture(text), [text]);

  useLayoutEffect(() => () => texture?.dispose(), [texture]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const step = Math.min(delta, 0.05);
    mesh.position.x = MathUtils.damp(mesh.position.x, -state.pointer.x * 0.2, 3, step);
    mesh.position.y = MathUtils.damp(mesh.position.y, 0.08 - state.pointer.y * 0.08, 3, step);
  });

  return (
    <mesh ref={meshRef} position={[0, 0.08, -0.62]}>
      <planeGeometry args={[3.6, 0.9]} />
      <meshBasicMaterial map={texture ?? undefined} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function NeobotCanvas({
  wordmark,
  loadingLabel,
  sceneLabel,
  fallbackLabel,
  fallbackAlt,
}: {
  wordmark: string;
  loadingLabel: string;
  sceneLabel: string;
  fallbackLabel: string;
  fallbackAlt: string;
}) {
  return (
    <CanvasShell
      className="neobot-canvas"
      fallback={
        <div className="neobot-fallback-still">
          <img src="/lab/nexbot-still.jpg" alt={fallbackAlt} />
          <p className="neobot-fallback">{fallbackLabel}</p>
        </div>
      }
      eager
      clearColor={0xdce2ea}
      camera={{ position: [0, 0.04, 1.95], fov: 28 }}
      role="img"
      aria-label={sceneLabel || loadingLabel}
    >
      <ToneMap />
      <StudioRig />
      <Wordmark text={wordmark} />
      {/* Authored on the floor at y = 0, then dropped so the chest sits on the camera axis. */}
      <group position={[0, -SCENE_LIFT, 0]}>
        <Neobot />
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.4}
          scale={3.2}
          blur={2.6}
          far={1.4}
          resolution={512}
          color="#232a35"
        />
      </group>
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom luminanceThreshold={0.88} mipmapBlur intensity={0.55} radius={0.4} />
        <DepthOfField target={[0, 0.06, 0]} focalLength={0.018} bokehScale={1.1} height={480} />
        <Vignette offset={0.28} darkness={0.3} />
      </EffectComposer>
    </CanvasShell>
  );
}
