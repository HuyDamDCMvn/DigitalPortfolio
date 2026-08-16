"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LocaleProvider, useLocale } from "../../locale-provider";
import { usePrefersReducedMotion } from "../../r3f/hooks";
import { idleSeed } from "../model-idle";
import {
  EXPLODE_TILES,
  IsolatedPart,
  LIBRARY_TILES,
  type PartTile,
  type ZoomApi,
} from "./parts-scene";
import { HubStillsStrip } from "../hub-stills";
import "../r3f/lab.css";
import "./parts.css";

function LangToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="site-lang" role="group" aria-label={t.langGroup}>
      <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
      <button type="button" className={locale === "vi" ? "is-active" : ""} onClick={() => setLocale("vi")}>
        VI
      </button>
    </div>
  );
}

function PartCard({
  tile,
  index,
  live3d,
  title,
  label,
  fallback,
  zoomIn,
  zoomOut,
}: {
  tile: PartTile;
  index: number;
  live3d: boolean;
  title: string;
  label: string;
  fallback: string;
  zoomIn: string;
  zoomOut: string;
}) {
  const zoomApiRef = useRef<ZoomApi | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(!!entry?.isIntersecting),
      { rootMargin: "140px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={cardRef} className="part-card">
      {live3d ? (
        <>
          <View className="part-view" index={index} aria-label={title}>
            <IsolatedPart
              src={tile.src}
              names={tile.names}
              zoomApiRef={zoomApiRef}
              seed={idleSeed(tile.id, index)}
              active={active}
            />
          </View>
          <div className="part-zoom">
            <button type="button" aria-label={zoomOut} onClick={() => zoomApiRef.current?.zoomOut()}>
              −
            </button>
            <button type="button" aria-label={zoomIn} onClick={() => zoomApiRef.current?.zoomIn()}>
              +
            </button>
          </div>
        </>
      ) : (
        <div className="part-view">
          <div className="part-fallback">{fallback}</div>
        </div>
      )}
      <div className="part-meta">
        <h3>
          <code>{tile.file}</code>
        </h3>
        <p>
          <strong>{title}</strong>
          {" — "}
          {label}
        </p>
      </div>
    </article>
  );
}

function PartsBoard() {
  const { t } = useLocale();
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const live3d = !reducedMotion && !failed;

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      if (!ok) onFail();
    } catch {
      onFail();
    }
  }, [onFail]);

  function labelFor(id: string) {
    const library = t.hang.libraryItems.find((item) => item.code === id);
    if (library) return library.label;
    return t.hang.explodeItems.find((item) => item.code === id)?.label ?? id;
  }

  function titleFor(id: string) {
    const library = t.hang.libraryItems.find((item) => item.code === id);
    if (library) return library.title;
    return t.hang.explodeItems.find((item) => item.code === id)?.title ?? id;
  }

  return (
    <main ref={rootRef} className="parts-page">
      <a className="skip-link" href="#parts-library">
        {t.skip}
      </a>
      {live3d ? (
        <Canvas
          className="parts-canvas"
          eventSource={rootRef}
          eventPrefix="client"
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <View.Port />
          </Suspense>
        </Canvas>
      ) : null}

      <header className="parts-header r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.hang.eyebrow}</p>
          <h1>{t.hang.title}</h1>
          <p className="r3f-lab-copy">{t.hang.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/lab/lead">
            {t.hang.leadCta}
          </a>
          <a className="r3f-lab-back" href="/lab/neobot">
            {t.hang.neobotCta}
          </a>
          <a className="r3f-lab-back" href="/lab/cards">
            {t.hang.cardsCta}
          </a>
          <a className="r3f-lab-back" href="/lab/r3f">
            {t.hang.assemblyCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.hang.back}
          </a>
        </div>
      </header>

      <p className="parts-hint">{t.hang.rotateHint}</p>
      <p className="parts-hint">{t.hang.kit}</p>

      <HubStillsStrip />

      <section id="parts-library" className="parts-section">
        <h2>{t.hang.libraryHeading}</h2>
        <div className="parts-grid parts-grid--library">
          {LIBRARY_TILES.map((tile, index) => (
            <PartCard
              key={tile.id}
              tile={tile}
              index={index + 1}
              live3d={live3d}
              title={titleFor(tile.id)}
              label={labelFor(tile.id)}
              fallback={t.hang.fallback}
              zoomIn={t.hang.zoomIn}
              zoomOut={t.hang.zoomOut}
            />
          ))}
        </div>
      </section>

      <section className="parts-section">
        <h2>{t.hang.partsHeading}</h2>
        <div className="parts-grid">
          {EXPLODE_TILES.map((tile, index) => (
            <PartCard
              key={tile.id}
              tile={tile}
              index={LIBRARY_TILES.length + index + 1}
              live3d={live3d}
              title={titleFor(tile.id)}
              label={labelFor(tile.id)}
              fallback={t.hang.fallback}
              zoomIn={t.hang.zoomIn}
              zoomOut={t.hang.zoomOut}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export function PartsPageClient() {
  return (
    <LocaleProvider>
      <PartsBoard />
    </LocaleProvider>
  );
}
