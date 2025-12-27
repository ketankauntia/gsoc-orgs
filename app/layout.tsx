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
    default: "GSoC Organizations Guide | Google Summer of Code 2026",
    template: "%s | GSoC Organizations Guide",
  },
  description: "Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities GSoC.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.ico", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "GSoC Organizations Guide",
    locale: "en_US",
    url: SITE_URL,
    title: "GSoC Organizations Guide | Google Summer of Code 2026",
    description: "Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities GSoC.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GSoC Organizations Guide | Google Summer of Code 2026",
    description: "Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities GSoC.",
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
