"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
import { HubStillsStrip } from "../hub-stills";
import { R3fLabCanvas } from "./scene";
import "./lab.css";

function LabView() {
  const { t } = useLocale();

  return (
    <main className="r3f-lab">
      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.lab.eyebrow}</p>
          <h1>{t.lab.title}</h1>
          <p className="r3f-lab-copy">{t.lab.copy}</p>
        </div>
        <div className="parts-header-tools">
          <a className="r3f-lab-back" href="/lab/lead">
            {t.hang.leadCta}
          </a>
          <a className="r3f-lab-back" href="/welcome">
            {t.hang.neobotCta}
          </a>
          <a className="r3f-lab-back" href="/lab/cards">
            {t.hang.cardsCta}
          </a>
          <a className="r3f-lab-back" href="/lab/particles">
            {t.hang.particlesCta}
          </a>
          <a className="r3f-lab-back" href="/lab/parts">
            {t.hang.hangCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.lab.back}
          </a>
        </div>
      </header>

      <R3fLabCanvas loadingLabel={t.lab.loading} />

      <HubStillsStrip />

      <aside className="r3f-lab-notes">
        <div className="r3f-lab-notes-grid">
          <section>
            <h2>{t.lab.parts}</h2>
            <ul>
              {t.lab.partItems.map((item) => (
                <li key={item.code}>
                  <code>{item.code}</code>
                  {" — "}
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.lab.where}</h2>
            <ul>
              <li>
                <code>public/models/oct-table.glb</code>
              </li>
              <li>
                <code>public/models/office-chair.glb</code>
              </li>
              <li>
                <code>public/models/holo-city.glb</code>
              </li>
              <li>
                <code>public/models/laptop.glb</code>
              </li>
              <li>
                <code>public/models/char-*.glb</code>
              </li>
              <li>
                <code>app/lab/meeting-hub.tsx</code>
              </li>
              <li>
                <code>app/lab/kit.ts</code>
              </li>
              <li>
                <code>app/lab/r3f/scene.tsx</code>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </main>
  );
}

export function R3fLabPageClient() {
  return (
    <LocaleProvider>
      <LabView />
    </LocaleProvider>
  );
}
