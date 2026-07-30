import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import { ThemeProvider } from "@/components/theme-provider";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";

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
    default: "GSoC Atlas — Explore Organizations, Projects & Technologies",
    template: "%s | GSoC Atlas",
  },
  description:
    "Explore Google Summer of Code organizations, projects, technologies, topics, and participation history in one independent research guide.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "GSoC Atlas",
    locale: "en_US",
    url: SITE_URL,
    title: "GSoC Atlas — Google Summer of Code, mapped",
    description:
      "Explore organizations, projects, technologies, topics, and participation history.",
    images: [
      {
        url: `${SITE_URL}/og/gsoc-organizations-guide.jpg`,
        width: 1200,
        height: 630,
        alt: "GSoC Atlas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GSoC Atlas — Google Summer of Code, mapped",
    description:
      "Explore organizations, projects, technologies, topics, and participation history.",
    images: [`${SITE_URL}/og/gsoc-organizations-guide.jpg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#171615",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="gsoc-theme"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </ThemeProvider>
        <WebVitalsReporter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

