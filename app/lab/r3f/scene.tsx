"use client";

import { CanvasShell } from "../../r3f/canvas-shell";
import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PulseMaterialImpl } from "./pulse-material";
import "./pulse-material";

function PulseOrb({ amp = 0.14, freq = 3.2 }: { amp?: number; freq?: number }) {
  const materialRef = useRef<PulseMaterialImpl>(null);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uTime = state.clock.elapsedTime;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.45}>
      <mesh castShadow>
        <icosahedronGeometry args={[1.15, 64]} />
        <pulseMaterial
          ref={materialRef}
          uAmp={amp}
          uFreq={freq}
          uColor="#5fc7ec"
          uTint="#062553"
        />
      </mesh>
    </Float>
  );
}

function LabScene() {
  return (
    <>
      <color attach="background" args={["#031733"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[4, 6, 3]}
        intensity={1.35}
        shadow-mapSize={[1024, 1024]}
      />
      <PulseOrb />
      <ContactShadows
        position={[0, -1.45, 0]}
        opacity={0.45}
        scale={8}
        blur={2.4}
        far={4}
      />
      <Environment preset="city" />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.2}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.49}
      />
    </>
  );
}

export function R3fLabCanvas({ loadingLabel }: { loadingLabel: string }) {
  const fallback = (
    <div className="r3f-lab-fallback">
      <span />
      <p>{loadingLabel}</p>
    </div>
  );

  return (
    <CanvasShell
      className="r3f-lab-canvas"
      fallback={fallback}
      eager
      shadows
      camera={{ position: [0, 0.35, 4.2], fov: 42 }}
      aria-label={loadingLabel}
    >
      <LabScene />
    </CanvasShell>
  );
}
