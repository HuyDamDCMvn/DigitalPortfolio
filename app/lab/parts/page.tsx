import type { Metadata } from "next";
import { PartsPageClient } from "./parts-view";

export const metadata: Metadata = {
  title: "3D parts — Digital Team",
  description: "Bookshelf-table meshes hung on a web page with React Three Fiber.",
  robots: { index: false, follow: false },
};

export default function PartsPage() {
  return <PartsPageClient />;
}
