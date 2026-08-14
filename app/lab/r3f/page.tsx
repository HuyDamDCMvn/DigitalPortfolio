import type { Metadata } from "next";
import { R3fLabPageClient } from "./lab-view";

export const metadata: Metadata = {
  title: "R3F Lab — Digital Team",
  description: "Sandbox for React Three Fiber, drei, and custom shaders.",
  robots: { index: false, follow: false },
};

export default function R3fLabPage() {
  return <R3fLabPageClient />;
}
