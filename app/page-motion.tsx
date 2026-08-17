"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function PageMotion({ children, id }: { children: ReactNode; id?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            ".hero-copy > *",
            ".hero-visual",
            ".section-heading",
            "[data-animate]",
            "[data-animate-stagger] > *",
          ],
          { clearProps: "all" },
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".site-header", {
          opacity: 0,
          y: -16,
          duration: 0.7,
          ease: "power2.out",
          delay: 0.15,
        });

        const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
        hero
          .from(".hero-copy > *", {
            opacity: 0,
            y: 28,
            duration: 0.8,
            stagger: 0.1,
          })
          .from(
            ".hero-visual",
            {
              opacity: 0,
              y: 40,
              scale: 0.96,
              duration: 1,
            },
            "-=0.55",
          );

        gsap.to(".hero-visual", {
          y: -18,
          duration: 4.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        gsap.utils.toArray<HTMLElement>(".section-heading").forEach((heading) => {
          gsap.from(heading.children, {
            opacity: 0,
            y: 36,
            duration: 0.75,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-animate]").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 42,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-animate-stagger]").forEach((group) => {
          gsap.from(group.children, {
            opacity: 0,
            y: 32,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} id={id} className="page-motion">
      {children}
    </div>
  );
}
