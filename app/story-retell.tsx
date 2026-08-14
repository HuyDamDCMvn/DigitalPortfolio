"use client";

import { useState } from "react";
import { useLocale } from "./locale-provider";
import { ImageLightbox, type LightboxImage } from "./zoomable-image";

const CHAPTER_IMAGES = [
  "/images/story-01-delivery.png",
  "/images/story-02-team.png",
  "/images/story-03-voices.png",
  "/images/story-04-lead.png",
] as const;

export function StoryRetell() {
  const { t } = useLocale();
  const [active, setActive] = useState<(LightboxImage & { code: string; title: string }) | null>(null);
  const chapters = t.story.chapters;

  return (
    <>
      <div className="story-retell" aria-label={t.story.label}>
        <p className="story-retell-kicker">{t.story.kicker}</p>
        <ol className="story-retell-path" data-animate-stagger>
          {chapters.map((chapter, index) => (
            <li key={chapter.code} className="story-retell-chapter">
              <article>
                <button
                  type="button"
                  className="story-retell-figure"
                  onClick={() =>
                    setActive({
                      src: CHAPTER_IMAGES[index],
                      alt: chapter.imageAlt,
                      code: chapter.code,
                      title: chapter.title,
                    })
                  }
                  aria-label={`${t.viewFullImage}: ${chapter.imageAlt}`}
                >
                  <span className="story-retell-mark" aria-hidden="true">
                    {chapter.code}
                  </span>
                  <img src={CHAPTER_IMAGES[index]} alt={chapter.imageAlt} loading="lazy" />
                </button>
                <p className="story-retell-cue">{chapter.cue}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.line}</p>
              </article>
            </li>
          ))}
        </ol>
        <p className="story-retell-end">{t.story.end}</p>
      </div>

      {active ? (
        <ImageLightbox image={active} onClose={() => setActive(null)} closeLabel={t.close} />
      ) : null}
    </>
  );
}
