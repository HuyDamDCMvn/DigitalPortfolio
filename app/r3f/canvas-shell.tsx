"use client";

import { Canvas } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useInViewOnce, usePrefersReducedMotion } from "./hooks";

type CanvasShellProps = {
  className?: string;
  fallback: ReactNode;
  children: ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  /** Transparent clear for light backgrounds */
  alpha?: boolean;
  shadows?: boolean;
  /** Mount WebGL immediately (hero / above-the-fold) — skips intersection delay flash */
  eager?: boolean;
  "aria-label"?: string;
};

function WebGlGate({
  onFail,
  children,
}: {
  onFail: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = !!(
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      );
      if (!ok) onFail();
    } catch {
      onFail();
    }
  }, [onFail]);

  return children;
}

export function CanvasShell({
  className,
  fallback,
  children,
  camera = { position: [0, 0, 2.6], fov: 40 },
  alpha = false,
  shadows = false,
  eager = false,
  "aria-label": ariaLabel,
}: CanvasShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lazyInView = useInViewOnce(rootRef);
  const inView = eager || lazyInView;
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  if (reducedMotion || failed) {
    return (
      <div className={className} aria-label={ariaLabel}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className} aria-label={ariaLabel}>
      {inView ? (
        <WebGlGate onFail={onFail}>
          <Canvas
            dpr={[1, 1.5]}
            camera={camera}
            shadows={shadows}
            gl={{ antialias: true, alpha, powerPreference: "high-performance" }}
            style={{ touchAction: "pan-y" }}
            onCreated={({ gl }) => {
              gl.setClearColor(alpha ? 0x000000 : 0x031733, alpha ? 0 : 1);
            }}
          >
            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        </WebGlGate>
      ) : (
        fallback
      )}
    </div>
  );
}
