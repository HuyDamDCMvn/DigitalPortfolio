"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type LightboxImage = {
  src: string;
  alt: string;
  title?: string;
  code?: string;
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "auto",
  height: "auto",
  margin: 0,
  padding: 0,
  zIndex: 2147483646,
  background: "#031733",
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "auto",
  height: "auto",
  overflow: "hidden",
  background: "#031733",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  maxWidth: "none",
  maxHeight: "none",
  objectFit: "contain",
  objectPosition: "center",
  display: "block",
  background: "#031733",
};

function getFocusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )].filter((node) => !node.hasAttribute("disabled"));
}

export function ImageLightbox({
  image,
  onClose,
  closeLabel = "Close",
}: {
  image: LightboxImage;
  onClose: () => void;
  closeLabel?: string;
}) {
  const titleId = useId();
  const [cacheKey] = useState(() => Date.now());
  const [host] = useState(() => {
    const root = document.createElement("div");
    root.setAttribute("data-lightbox-root", "");
    return root;
  });
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.documentElement.appendChild(host);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("aria-hidden", "true");
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const focusables = getFocusables(overlay);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
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

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.removeAttribute("aria-hidden");
      window.removeEventListener("keydown", onKeyDown);
      host.remove();
      restoreRef.current?.focus();
    };
  }, [host, onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={overlayStyle}
    >
      <div className="image-lightbox-panel" style={panelStyle}>
        <div className="image-lightbox-toolbar">
          <p id={titleId}>
            {image.code ? <span>{image.code}</span> : null}
            {image.title ?? image.alt}
          </p>
          <button
            ref={closeRef}
            type="button"
            className="image-lightbox-close"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
        <img
          key={cacheKey}
          src={`${image.src}?t=${cacheKey}`}
          alt={image.alt}
          style={imageStyle}
        />
      </div>
    </div>,
    host,
  );
}

export function LightboxTrigger({
  image,
  className,
  label,
  closeLabel,
  children,
}: {
  image: LightboxImage;
  className?: string;
  label: string;
  closeLabel?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={label}>
        {children}
      </button>
      {open ? (
        <ImageLightbox image={image} onClose={() => setOpen(false)} closeLabel={closeLabel} />
      ) : null}
    </>
  );
}

export function ZoomableImage({
  src,
  alt,
  title,
  code,
  className,
  closeLabel,
  viewLabel,
  children,
}: LightboxImage & {
  className?: string;
  closeLabel?: string;
  viewLabel?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={viewLabel ?? `View full image: ${alt}`}
      >
        {children}
        <img src={src} alt={alt} loading="lazy" />
      </button>
      {open ? (
        <ImageLightbox
          image={{ src, alt, title, code }}
          onClose={() => setOpen(false)}
          closeLabel={closeLabel}
        />
      ) : null}
    </>
  );
}
