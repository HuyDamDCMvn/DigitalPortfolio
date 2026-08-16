"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { LocaleProvider, useLocale } from "../../locale-provider";
import { NeobotSplineStage } from "./spline-stage";
import "../r3f/lab.css";
import "./neobot.css";

gsap.registerPlugin(useGSAP);

function DigitalWordmark() {
  const { t } = useLocale();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const node = linkRef.current;
      const inner = node?.querySelector<HTMLElement>(".neobot-wordmark-inner");
      const face = node?.querySelector<HTMLElement>(".neobot-wordmark-face");
      if (!node || !inner || !face) return;

      const shine = { x: 28, y: 22, spot: 0 };
      const applyShine = () => {
        face.style.setProperty("--mx", `${shine.x}%`);
        face.style.setProperty("--my", `${shine.y}%`);
        face.style.setProperty("--spot", String(shine.spot));
      };
      applyShine();
      const xTo = gsap.quickTo(shine, "x", { duration: 0.12, ease: "power3.out", onUpdate: applyShine });
      const yTo = gsap.quickTo(shine, "y", { duration: 0.12, ease: "power3.out", onUpdate: applyShine });
      const spotTo = gsap.quickTo(shine, "spot", { duration: 0.2, ease: "power2.out", onUpdate: applyShine });
      const clamp = gsap.utils.clamp(0, 100);

      const onMove = (event: PointerEvent) => {
        const box = face.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) return;
        xTo(clamp(((event.clientX - box.left) / box.width) * 100));
        yTo(clamp(((event.clientY - box.top) / box.height) * 100));
      };
      const onEnterShine = () => spotTo(1);
      const onLeaveShine = () => spotTo(0);

      node.addEventListener("pointermove", onMove);
      node.addEventListener("pointerenter", onEnterShine);
      node.addEventListener("pointerleave", onLeaveShine);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(inner, { y: 0, scale: 1, opacity: 1 });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          inner,
          { y: 22, scale: 0.86, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.85, ease: "back.out(1.7)" },
        );
        const float = gsap.to(inner, {
          y: -8,
          duration: 2.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.85,
        });
        const onEnter = () => {
          float.pause();
          gsap.to(inner, { y: -14, scale: 1.08, duration: 0.28, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(inner, {
            y: -8,
            scale: 1,
            duration: 0.32,
            ease: "power2.out",
            onComplete: () => float.resume(),
          });
        };
        node.addEventListener("pointerenter", onEnter);
        node.addEventListener("pointerleave", onLeave);
        node.addEventListener("focus", onEnter);
        node.addEventListener("blur", onLeave);
        return () => {
          node.removeEventListener("pointerenter", onEnter);
          node.removeEventListener("pointerleave", onLeave);
          node.removeEventListener("focus", onEnter);
          node.removeEventListener("blur", onLeave);
        };
      });

      return () => {
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerenter", onEnterShine);
        node.removeEventListener("pointerleave", onLeaveShine);
        mm.revert();
      };
    },
    { scope: linkRef },
  );

  return (
    <a ref={linkRef} className="neobot-wordmark" href="/" aria-label={t.neobot.wordmarkGo}>
      <span className="neobot-wordmark-inner">
        <span className="neobot-wordmark-depth" aria-hidden="true">
          {t.neobot.wordmark}
        </span>
        <span className="neobot-wordmark-face">{t.neobot.wordmark}</span>
      </span>
    </a>
  );
}

function enterPortfolio() {
  window.location.assign("/");
}

function CosmosBackdrop() {
  return (
    <div className="neobot-cosmos" aria-hidden="true">
      <div className="neobot-cosmos-nebula" />
      <div className="neobot-cosmos-stars" />
      <div className="neobot-cosmos-stars is-drift" />
      <div className="neobot-cosmos-grid" />
      <div className="neobot-cosmos-horizon" />
    </div>
  );
}

function NeobotStage() {
  const { t } = useLocale();

  return (
    <div className="neobot-stage">
      <CosmosBackdrop />
      <a className="neobot-stage-logo" href="/" aria-label={t.brandHome}>
        <img src="/images/bkw-dcm-lockup.png" alt={t.brandAlt} />
      </a>
      <div className="neobot-welcome-tools">
        <DigitalWordmark />
      </div>
      <NeobotSplineStage
        loadingLabel={t.neobot.loading}
        sceneLabel={t.neobot.sceneLabel}
        fallbackLabel={t.neobot.fallback}
        fallbackAlt={t.neobot.fallbackAlt}
        onActivate={enterPortfolio}
      />
    </div>
  );
}

function NeobotView() {
  const { t } = useLocale();

  return (
    <main className="neobot-page">
      <a className="skip-link" href="#neobot-layers">
        {t.skip}
      </a>

      <section className="neobot-welcome" aria-label={t.neobot.title}>
        <h1 className="neobot-welcome-title">{t.neobot.title}</h1>
        <NeobotStage />
      </section>

      <section id="neobot-layers" className="neobot-notes">
        <h2>{t.neobot.layersHeading}</h2>
        <ol className="neobot-layer-grid">
          {t.neobot.layers.map((layer) => (
            <li key={layer.code}>
              <span className="neobot-layer-code">{layer.code}</span>
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="r3f-lab-notes">
        <div className="r3f-lab-notes-grid">
          <section>
            <h2>{t.neobot.knobsHeading}</h2>
            <ul>
              {t.neobot.knobs.map((knob) => (
                <li key={knob.code}>
                  <code>{knob.code}</code>
                  {" — "}
                  {knob.label}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.neobot.where}</h2>
            <ul>
              <li>
                <a href="https://community.spline.design/file/615b9422-9985-43f6-8593-d7d7bc3b0be1">
                  Spline · NEXBOT (CC0)
                </a>
              </li>
              <li>
                <code>app/lab/neobot/spline-stage.tsx</code>
              </li>
              <li>
                <code>app/i18n.ts</code>
                {" — "}
                <code>neobot.wordmark</code>
              </li>
              <li>
                <code>public/models/nexbot.splinecode</code>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </main>
  );
}

export function NeobotPageClient() {
  return (
    <LocaleProvider>
      <NeobotView />
    </LocaleProvider>
  );
}
