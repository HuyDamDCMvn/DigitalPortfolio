"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
import { ParticlesCanvas } from "./scene";
import "../r3f/lab.css";
import "./particles.css";

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

function ParticlesLabView() {
  const { t } = useLocale();

  return (
    <main className="particles-page">
      <a className="skip-link" href="#particles-layers">
        {t.skip}
      </a>

      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.particlesLab.eyebrow}</p>
          <h1>{t.particlesLab.title}</h1>
          <p className="r3f-lab-copy">{t.particlesLab.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/lab/cards">
            {t.hang.cardsCta}
          </a>
          <a className="r3f-lab-back" href="/welcome">
            {t.hang.neobotCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.particlesLab.back}
          </a>
        </div>
      </header>

      <div className="particles-stage">
        <ParticlesCanvas fallbackLabel={t.particlesLab.fallback} sceneLabel={t.particlesLab.sceneLabel} />
      </div>

      <p className="particles-hint">{t.particlesLab.hint}</p>

      <section id="particles-layers" className="particles-notes">
        <h2>{t.particlesLab.layersHeading}</h2>
        <ol className="particles-layer-grid">
          {t.particlesLab.layers.map((layer) => (
            <li key={layer.code}>
              <span className="particles-layer-code">{layer.code}</span>
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="r3f-lab-notes">
        <div className="r3f-lab-notes-grid">
          <section>
            <h2>{t.particlesLab.knobsHeading}</h2>
            <ul>
              {t.particlesLab.knobs.map((knob) => (
                <li key={knob.code}>
                  <code>{knob.code}</code>
                  {" — "}
                  {knob.label}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.particlesLab.where}</h2>
            <ul>
              <li>
                <code>public/models/particle-brain.glb</code>
                {" — "}
                Anderson Winkler, Brain for Blender, CC BY-SA 3.0
              </li>
              <li>
                <code>app/lab/particles/scene.tsx</code>
              </li>
              <li>
                <code>app/lab/particles/particles-view.tsx</code>
              </li>
              <li>
                <code>app/lab/particles/particles.css</code>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </main>
  );
}

export function ParticlesLabPageClient() {
  return (
    <LocaleProvider>
      <ParticlesLabView />
    </LocaleProvider>
  );
}
