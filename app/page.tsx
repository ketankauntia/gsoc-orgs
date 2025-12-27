import { Header } from "@/components/header";
import { HeroComponent } from "@/components/hero-component";
import { TrendingOrgs } from "@/components/trending-orgs";
import { FaqComponent } from "@/components/faq";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { SITE_URL, getFullUrl } from "@/lib/constants";

// Force revalidation to ensure footer links stay updated
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Crack GSoC 2026 – Find the Best Organizations to Get Selected",
  description:
    "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
  keywords: [
    "GSoC 2026",
    "Google Summer of Code organizations",
    "open source projects for students",
    "beginner friendly coding projects",
    "summer coding internship",
    "student developer programs",
    "Python GSoC projects",
    "JavaScript open source",
    "machine learning projects GSoC",
  ],
  openGraph: {
    title: "Crack GSoC 2026 – Find the Best Organizations to Get Selected",
    description:
      "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
    url: SITE_URL,
    type: "website",
    siteName: "GSoC Organizations Guide",
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
    description:
      "AI-powered GSoC organization insights and visual analytics to identify high-impact orgs and improve your GSoC 2026 selection chances.",
    images: [`${SITE_URL}/og/gsoc-organizations-guide.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GSoC Organizations Explorer",
    description:
      "Explore and discover Google Summer of Code participating organizations, projects, and opportunities for student developers.",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${getFullUrl('/organizations')}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <HeroComponent />
      <TrendingOrgs />
      <FaqComponent />
      <Footer />
    </>
  );
}
