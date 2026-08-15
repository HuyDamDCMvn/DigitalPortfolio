"use client";

import { ZoomableImage } from "../zoomable-image";
import { useLocale } from "../locale-provider";
import "./parts/parts.css";

export const HUB_STILLS = [
  { id: "hub-still-01", src: "/images/hub-still-01.png", file: "hub-still-01.png" },
  { id: "hub-still-02", src: "/images/hub-still-02.png", file: "hub-still-02.png" },
  { id: "hub-still-03", src: "/images/hub-still-03.png", file: "hub-still-03.png" },
] as const;

export function HubStillsStrip() {
  const { t } = useLocale();

  return (
    <section id="hub-stills" className="stills-section">
      <h2>{t.hang.stillsHeading}</h2>
      <p className="stills-hint">{t.hang.stillHint}</p>
      <div className="stills-grid">
        {HUB_STILLS.map((still) => {
          const item = t.hang.stillItems.find((entry) => entry.code === still.id);
          const title = item?.title ?? still.id;
          const label = item?.label ?? still.file;
          const alt = item?.alt ?? title;
          return (
            <article key={still.id} className="part-card still-card">
              <ZoomableImage
                className="still-zoom"
                src={still.src}
                alt={alt}
                title={title}
                code={still.file}
                closeLabel={t.close}
                viewLabel={`${t.viewFullImage}: ${alt}`}
              />
              <div className="part-meta">
                <h3>
                  <code>{still.file}</code>
                </h3>
                <p>
                  <strong>{title}</strong>
                  {" — "}
                  {label}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
