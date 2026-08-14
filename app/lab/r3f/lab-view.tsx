"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
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
        <a className="r3f-lab-back" href="/">
          ← {t.lab.back}
        </a>
      </header>

      <R3fLabCanvas loadingLabel={t.lab.loading} />

      <aside className="r3f-lab-notes">
        <h2>{t.lab.where}</h2>
        <ul>
          <li>
            <code>app/lab/r3f/pulse-material.tsx</code>
          </li>
          <li>
            <code>app/lab/r3f/scene.tsx</code>
          </li>
          <li>
            <code>public/models/</code>
          </li>
        </ul>
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
