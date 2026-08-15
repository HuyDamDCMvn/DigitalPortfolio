"use client";

import { useState } from "react";
import { LocaleProvider, useLocale } from "../../locale-provider";
import { RoleAccordion } from "../../role-accordion";
import { AccordionCanvas } from "./accordion-scene";
import "../r3f/lab.css";
import "../accordion/accordion-lab.css";

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

function Accordion3dLabView() {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = t.coordinator.roles.map(([number, title, text]) => ({ number, title, text }));

  return (
    <main className="accordion-lab">
      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.accordion3dLab.eyebrow}</p>
          <h1>{t.accordion3dLab.title}</h1>
          <p className="r3f-lab-copy">{t.accordion3dLab.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/lab/accordion">
            {t.accordion3dLab.cssCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.accordion3dLab.back}
          </a>
        </div>
      </header>

      <div className="accordion-lab-split">
        <section className="accordion-lab-controls">
          <h2 className="accordion-lab-heading">{t.accordion3dLab.rolesHeading}</h2>
          <RoleAccordion
            items={items}
            label={t.coordinator.rolesLabel}
            expandLabel={t.coordinator.expand}
            collapseLabel={t.coordinator.collapse}
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
          />
        </section>
        <AccordionCanvas
          count={items.length}
          openIndex={openIndex}
          onSelect={setOpenIndex}
          fallbackLabel={t.accordion3dLab.fallback}
          sceneLabel={t.accordion3dLab.sceneLabel}
        />
      </div>

      <aside className="r3f-lab-notes">
        <h2>{t.accordion3dLab.buildLabel}</h2>
        <ul>
          <li>
            <code>app/lab/accordion-3d/accordion-scene.tsx</code>
          </li>
          <li>
            <code>app/role-accordion.tsx</code>
          </li>
          <li>
            <code>app/r3f/canvas-shell.tsx</code>
          </li>
        </ul>
      </aside>
    </main>
  );
}

export function Accordion3dLabPageClient() {
  return (
    <LocaleProvider>
      <Accordion3dLabView />
    </LocaleProvider>
  );
}
