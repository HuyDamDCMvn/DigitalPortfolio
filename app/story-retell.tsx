"use client";

import { useState } from "react";
import { ImageLightbox, type LightboxImage } from "./zoomable-image";

export type StoryChapter = {
  code: string;
  title: string;
  line: string;
  cue: string;
  image: string;
  imageAlt: string;
};

export function StoryRetell({ chapters }: { chapters: StoryChapter[] }) {
  const [active, setActive] = useState<(LightboxImage & { code: string; title: string }) | null>(null);

  return (
    <>
      <div className="story-retell" aria-label="Team growth told as four connected chapters">
        <p className="story-retell-kicker">Story retelling</p>
              <ol className="story-retell-path" data-animate-stagger>
          {chapters.map((chapter) => (
            <li key={chapter.code} className="story-retell-chapter">
              <article>
                <button
                  type="button"
                  className="story-retell-figure"
                  onClick={() =>
                    setActive({
                      src: chapter.image,
                      alt: chapter.imageAlt,
                      code: chapter.code,
                      title: chapter.title,
                    })
                  }
                  aria-label={`View full image: ${chapter.imageAlt}`}
                >
                  <span className="story-retell-mark" aria-hidden="true">
                    {chapter.code}
                  </span>
                  <img src={chapter.image} alt={chapter.imageAlt} loading="lazy" />
                </button>
                <p className="story-retell-cue">{chapter.cue}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.line}</p>
              </article>
            </li>
          ))}
        </ol>
        <p className="story-retell-end">From one embedded role to a connected Digital Lead view.</p>
      </div>

      {active ? <ImageLightbox image={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}
