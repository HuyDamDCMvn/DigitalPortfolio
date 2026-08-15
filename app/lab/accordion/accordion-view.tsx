"use client";

import { LocaleProvider, useLocale } from "../../locale-provider";
import { RoleAccordion } from "../../role-accordion";
import "../r3f/lab.css";
import "./accordion-lab.css";

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

function AccordionLabView() {
  const { t } = useLocale();
  const items = t.coordinator.roles.map(([number, title, text]) => ({ number, title, text }));

  return (
    <main className="accordion-lab">
      <header className="r3f-lab-header">
        <div>
          <p className="r3f-lab-eyebrow">{t.accordionLab.eyebrow}</p>
          <h1>{t.accordionLab.title}</h1>
          <p className="r3f-lab-copy">{t.accordionLab.copy}</p>
        </div>
        <div className="parts-header-tools">
          <LangToggle />
          <a className="r3f-lab-back" href="/lab/accordion-3d">
            {t.accordionLab.threeCta}
          </a>
          <a className="r3f-lab-back" href="/">
            ← {t.accordionLab.back}
          </a>
        </div>
      </header>

      <section className="accordion-lab-stage">
        <h2 className="accordion-lab-heading">{t.accordionLab.rolesHeading}</h2>
        <p className="accordion-lab-note">{t.accordionLab.note}</p>
        <RoleAccordion
          items={items}
          label={t.coordinator.rolesLabel}
          expandLabel={t.coordinator.expand}
          collapseLabel={t.coordinator.collapse}
        />
      </section>

      <aside className="r3f-lab-notes">
        <h2>{t.accordionLab.buildLabel}</h2>
        <ul>
          <li>
            <code>app/role-accordion.tsx</code>
          </li>
          <li>
            <code>app/globals.css</code> — <code>.role-accordion</code>
          </li>
          <li>
            <code>app/home-view.tsx</code> — <code>#coordinator</code>
          </li>
        </ul>
      </aside>
    </main>
  );
}

export function AccordionLabPageClient() {
  return (
    <LocaleProvider>
      <AccordionLabView />
    </LocaleProvider>
  );
}
