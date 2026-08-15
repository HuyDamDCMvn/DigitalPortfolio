"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type RoleAccordionItem = {
  number: string;
  title: string;
  text: string;
};

type RoleAccordionProps = {
  items: RoleAccordionItem[];
  /** Accessible name of the whole group */
  label: string;
  expandLabel: string;
  collapseLabel: string;
  /** Controlled open row. Omit to let the component own the state. */
  openIndex?: number | null;
  onOpenChange?: (index: number | null) => void;
  defaultOpenIndex?: number | null;
  className?: string;
};

export function RoleAccordion({
  items,
  label,
  expandLabel,
  collapseLabel,
  openIndex,
  onOpenChange,
  defaultOpenIndex = 0,
  className,
}: RoleAccordionProps) {
  const uid = useId();
  const controlled = openIndex !== undefined;
  const [internalOpen, setInternalOpen] = useState<number | null>(defaultOpenIndex);
  const current = controlled ? (openIndex ?? null) : internalOpen;

  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setOpen = useCallback(
    (next: number | null) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  // Escape collapses the open row when focus sits inside it.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || current === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const row = rowRefs.current[current];
      const target = event.target as Node | null;
      if (!row || !target || !row.contains(target)) return;
      event.stopPropagation();
      setOpen(null);
      triggerRefs.current[current]?.focus();
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [current, setOpen]);

  return (
    <div
      ref={rootRef}
      className={className ? `role-accordion ${className}` : "role-accordion"}
      role="group"
      aria-label={label}
    >
      {items.map((item, index) => {
        const open = current === index;
        const triggerId = `${uid}-role-trigger-${index}`;
        const panelId = `${uid}-role-panel-${index}`;

        return (
          <div
            key={item.number}
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            className={open ? "role-accordion-row is-open" : "role-accordion-row"}
          >
            <h3 className="role-accordion-heading">
              <button
                type="button"
                id={triggerId}
                ref={(node) => {
                  triggerRefs.current[index] = node;
                }}
                className="role-accordion-trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen(open ? null : index)}
              >
                <span className="role-accordion-number" aria-hidden="true">
                  {item.number}
                </span>
                <span className="role-accordion-title">{item.title}</span>
                <span className="role-accordion-hint">
                  {open ? collapseLabel : expandLabel}
                </span>
                <span className="role-accordion-icon" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </button>
            </h3>
            <div
              className="role-accordion-panel"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              inert={!open}
            >
              <div className="role-accordion-panel-clip">
                <p>{item.text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
