"use client";

import { useEffect, useState, type RefObject } from "react";

let webglCached: boolean | null = null;

export function probeWebGL() {
  if (typeof document === "undefined") return false;
  if (webglCached !== null) return webglCached;
  try {
    const canvas = document.createElement("canvas");
    webglCached = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    webglCached = false;
  }
  return webglCached;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function useInViewOnce<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = "120px",
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    // Sync check — avoid one-frame fallback flash for above-the-fold heroes.
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight;
    const margin = Number.parseInt(rootMargin, 10) || 0;
    if (rect.bottom >= -margin && rect.top <= vh + margin) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, inView]);

  return inView;
}
