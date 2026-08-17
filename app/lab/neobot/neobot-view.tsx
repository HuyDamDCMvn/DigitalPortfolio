"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import { LocaleProvider, useLocale } from "../../locale-provider";
import { NeobotSplineStage, type NeobotEyeMode } from "./spline-stage";
import "./neobot.css";

gsap.registerPlugin(useGSAP);

const TOUCH_NAV_MS = 300;

function isTouchLike(pointerType: string) {
  if (pointerType === "touch") return true;
  if (pointerType === "mouse" || pointerType === "keyboard") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function enterPortfolio() {
  window.location.assign("/");
}

function DigitalWordmark({
  gagReady,
  onEyesEngage,
  onEyesDisengage,
}: {
  gagReady: boolean;
  onEyesEngage: () => void;
  onEyesDisengage: () => void;
}) {
  const { t } = useLocale();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const lastPointerRef = useRef("");
  const touchCommitRef = useRef(false);
  const navTimerRef = useRef<number>(0);
  const engageRef = useRef(onEyesEngage);
  const disengageRef = useRef(onEyesDisengage);
  const gagReadyRef = useRef(gagReady);

  engageRef.current = onEyesEngage;
  disengageRef.current = onEyesDisengage;
  gagReadyRef.current = gagReady;

  useEffect(
    () => () => {
      window.clearTimeout(navTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const node = linkRef.current;
    if (!gagReady || !node) return;
    if (node.matches(":hover") || document.activeElement === node) {
      engageRef.current();
    }
  }, [gagReady]);

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

  const engage = () => {
    if (!gagReadyRef.current) return;
    engageRef.current();
  };

  const disengage = () => {
    if (touchCommitRef.current) return;
    disengageRef.current();
  };

  return (
    <a
      ref={linkRef}
      className="neobot-wordmark"
      href="/"
      aria-label={t.neobot.wordmarkGo}
      onPointerEnter={() => {
        engage();
      }}
      onPointerDown={(event) => {
        lastPointerRef.current = event.pointerType;
        engage();
      }}
      onPointerLeave={() => {
        disengage();
      }}
      onPointerCancel={() => {
        lastPointerRef.current = "";
        disengage();
      }}
      onFocus={() => {
        engage();
      }}
      onBlur={() => {
        disengage();
      }}
      onClick={(event) => {
        const touchNav = event.detail !== 0 && isTouchLike(lastPointerRef.current);
        if (!touchNav || !gagReadyRef.current) return;
        event.preventDefault();
        touchCommitRef.current = true;
        engageRef.current();
        window.clearTimeout(navTimerRef.current);
        navTimerRef.current = window.setTimeout(() => {
          enterPortfolio();
        }, TOUCH_NAV_MS);
      }}
    >
      <span className="neobot-wordmark-inner">
        <span className="neobot-wordmark-depth" aria-hidden="true">
          {t.neobot.wordmark}
        </span>
        <span className="neobot-wordmark-face">{t.neobot.wordmark}</span>
      </span>
    </a>
  );
}

const DCMVN = "https://dcmvn.com/";

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
  const [eyeMode, setEyeMode] = useState<NeobotEyeMode>("rest");
  const [splineReady, setSplineReady] = useState(false);
  const eyeModeRef = useRef<NeobotEyeMode>("rest");
  eyeModeRef.current = eyeMode;

  const setMode = (mode: NeobotEyeMode) => {
    eyeModeRef.current = mode;
    setEyeMode(mode);
  };

  return (
    <div className="neobot-stage">
      <CosmosBackdrop />
      <a
        className="neobot-stage-logo"
        href={DCMVN}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.neobot.logoGo}
        onPointerEnter={() => {
          if (!splineReady) return;
          setMode("green");
        }}
        onPointerLeave={() => {
          if (eyeModeRef.current === "green") setMode("rest");
        }}
        onFocus={() => {
          if (!splineReady) return;
          setMode("green");
        }}
        onBlur={() => {
          if (eyeModeRef.current === "green") setMode("rest");
        }}
      >
        <img src="/images/bkw-dcm-lockup.png" alt={t.brandAlt} />
      </a>
      <div className="neobot-welcome-tools">
        <DigitalWordmark
          gagReady={splineReady}
          onEyesEngage={() => setMode("cyan")}
          onEyesDisengage={() => {
            if (eyeModeRef.current === "cyan") setMode("rest");
          }}
        />
      </div>
      <NeobotSplineStage
        loadingLabel={t.neobot.loading}
        sceneLabel={t.neobot.sceneLabel}
        fallbackLabel={t.neobot.fallback}
        fallbackAlt={t.neobot.fallbackAlt}
        eyeMode={eyeMode}
        onActivate={enterPortfolio}
        onSceneReady={setSplineReady}
      />
    </div>
  );
}

function NeobotView() {
  const { t } = useLocale();

  return (
    <main className="neobot-page">
      <section className="neobot-welcome" aria-label={t.neobot.title}>
        <h1 className="neobot-welcome-title">{t.neobot.title}</h1>
        <NeobotStage />
      </section>
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
