"use client";

import { useState } from "react";
import { ImageLightbox } from "./zoomable-image";

const tools = [
  {
    label: "Auto-connect and size sprinkler systems",
    demo: {
      src: "/images/sprinkler-auto-connect.gif",
      alt: "Animation of auto-connecting and sizing a sprinkler system",
      title: "Auto Connect and Sizing Sprinkler System",
      code: "01",
    },
  },
  {
    label: "Create grid dimensions",
    demo: {
      src: "/images/grid-dimensions.gif",
      alt: "Animation of creating grid dimensions automatically",
      title: "Create grid dimensions",
      code: "02",
    },
  },
  { label: "Toggle grid bubbles" },
  {
    label: "Manage and visualize spaces",
    demo: {
      src: "/images/space-visualize.gif",
      alt: "Animation of managing and visualizing spaces in a 3D model",
      title: "Manage and visualize spaces",
      code: "04",
    },
  },
  {
    label: "Create sections by element",
    demo: {
      src: "/images/section-by-element.gif",
      alt: "Animation of creating sections by element with Smart Section",
      title: "Create sections by element",
      code: "05",
    },
  },
  { label: "Assess model performance" },
] as const;

type ToolDemo = {
  src: string;
  alt: string;
  title: string;
  code: string;
};

export function AutomationToolList() {
  const [active, setActive] = useState<ToolDemo | null>(null);

  return (
    <>
      <div className="tool-list">
        {tools.map((tool, index) => {
          const number = String(index + 1).padStart(2, "0");
          if ("demo" in tool && tool.demo) {
            return (
              <button
                key={tool.label}
                type="button"
                className="tool-list-item is-demo"
                onClick={() => setActive(tool.demo)}
                aria-label={`Play demo: ${tool.label}`}
              >
                <span>{number}</span>
                <p>{tool.label}</p>
              </button>
            );
          }

          return (
            <div key={tool.label} className="tool-list-item">
              <span>{number}</span>
              <p>{tool.label}</p>
            </div>
          );
        })}
      </div>

      {active ? <ImageLightbox image={active} onClose={() => setActive(null)} /> : null}
    </>
  );
}
