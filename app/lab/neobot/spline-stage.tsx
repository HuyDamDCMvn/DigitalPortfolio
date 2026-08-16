"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../r3f/hooks";

/** Self-hosted CC0 NEXBOT export — no baked wordmark, so the page can set Digital. */
const SCENE_URL = "/models/nexbot.splinecode";
const TAP_PX = 10;

function webglOk() {
  try {
    const probe = document.createElement("canvas");
    return !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function NeobotSplineStage({
  sceneLabel,
  loadingLabel,
  fallbackLabel,
  fallbackAlt,
  onActivate,
}: {
  sceneLabel: string;
  loadingLabel: string;
  fallbackLabel: string;
  fallbackAlt: string;
  onActivate?: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activateRef = useRef(onActivate);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  activateRef.current = onActivate;

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (!webglOk()) {
      onFail();
      return;
    }

    let cancelled = false;
    let app: { dispose: () => void; setSize: (w: number, h: number) => void } | null = null;

    const boot = async () => {
      const { Application } = await import("@splinetool/runtime");
      if (cancelled) return;
      const spline = new Application(canvas, { renderMode: "continuous" });
      app = spline;
      await spline.load(SCENE_URL);
      if (cancelled) {
        spline.dispose();
        return;
      }
      spline.setBackgroundColor("transparent");
      const { width, height } = wrap.getBoundingClientRect();
      if (width > 0 && height > 0) spline.setSize(width, height);
      setReady(true);
    };

    boot().catch(onFail);

    const ro = new ResizeObserver(() => {
      if (!app) return;
      const { width, height } = wrap.getBoundingClientRect();
      if (width > 0 && height > 0) app.setSize(width, height);
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      ro.disconnect();
      app?.dispose();
    };
  }, [failed, onFail, reduced]);

  useEffect(() => {
    if (!ready || reduced || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (!down) return;
      const dx = event.clientX - down.x;
      const dy = event.clientY - down.y;
      down = null;
      if (dx * dx + dy * dy > TAP_PX * TAP_PX) return;
      activateRef.current?.();
    };
    const onLeave = () => {
      down = null;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [failed, ready, reduced]);

  if (reduced || failed) {
    return (
      <a className="neobot-fallback-still" href="/" aria-label={sceneLabel}>
        <img src="/lab/nexbot-still.jpg" alt={fallbackAlt} />
        <p className="neobot-fallback">{fallbackLabel}</p>
      </a>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={ready ? "neobot-spline is-enter" : "neobot-spline"}
      role="img"
      aria-label={sceneLabel}
    >
      {!ready ? <p className="neobot-fallback">{loadingLabel}</p> : null}
      <canvas ref={canvasRef} />
    </div>
  );
}
