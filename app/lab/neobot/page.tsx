import type { Metadata } from "next";
import { NeobotPageClient } from "./neobot-view";

export const metadata: Metadata = {
  title: "Neobot study — Digital Team",
  description: "Gloss-black hard-surface robot on a studio backdrop: Blender GLB, clearcoat, softbox reflectors, bloom and depth of field.",
  robots: { index: false, follow: false },
};

export default function NeobotPage() {
  return <NeobotPageClient />;
}
