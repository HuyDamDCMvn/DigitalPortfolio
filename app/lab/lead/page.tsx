import type { Metadata } from "next";
import { LeadPageClient } from "./lead-view";

export const metadata: Metadata = {
  title: "Digital Lead 3D — Digital Team",
  description: "story-04-lead.png rebuilt as separate named-mesh GLB parts.",
  robots: { index: false, follow: false },
};

export default function LeadLabPage() {
  return <LeadPageClient />;
}
