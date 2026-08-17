"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Application, SPEObject } from "@splinetool/runtime";
import { probeWebGL, usePrefersReducedMotion } from "../../r3f/hooks";

/** Self-hosted CC0 NEXBOT export — no baked wordmark, so the page can set Digital. */
const SCENE_URL = "/models/nexbot.splinecode";
const TAP_PX = 10;
const EYE_CYAN = "#5fc7ec";
const EYE_GREEN = "#3dcf6a";
const VIDEO_SCALE = 0.28;
const RECORD_MS = 1100;
const RECORD_FPS = 15;

export type NeobotEyeMode = "rest" | "cyan" | "green";

type Rgb = { r: number; g: number; b: number };

type VideoEyeRig = {
  uuid: string;
  restColor: string;
  updateTexture: (src: string | Uint8Array) => Promise<void>;
  restVideo: Uint8Array;
  cyanVideo: Uint8Array;
  greenVideo: Uint8Array;
};

type TextureUpdatable = {
  type: string;
  updateTexture?: (src: string | Uint8Array) => Promise<void>;
  texture?: {
    video?: { data?: Uint8Array; thumb?: Uint8Array };
  };
};

function parseRgb(color: string): Rgb {
  const hex = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split("").map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  if (long) {
    const n = Number.parseInt(long[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  return { r: 95, g: 199, b: 236 };
}

function layerColorCss(color: unknown): string | null {
  if (typeof color === "string" && color) return color;
  if (!color || typeof color !== "object") return null;
  if (!("r" in color) || !("g" in color) || !("b" in color)) return null;
  const { r, g, b } = color as Rgb;
  const scale = Math.max(r, g, b) > 1 + 1e-6 ? 1 : 255;
  return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
}

function restMeshColor(obj: SPEObject) {
  const colorLayer = obj.material?.layers?.find((layer) => layer.type === "color");
  return (colorLayer && "color" in colorLayer ? layerColorCss(colorLayer.color) : null) ?? "#000000";
}

function hasLedMedia(obj: SPEObject) {
  const layers = obj.material?.layers;
  if (!layers?.length) return false;
  return layers.some((layer) => layer.type === "video" || layer.type === "texture");
}

function videoLayerOf(obj: SPEObject): TextureUpdatable | undefined {
  return obj.material?.layers?.find((layer) => layer.type === "video") as TextureUpdatable | undefined;
}

/** Visor LED grids live on Head 2 as one video layer (both eyes). Fail closed. */
function findLedMeshes(spline: Application): SPEObject[] {
  const all = spline.getAllObjects();
  const visor = all.filter((obj) => obj.name === "Head 2" && hasLedMedia(obj));
  if (visor.length === 1 || visor.length === 2) return visor;
  return [];
}

function readEyeTokens() {
  if (typeof document === "undefined") {
    return { cyan: EYE_CYAN, green: EYE_GREEN };
  }
  const page = document.querySelector(".neobot-page");
  const style = getComputedStyle(page ?? document.documentElement);
  return {
    cyan: style.getPropertyValue("--nexbot-eye-lit").trim() || EYE_CYAN,
    green: style.getPropertyValue("--nexbot-eye-green").trim() || EYE_GREEN,
  };
}

/** Spline proxies TypedArrays — copy byte-by-byte into a plain buffer. */
function copyBytes(src: Uint8Array) {
  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i += 1) out[i] = src[i];
  return out;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Bake a short tinted loop of the LED video.
 * Do NOT tint Head 2's color layer — that washes the whole helmet.
 * Only the video dots should change; black stays black.
 */
async function bakeTintedLedVideo(restVideo: Uint8Array, litHex: string): Promise<Uint8Array | null> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") return null;

  const { r: tr, g: tg, b: tb } = parseRgb(litHex);

  const src = document.createElement("video");
  src.muted = true;
  src.loop = true;
  src.playsInline = true;
  src.src = URL.createObjectURL(new Blob([restVideo], { type: "video/mp4" }));

  try {
    await src.play();
    await wait(180);
    if (!src.videoWidth || !src.videoHeight) return null;

    const width = Math.max(2, Math.round(src.videoWidth * VIDEO_SCALE));
    const height = Math.max(2, Math.round(src.videoHeight * VIDEO_SCALE));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";
    if (!mime) return null;

    const stream = canvas.captureStream(RECORD_FPS);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_400_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.start();

    const paint = () => {
      ctx.drawImage(src, 0, 0, width, height);
      const image = ctx.getImageData(0, 0, width, height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        if (lum < 28) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          continue;
        }
        // Replace LED dots with vivid cyan (keep value from luminance for blink shape).
        const gain = Math.min(1.35, 0.55 + lum / 255);
        data[i] = Math.min(255, Math.round(tr * gain));
        data[i + 1] = Math.min(255, Math.round(tg * gain));
        data[i + 2] = Math.min(255, Math.round(tb * gain));
      }
      ctx.putImageData(image, 0, 0);
    };

    const interval = window.setInterval(paint, 1000 / RECORD_FPS);
    paint();
    await wait(RECORD_MS);
    window.clearInterval(interval);
    recorder.stop();
    await stopped;

    if (!chunks.length) return null;
    return new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer());
  } catch {
    return null;
  } finally {
    src.pause();
    URL.revokeObjectURL(src.src);
    src.removeAttribute("src");
    src.load();
  }
}

