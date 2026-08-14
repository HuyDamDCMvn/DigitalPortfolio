"use client";

import { useState } from "react";
import { useLocale } from "./locale-provider";
import { ImageLightbox } from "./zoomable-image";

const DEMOS = [
  {
    src: "/images/sprinkler-auto-connect.gif",
    code: "01",
  },
  {
    src: "/images/grid-dimensions.gif",
    code: "02",
  },
  null,
  {
    src: "/images/space-visualize.gif",
    code: "04",
  },
  {
    src: "/images/section-by-element.gif",
    code: "05",
  },
  {
    src: "/images/avoid-clash.gif",
    code: "06",
  },
] as const;

type ToolDemo = {
  src: string;
  alt: string;
  title: string;
  code: string;
};

export function AutomationToolList() {
  const { t } = useLocale();
  const [active, setActive] = useState<ToolDemo | null>(null);

  return (
    <>
      <div className="tool-list">
        {t.automation.tools.map((tool, index) => {
          const number = String(index + 1).padStart(2, "0");
          const demo = DEMOS[index];
          if (demo) {
            return (
              <button
                key={tool.label}
                type="button"
                className="tool-list-item is-demo"
                onClick={() =>
                  setActive({
                    src: demo.src,
                    code: demo.code,
                    alt: "alt" in tool ? tool.alt : tool.label,
                    title: "title" in tool ? tool.title : tool.label,
                  })
                }
                aria-label={`${t.playDemo}: ${tool.label}`}
              >
                <span>{number}</span>
                <p>{tool.label}</p>
              </button>
            );
          }

          return (
            <div
              key={tool.label}
              className="tool-list-item is-disabled"
              aria-disabled="true"
            >
              <span>{number}</span>
              <p>
                {tool.label}
                <small>{t.noDemo}</small>
              </p>
            </div>
          );
        })}
      </div>

      {active ? (
        <ImageLightbox image={active} onClose={() => setActive(null)} closeLabel={t.close} />
      ) : null}
    </>
  );
}
