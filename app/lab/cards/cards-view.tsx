"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { LocaleProvider, useLocale } from "../../locale-provider";
import { CardsCanvas } from "./scene";
import "../r3f/lab.css";
import "./cards.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

function CardsLabView() {
  const { t } = useLocale();
  const pageRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        progressRef.current = 1;
        if (barRef.current) gsap.set(barRef.current, { scaleX: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        progressRef.current = 0;
        ScrollTrigger.create({
          trigger: scrollRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            if (barRef.current) gsap.set(barRef.current, { scaleX: self.progress });
          },
        });
      });

      return () => mm.revert();
    },
    { scope: pageRef },
  );

  return (
    <main ref={pageRef} className="cards-page">
      <a className="skip-link" href="#cards-layers">
        {t.skip}
      </a>

      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.cardsLab.eyebrow}</p>
          <h1>{t.cardsLab.title}</h1>
          <p className="r3f-lab-copy">{t.cardsLab.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/welcome">
            {t.hang.neobotCta}
          </a>
          <a className="r3f-lab-back" href="/lab/particles">
            {t.hang.particlesCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.cardsLab.back}
          </a>
        </div>
      </header>

      <div ref={scrollRef} className="cards-scroll">
        <div className="cards-stage">
          <CardsCanvas
            progressRef={progressRef}
            fallbackLabel={t.cardsLab.fallback}
            sceneLabel={t.cardsLab.sceneLabel}
          />
          <div className="cards-scrub" aria-hidden="true">
            <i ref={barRef} />
          </div>
        </div>
      </div>

      <p className="cards-hint">{t.cardsLab.hint}</p>

      <section id="cards-layers" className="cards-notes">
        <h2>{t.cardsLab.layersHeading}</h2>
        <ol className="cards-layer-grid">
          {t.cardsLab.layers.map((layer) => (
            <li key={layer.code}>
              <span className="cards-layer-code">{layer.code}</span>
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="r3f-lab-notes">
        <div className="r3f-lab-notes-grid">
          <section>
            <h2>{t.cardsLab.knobsHeading}</h2>
            <ul>
              {t.cardsLab.knobs.map((knob) => (
                <li key={knob.code}>
                  <code>{knob.code}</code>
                  {" — "}
                  {knob.label}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.cardsLab.where}</h2>
            <ul>
              <li>
                <code>app/lab/cards/scene.tsx</code>
              </li>
              <li>
                <code>app/lab/cards/cards-view.tsx</code>
              </li>
              <li>
                <code>app/lab/cards/cards.css</code>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </main>
  );
}

export function CardsLabPageClient() {
  return (
    <LocaleProvider>
      <CardsLabView />
    </LocaleProvider>
  );
}
