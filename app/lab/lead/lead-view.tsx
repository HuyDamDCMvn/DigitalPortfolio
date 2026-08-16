"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
import { LeadLabCanvas } from "./scene";
import "../r3f/lab.css";

function LeadView() {
  const { t } = useLocale();

  return (
    <main className="r3f-lab">
      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.lead.eyebrow}</p>
          <h1>{t.lead.title}</h1>
          <p className="r3f-lab-copy">{t.lead.copy}</p>
        </div>
        <div className="parts-header-tools">
          <a className="r3f-lab-back" href="/lab/parts">
            {t.hang.hangCta}
          </a>
          <a className="r3f-lab-back" href="/welcome">
            {t.hang.neobotCta}
          </a>
          <a className="r3f-lab-back" href="/lab/r3f">
            {t.hang.assemblyCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.lead.back}
          </a>
        </div>
      </header>

      <LeadLabCanvas loadingLabel={t.lead.loading} />

      <aside className="r3f-lab-notes">
        <div className="r3f-lab-notes-grid">
          <section>
            <h2>{t.lead.parts}</h2>
            <ul>
              {t.lead.partItems.map((item) => (
                <li key={item.code}>
                  <code>{item.code}</code>
                  {" — "}
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.lead.where}</h2>
            <ul>
              <li>
                <code>public/models/oct-table.glb</code>
              </li>
              <li>
                <code>public/models/lead-dashboard.glb</code>
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
                <code>app/lab/lead/scene.tsx</code>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </main>
  );
}

export function LeadPageClient() {
  return (
    <LocaleProvider>
      <LeadView />
    </LocaleProvider>
  );
}
