import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gsoc-orgs.vercel.app"), // Update with your actual domain
  title: {
    default: "GSoC Organizations Explorer | Google Summer of Code 2026",
    template: "%s | GSoC Organizations Explorer",
  },
  description:
    "Discover and explore Google Summer of Code (GSoC) organizations, projects, and opportunities. Find the perfect open-source organization for GSoC 2026 with detailed insights on programming languages, difficulty levels, and project ideas.",
  keywords: [
    "Google Summer of Code",
    "GSoC",
    "GSoC 2026",
    "open source",
    "student programming",
    "coding internship",
    "software development",
    "Python projects",
    "JavaScript projects",
    "beginner friendly projects",
    "open source organizations",
    "GSoC organizations",
    "student developer program",
    "tech internship",
    "programming mentorship",
  ],
  authors: [{ name: "GSoC Organizations Explorer" }],
  creator: "GSoC Organizations Explorer",
  publisher: "GSoC Organizations Explorer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gsoc-orgs.vercel.app",
    title:
      "GSoC Organizations Explorer | Find Your Perfect Open Source Project",
    description:
      "Explore 200+ Google Summer of Code organizations. Filter by programming language, difficulty level, and technology stack to find your ideal GSoC project.",
    siteName: "GSoC Organizations Explorer",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 630,
        alt:
          "GSoC Organizations Explorer - Find Your Perfect Open Source Project",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GSoC Organizations Explorer | Google Summer of Code 2026",
    description:
      "Discover 200+ Google Summer of Code organizations and find your perfect open-source project match.",
    images: ["/og.webp"],
    creator: "@gsocorgs", // Update with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.webp", sizes: "32x32", type: "image/webp" },
      { url: "/logo.webp", sizes: "16x16", type: "image/webp" },
    ],
    apple: [{ url: "/logo.webp", sizes: "180x180", type: "image/webp" }],
    other: [
      {
        rel: "mask-icon",
        url: "/logo.webp",
      },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://gsoc-orgs.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://gsoc-orgs.vercel.app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
