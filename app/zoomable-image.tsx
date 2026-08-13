"use client";

import { useId, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
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

export function ImageLightbox({
  image,
  onClose,
}: {
  image: LightboxImage;
  onClose: () => void;
}) {
  const titleId = useId();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [cacheKey] = useState(() => Date.now());

  useLayoutEffect(() => {
    const root = document.createElement("div");
    root.setAttribute("data-lightbox-root", "");
    document.documentElement.appendChild(root);
    setHost(root);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      root.remove();
    };
  }, [onClose]);

  if (!host) return null;

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={overlayStyle}
      onClick={onClose}
    >
      <div className="image-lightbox-panel" style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div className="image-lightbox-toolbar">
          <p id={titleId}>
            {image.code ? <span>{image.code}</span> : null}
            {image.title ?? image.alt}
          </p>
          <button type="button" className="image-lightbox-close" onClick={onClose}>
            Close
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

export function ZoomableImage({
  src,
  alt,
  title,
  code,
  className,
  children,
}: LightboxImage & {
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={`View full image: ${alt}`}
      >
        {children}
        <img src={src} alt={alt} loading="lazy" />
      </button>
      {open ? (
        <ImageLightbox
          image={{ src, alt, title, code }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
