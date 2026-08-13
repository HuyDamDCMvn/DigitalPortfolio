"use client";

import { CanvasShell } from "./r3f/canvas-shell";
import { DiagramPlane } from "./r3f/diagram-plane";

type WorkflowVisual3DProps = {
  src: string;
  alt: string;
  pulseKey: string | number;
  hoverPreview?: boolean;
};

function WorkflowScene({
  src,
  pulseKey,
  hover,
}: {
  src: string;
  pulseKey: string | number;
  hover: number;
}) {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[1.5, 2, 3]} intensity={0.4} />
      <DiagramPlane
        key={src}
        src={src}
        aspect={16 / 8}
        width={2.7}
        amp={0.012}
        pulseKey={pulseKey}
        hover={hover}
        backdrop="paper"
      />
    </>
  );
}

export function WorkflowVisual3D({
  src,
  alt,
  pulseKey,
  hoverPreview = false,
}: WorkflowVisual3DProps) {
  const fallback = (
    <img
      className="workflow-detail-fallback-img"
      src={src}
      alt={alt}
      loading="lazy"
    />
  );

  return (
    <CanvasShell
      className="workflow-detail-3d"
      fallback={fallback}
      alpha
      camera={{ position: [0, 0, 2.55], fov: 40 }}
      aria-label={alt}
    >
      <color attach="background" args={["#f7f9fb"]} />
      <WorkflowScene
        src={src}
        pulseKey={pulseKey}
        hover={hoverPreview ? 0.85 : 0}
      />
    </CanvasShell>
  );
}
