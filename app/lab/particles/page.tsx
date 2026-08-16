import type { Metadata } from "next";
import { ParticlesLabPageClient } from "./particles-view";

export const metadata: Metadata = {
  title: "Particle image canvas — Digital Team",
  description:
    "React Three Fiber study of Spline’s Particle AI Brain: MRI pial cortex with additive glow sprites. Lab only, not indexed.",
  robots: { index: false, follow: false },
};

export default function ParticlesLabPage() {
  return <ParticlesLabPageClient />;
}