async function prepareEyeRigs(
  meshes: SPEObject[],
  tokens: { cyan: string; green: string },
): Promise<VideoEyeRig[]> {
  const rigs: VideoEyeRig[] = [];
  for (const mesh of meshes) {
    const layer = videoLayerOf(mesh);
    const data = layer?.texture?.video?.data;
    if (!layer?.updateTexture || !data?.length) continue;
    const restVideo = copyBytes(data);
    const [cyanVideo, greenVideo] = await Promise.all([
      bakeTintedLedVideo(restVideo, tokens.cyan),
      bakeTintedLedVideo(restVideo, tokens.green),
    ]);
    if (!cyanVideo?.length || !greenVideo?.length) continue;
    rigs.push({
      uuid: mesh.uuid,
      restColor: restMeshColor(mesh),
      updateTexture: (src) => layer.updateTexture!(src),
      restVideo,
      cyanVideo,
      greenVideo,
    });
  }
  return rigs;
}

function videoForMode(rig: VideoEyeRig, mode: NeobotEyeMode) {
  if (mode === "cyan") return rig.cyanVideo;
  if (mode === "green") return rig.greenVideo;
  return rig.restVideo;
}

export function NeobotSplineStage({
  sceneLabel,
  loadingLabel,
  fallbackLabel,
  fallbackAlt,
  eyeMode = "rest",
  onActivate,
  onSceneReady,
}: {
  sceneLabel: string;
  loadingLabel: string;
  fallbackLabel: string;
  fallbackAlt: string;
  eyeMode?: NeobotEyeMode;
  onActivate?: () => void;
  onSceneReady?: (ready: boolean) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activateRef = useRef(onActivate);
  const onSceneReadyRef = useRef(onSceneReady);
  const splineRef = useRef<Application | null>(null);
  const eyeRigsRef = useRef<VideoEyeRig[]>([]);
  const appliedModeRef = useRef<NeobotEyeMode>("rest");
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  activateRef.current = onActivate;
  onSceneReadyRef.current = onSceneReady;

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (!probeWebGL()) {
      onFail();
      return;
    }

    let cancelled = false;
    let app: Application | null = null;

    const boot = async () => {
      const { Application } = await import("@splinetool/runtime");
      if (cancelled) return;
      const spline = new Application(canvas, { renderMode: "continuous" });
      app = spline;
      splineRef.current = spline;
      await spline.load(SCENE_URL);
      if (cancelled) {
        spline.dispose();
        splineRef.current = null;
        return;
      }
      spline.setBackgroundColor("transparent");
      const { width, height } = wrap.getBoundingClientRect();
      if (width > 0 && height > 0) spline.setSize(width, height);

      const meshes = findLedMeshes(spline);
      const rigs = await prepareEyeRigs(meshes, readEyeTokens());
      if (cancelled) {
        spline.dispose();
        splineRef.current = null;
        return;
      }
      eyeRigsRef.current = rigs;
      appliedModeRef.current = "rest";
      setReady(true);
      // Gag only when tinted LED videos are ready.
      onSceneReadyRef.current?.(rigs.length > 0);
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
      setReady(false);
      onSceneReadyRef.current?.(false);
      app?.dispose();
      splineRef.current = null;
      eyeRigsRef.current = [];
      appliedModeRef.current = "rest";
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

  useEffect(() => {
    if (!ready || failed || reduced) return;
    const spline = splineRef.current;
    const rigs = eyeRigsRef.current;
    if (!spline || !rigs.length) return;

    let cancelled = false;
    const apply = async () => {
      const want = eyeMode;
      if (appliedModeRef.current === want) return;
      for (const rig of rigs) {
        const obj = spline.findObjectById(rig.uuid);
        if (obj) obj.color = rig.restColor;
        await rig.updateTexture(videoForMode(rig, want));
        if (cancelled) return;
      }
      appliedModeRef.current = want;
    };

    void apply();
    return () => {
      cancelled = true;
    };
  }, [eyeMode, failed, ready, reduced]);

  if (reduced || failed || !probeWebGL()) {
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
