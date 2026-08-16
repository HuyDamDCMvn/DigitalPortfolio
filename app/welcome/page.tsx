import type { Metadata } from "next";
import { NeobotPageClient } from "../lab/neobot/neobot-view";

export const metadata: Metadata = {
  title: "Digital Welcome — Digital Team",
  description:
    "Digital Welcome: enter the Digital Team portfolio through NEXBOT on a cosmic stage. Click the robot or Digital to continue.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://digital-portfolio-olive-ten.vercel.app/welcome" },
  openGraph: {
    title: "Digital Welcome — Digital Team",
    description:
      "Enter the Digital Team portfolio through NEXBOT on a cosmic stage.",
    url: "https://digital-portfolio-olive-ten.vercel.app/welcome",
    type: "website",
  },
};

export default function DigitalWelcomePage() {
  return <NeobotPageClient />;
}
