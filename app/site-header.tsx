"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./locale-provider";

const NAV = [
  { href: "/welcome", key: "welcome" },
  { href: "#story", key: "story" },
  { href: "#capabilities", key: "capabilities" },
  { href: "#training", key: "training" },
  { href: "#automation", key: "automation" },
  { href: "#workflow", key: "workflow" },
  { href: "#case-study", key: "caseStudy" },
] as const;

export function SiteHeader() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusables = [...panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const firstLink = panel?.querySelector<HTMLElement>("a[href], button");
    firstLink?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeAndGo() {
    setOpen(false);
  }

  return (
    <>
      <a className="skip-link" href="#content">
        {t.skip}
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.brandHome}>
          <img src="/images/bkw-dcm-logo.svg" alt={t.brandAlt} />
        </a>
        <nav className="site-nav-desktop" aria-label={t.nav.primary}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {t.nav[item.key]}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <div className="site-lang" role="group" aria-label={t.langGroup}>
            <button
              type="button"
              className={locale === "en" ? "is-active" : ""}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={locale === "vi" ? "is-active" : ""}
              onClick={() => setLocale("vi")}
            >
              VI
            </button>
          </div>
          <a className="header-cta" href="#contact">
            {t.headerCta}
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t.closeMenu : t.menu}
          </button>
        </div>
      </header>
      {open ? (
        <>
          <button
            type="button"
            className="nav-backdrop"
            aria-label={t.closeMenu}
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={panelId}
            className="site-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
          >
            <nav aria-label={t.nav.primary}>
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={closeAndGo}>
                  {t.nav[item.key]}
                </a>
              ))}
            </nav>
            <a className="header-cta" href="#contact" onClick={closeAndGo}>
              {t.headerCta}
            </a>
          </div>
        </>
      ) : null}
    </>
  );
}
