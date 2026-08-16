import type { Metadata } from "next";
import { CardsLabPageClient } from "./cards-view";

export const metadata: Metadata = {
  title: "Metal card fan — Digital Team",
  description:
    "React Three Fiber study of a scroll-driven metal card fan: navy plates, cyan rim light, polar spread. Lab only, not linked from the portfolio.",
  robots: { index: false, follow: false },
};

export default function CardsLabPage() {
  return <CardsLabPageClient />;
}
