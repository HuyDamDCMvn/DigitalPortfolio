import type { Metadata } from "next";
import { NeobotPageClient } from "../lab/neobot/neobot-view";

export const metadata: Metadata = {
  title: "Digital Welcome — Digital Team",
  description:
    "Digital Welcome: enter the Digital Team portfolio through NEXBOT on a cosmic stage. Click the robot or Digital to continue.",
};

export default function DigitalWelcomePage() {
  return <NeobotPageClient />;
}
