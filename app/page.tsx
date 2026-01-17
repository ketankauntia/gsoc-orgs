import { Header } from "@/components/header";
import { HeroComponent } from "@/components/hero-component";
import { BrandsGrid } from "@/components/ui";
import {
  OrganizationsBlock,
  PreviousEditionsBlock,
  TechStackBlock,
  AnalyticsBlock,
} from "@/components/value-blocks";
import { TrendingOrgs } from "@/components/trending-orgs";
import { Testimonials } from "@/components/testimonials";
import { WaitlistCTA } from "@/components/waitlist-cta";
import { LatestArticles } from "@/components/latest-articles";
import { FaqComponent } from "@/components/faq";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { SITE_URL, getFullUrl } from "@/lib/constants";

/**
 * ISR Configuration for Homepage
 *
 * The homepage shows trending data and statistics.
 * Cache for 1 day - balances freshness with performance.
 *
 * For immediate updates: POST /api/admin/invalidate-cache { "type": "path", "path": "/" }
 */
export const revalidate = 86400; // 1 day

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
      target: `${getFullUrl("/organizations")}?q={search_term_string}`,
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
      <BrandsGrid
        title="GSoC Organizations Guide featured on"
        brands={[
          {
            name: "GDG Cloud Nagpur",
            logo: "/gdg-cloud-nagpur.webp",
            href: "https://gdg.community.dev/events/details/google-gdg-cloud-nagpur-presents-gsoc-2026-complete-guide-live-session-on-google-summer-of-code/",
          },
        ]}
      />
      {/* Primary Value Blocks */}
      <OrganizationsBlock />
      <PreviousEditionsBlock />
      <TechStackBlock />
      <AnalyticsBlock />
      {/* Social Proof & Discovery */}
      <TrendingOrgs />
      <Testimonials />
      {/* Content & Support */}
      <LatestArticles />
      <FaqComponent />
      {/* Primary CTA */}
      <WaitlistCTA />
      <Footer />
    </>
  );
}
