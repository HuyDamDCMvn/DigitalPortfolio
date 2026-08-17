"use client";

import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { probeWebGL, useInViewOnce, usePrefersReducedMotion } from "./hooks";

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
  /** Opaque clear when `alpha` is false. Defaults to the lab navy. */
  clearColor?: number;
  shadows?: boolean;
  /** Pixel ratio cap. Lab canvases that need a thin edge can raise the max. */
  dpr?: [number, number];
  /** Mount WebGL immediately (hero / above-the-fold) — skips intersection delay flash */
  eager?: boolean;
  /** Applied to the live canvas only, so fallback copy stays readable by assistive tech */
  role?: string;
  "aria-label"?: string;
};

class WebGlErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function CanvasShell({
  className,
  fallback,
  children,
  camera = { position: [0, 0, 2.6], fov: 40 },
  alpha = false,
  clearColor = 0x031733,
  shadows = false,
  dpr = [1, 1.5],
  eager = false,
  role,
  "aria-label": ariaLabel,
}: CanvasShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lazyInView = useInViewOnce(rootRef);
  const inView = eager || lazyInView;
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const allowWebGL = !reducedMotion && !failed && probeWebGL();

  if (!allowWebGL) {
    return (
      <div className={className} aria-label={ariaLabel}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className} role={inView ? role : undefined} aria-label={ariaLabel}>
      {inView ? (
        <WebGlErrorBoundary onError={onFail}>
          <Canvas
            dpr={dpr}
            camera={camera}
            shadows={shadows}
            resize={{ scroll: false, debounce: 0 }}
            gl={{ antialias: true, alpha, powerPreference: "high-performance" }}
            style={{ width: "100%", height: "100%", display: "block", overflow: "hidden", touchAction: "pan-y" }}
            onCreated={({ gl }) => {
              gl.setClearColor(alpha ? 0x000000 : clearColor, alpha ? 0 : 1);
            }}
          >
            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        </WebGlErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
