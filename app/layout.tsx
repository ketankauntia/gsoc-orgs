import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Crack GSoC 2026 – Find the Best Organizations to Get Selected",
    template: "%s | GSoC Organizations Guide",
  },
  description: "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "GSoC Organizations Guide",
    locale: "en_US",
    url: SITE_URL,
    title: "Crack GSoC 2026 – Find the Best Organizations to Get Selected",
    description: "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
    images: [
      {
        url: `${SITE_URL}/og/gsoc-organizations-guide.jpg`,
        width: 1200,
        height: 630,
        alt: "GSoC Organizations Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crack GSoC 2026 – Find the Best Organizations to Get Selected",
    description: "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
    images: [`${SITE_URL}/og/gsoc-organizations-guide.jpg`],
  },
  // themeColor: "#000000", // Commented out - should be moved to viewport export per Next.js recommendation
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
