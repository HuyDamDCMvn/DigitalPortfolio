"use client";

import { useId, useState } from "react";
import { useLocale } from "./locale-provider";
import { LightboxTrigger } from "./zoomable-image";
import { WorkflowVisual3D } from "./workflow-visual-3d";

const STAGE_MEDIA = [
  { image: "/images/initial-setup.png" },
  { image: "/images/data-scanning.png" },
  { image: "/images/ifc-platform.png", href: "https://ifc.dcm-vn.com/" },
] as const;

export function WorkflowMap() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const panelId = useId();
  const stages = t.workflow.stages;
  const selected = stages[active];
  const selectedMedia = STAGE_MEDIA[active];
  const hoverPreview = hovered !== null && hovered !== active;
  const previewIndex = hoverPreview && hovered !== null ? hovered : active;
  const preview = stages[previewIndex];
  const previewMedia = STAGE_MEDIA[previewIndex];

  return (
    <>
      <div className="workflow-map" aria-label={t.workflow.label}>
        {stages.map((stage, index) => {
          const isActive = active === index;
          return (
            <button
              key={stage.number}
              type="button"
              className={`workflow-stage${isActive ? " is-active" : ""}`}
              aria-expanded={isActive}
              aria-controls={panelId}
              onClick={() => setActive(index)}
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

      {selected && selectedMedia ? (
        <figure className="workflow-detail" id={panelId}>
          <WorkflowVisual3D
            src={previewMedia.image}
            alt={preview.imageAlt}
            pulseKey={previewIndex}
            hoverPreview={hoverPreview}
          />
          <figcaption>
            {"href" in selectedMedia && selectedMedia.href ? (
              <a
                href={selectedMedia.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t.openIfc}: ${selected.caption}`}
              >
                <span>{selected.number}</span>
                {selected.caption}
              </a>
            ) : (
              <p>
                <span>{selected.number}</span>
                {selected.caption}
              </p>
            )}
            <LightboxTrigger
              className="workflow-view-diagram"
              label={`${t.viewDiagram}: ${selected.caption}`}
              closeLabel={t.close}
              image={{
                src: selectedMedia.image,
                alt: selected.imageAlt,
                title: selected.caption,
                code: selected.number,
              }}
            >
              {t.viewDiagram}
            </LightboxTrigger>
          </figcaption>
        </figure>
      ) : null}
    </>
  );
}
