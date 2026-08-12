"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export type LightboxImage = {
  src: string;
  alt: string;
  title?: string;
  code?: string;
};

export function ImageLightbox({
  image,
  onClose,
}: {
  image: LightboxImage;
  onClose: () => void;
}) {
  const titleId = useId();
  const [cacheKey] = useState(() => Date.now());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className="image-lightbox-panel" onClick={(event) => event.stopPropagation()}>
        <div className="image-lightbox-toolbar">
          <p id={titleId}>
            {image.code ? <span>{image.code}</span> : null}
            {image.title ?? image.alt}
          </p>
          <button type="button" className="image-lightbox-close" onClick={onClose}>
            Close
          </button>
        </div>
        <img key={cacheKey} src={`${image.src}?t=${cacheKey}`} alt={image.alt} />
      </div>
    </div>
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
