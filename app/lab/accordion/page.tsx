import type { Metadata } from "next";
import { AccordionLabPageClient } from "./accordion-view";

export const metadata: Metadata = {
  title: "Vertical accordion (CSS) — Digital Team",
  description: "DOM-first vertical accordion study with mild perspective, used in the Digital Coordinator section.",
  robots: { index: false, follow: false },
};

export default function AccordionLabPage() {
  return <AccordionLabPageClient />;
}
