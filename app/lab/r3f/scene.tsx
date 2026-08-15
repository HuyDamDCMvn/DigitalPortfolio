"use client";

import { CanvasShell } from "../../r3f/canvas-shell";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { preloadKit } from "../lab-part";
import { MeetingHub, HUB_CHAR_IDS } from "../meeting-hub";

preloadKit("OctTable", "OfficeChair", "Laptop", "HoloCity", ...HUB_CHAR_IDS);

function LabScene() {
  return (
    <>
      <color attach="background" args={["#05070c"]} />
      <hemisphereLight args={["#e8f0f6", "#062553", 0.42]} />
      <ambientLight intensity={0.32} />
      <directionalLight
        castShadow
        position={[5.2, 9.2, 4.0]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={28}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-4.2, 2.4, -1.8]} intensity={0.48} color="#5fc7ec" />
      <directionalLight position={[3.4, 2.0, -3.6]} intensity={0.28} color="#ffbd24" />
      <pointLight position={[0, 1.35, 0]} intensity={0.85} color="#5fc7ec" distance={3.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[5.6, 48]} />
        <meshStandardMaterial color="#2f343c" roughness={0.92} metalness={0.04} />
      </mesh>
      <MeetingHub />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.42} scale={18} blur={2.6} far={7} />
      <Environment preset="apartment" />
      <OrbitControls
        makeDefault
        enablePan={false}
        target={[0, 0.48, 0]}
        minDistance={3.2}
        maxDistance={18}
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
      camera={{ position: [7.4, 5.0, 8.4], fov: 34 }}
      aria-label={loadingLabel}
    >
      <LabScene />
    </CanvasShell>
  );
}
