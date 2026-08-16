import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { VercelSpeedInsights } from "./vercel-speed-insights";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);

  return {
    title: "Digital Team — Engineering Better Ways to Work",
    description: "Digital Team portfolio: standards, training, automation, data visualization and connected BIM workflows.",
    icons: { icon: "/images/bkw-dcm-logo.svg", shortcut: "/images/bkw-dcm-logo.svg" },
    metadataBase: baseUrl,
    openGraph: {
      title: "Digital Team — Engineering Better Ways to Work",
      description: "Standards, training, automation, visualization and connected digital delivery.",
      type: "website",
      images: [{ url: new URL("/og.png", baseUrl).toString(), width: 1673, height: 941, alt: "Digital Team — Engineering better ways to work." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Digital Team — Engineering Better Ways to Work",
      description: "Standards, training, automation, visualization and connected digital delivery.",
      images: [new URL("/og.png", baseUrl).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
