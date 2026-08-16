"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
import { NeobotCanvas } from "./scene";
import "../r3f/lab.css";
import "./neobot.css";

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

function NeobotStage() {
  const { t } = useLocale();

  return (
    <div className="neobot-stage">
      <p className="neobot-wordmark" aria-hidden="true">
        {t.neobot.wordmark}
      </p>
      <NeobotCanvas
        wordmark={t.neobot.wordmark}
        loadingLabel={t.neobot.loading}
        fallbackLabel={t.neobot.fallback}
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

      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.neobot.eyebrow}</p>
          <h1>{t.neobot.title}</h1>
          <p className="r3f-lab-copy">{t.neobot.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/lab/r3f">
            {t.neobot.labCta}
          </a>
          <a className="r3f-lab-back" href="/lab/cards">
            {t.hang.cardsCta}
          </a>
          <a className="r3f-lab-back" href="/lab/parts">
            {t.neobot.hangCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.neobot.back}
          </a>
        </div>
      </header>

      <NeobotStage />

      <p className="neobot-hint">{t.neobot.hint}</p>

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
                <code>public/models/neobot.glb</code>
              </li>
              <li>
                <code>scripts/blender/components/neobot.py</code>
              </li>
              <li>
                <code>app/lab/neobot/robot.tsx</code>
              </li>
              <li>
                <code>app/lab/neobot/scene.tsx</code>
              </li>
              <li>
                <code>app/lab/neobot/neobot-view.tsx</code>
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
