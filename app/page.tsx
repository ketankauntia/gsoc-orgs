import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";
import { AtlasHome } from "@/components/home/atlas-home";
import { loadHomepageData } from "@/lib/homepage-types";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";
import { loadTopicsIndexData } from "@/lib/topics-page-types";
import { SITE_URL, getFullUrl } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: {
    absolute: "GSoC Atlas — Google Summer of Code, mapped",
  },
  description:
    "Search and evaluate Google Summer of Code organizations using projects, technologies, topics, participation history, and practical guides.",
  keywords: [
    "GSoC organizations",
    "Google Summer of Code organizations",
    "GSoC projects",
    "GSoC technologies",
    "open source organizations",
    "GSoC organization history",
  ],
  openGraph: {
    title: "GSoC Atlas — Google Summer of Code, mapped",
    description:
      "Search organizations and study their projects, technologies, topics, and participation history.",
    url: SITE_URL,
    type: "website",
    siteName: "GSoC Atlas",
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
      "Search organizations and study their projects, technologies, topics, and participation history.",
    images: [`${SITE_URL}/og/gsoc-organizations-guide.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function Home() {
  const [homepageData, technologyData, topicData] = await Promise.all([
    loadHomepageData(),
    loadTechStackIndexData(),
    loadTopicsIndexData(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GSoC Atlas",
    alternateName: "GSoC Organizations Guide",
    description:
      "An independent explorer for Google Summer of Code organizations, projects, technologies, topics, and participation history.",
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
      <Header variant="home" />
      <main>
        <AtlasHome
          data={homepageData}
          technologyCount={technologyData?.metrics.total_technologies ?? 0}
          topicCount={topicData?.total ?? 0}
        />
      </main>
      <Footer variant="home" />
    </>
  );
}
