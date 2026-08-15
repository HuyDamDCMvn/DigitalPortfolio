"use client";

import { CanvasShell } from "../../r3f/canvas-shell";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { LabPart, preloadKit } from "../lab-part";
import { MeetingHub, HUB_CHAR_IDS } from "../meeting-hub";

preloadKit("OctTable", "OfficeChair", "Laptop", "HoloCity", "LeadDashboard", ...HUB_CHAR_IDS);

function LeadScene() {
  return (
    <>
      <color attach="background" args={["#c5dff0"]} />
      <hemisphereLight args={["#f4fbff", "#7aa8c8", 0.7]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[4, 7, 5]}
        intensity={1.2}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={22}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.35} color="#ffffff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#d7ebf6" roughness={0.9} />
      </mesh>

      <LabPart id="LeadDashboard" position={[0, 0.12, -3.6]} />
      <MeetingHub holoHover={false} />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.28} scale={18} blur={2.8} far={7} />
      <Environment preset="apartment" />
      <OrbitControls
        makeDefault
        enablePan={false}
        target={[0, 0.7, 0]}
        minDistance={2.8}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.49}
      />
    </>
  );
}

export function LeadLabCanvas({ loadingLabel }: { loadingLabel: string }) {
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
      camera={{ position: [7.2, 4.6, 8.2], fov: 34 }}
      aria-label={loadingLabel}
    >
      <LeadScene />
    </CanvasShell>
  );
}
