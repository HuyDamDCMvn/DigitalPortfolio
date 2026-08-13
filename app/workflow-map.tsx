"use client";

import { useId, useState } from "react";
import { WorkflowVisual3D } from "./workflow-visual-3d";

const stages = [
  {
    number: "01",
    title: "Initial setup",
    text: "Brief · review · validate · confirm · set up",
    image: "/images/initial-setup.png",
    imageAlt: "Initial setup process diagram",
    caption: "Initial setup process",
  },
  {
    number: "02",
    title: "Data scanning",
    text: "Export · store · prepare · analyze · visualize",
    image: "/images/data-scanning.png",
    imageAlt: "Data scanning process diagram",
    caption: "Data scanning process",
  },
  {
    number: "03",
    title: "IFC validation",
    text: "Health check · IDS compliance · quality report",
    image: "/images/ifc-platform.png",
    imageAlt: "IFC health check platform view",
    caption: "IFC health and validation",
    href: "https://ifc.dcm-vn.com/",
  },
] as const;

export function WorkflowMap() {
  const [active, setActive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const panelId = useId();
  const selected = active === null ? null : stages[active];
  const hoverPreview =
    selected !== null && hovered !== null && hovered !== active;

  return (
    <>
      <div className="workflow-map" aria-label="Digital workflow stages">
        {stages.map((stage, index) => {
          const isActive = active === index;
          return (
            <button
              key={stage.number}
              type="button"
              className={`workflow-stage${isActive ? " is-active" : ""}`}
              aria-expanded={isActive}
              aria-controls={panelId}
              onClick={() => setActive(isActive ? null : index)}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered((h) => (h === index ? null : h))}
            >
              <span className="workflow-number">{stage.number}</span>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </div>
              {index < stages.length - 1 ? (
                <span className="workflow-arrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <figure className="workflow-detail" id={panelId}>
          <WorkflowVisual3D
            src={
              hoverPreview && hovered !== null
                ? stages[hovered].image
                : selected.image
            }
            alt={
              hoverPreview && hovered !== null
                ? stages[hovered].imageAlt
                : selected.imageAlt
            }
            pulseKey={hoverPreview && hovered !== null ? hovered : active ?? 0}
            hoverPreview={hoverPreview}
          />
          {"href" in selected && selected.href ? (
            <figcaption>
              <a
                href={selected.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${selected.caption}`}
              >
                <span>{selected.number}</span>
                {selected.caption}
              </a>
            </figcaption>
          ) : (
            <figcaption>
              <span>{selected.number}</span>
              {selected.caption}
            </figcaption>
          )}
        </figure>
      ) : null}
    </>
  );
}
