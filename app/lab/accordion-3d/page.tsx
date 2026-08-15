import type { Metadata } from "next";
import { Accordion3dLabPageClient } from "./accordion-3d-view";

export const metadata: Metadata = {
  title: "Vertical accordion (R3F) — Digital Team",
  description: "React Three Fiber study of the vertical accordion, paired with an accessible DOM twin.",
  robots: { index: false, follow: false },
};

export default function Accordion3dLabPage() {
  return <Accordion3dLabPageClient />;
}
