import { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import type { Metadata } from "next";

interface TopicsLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "Browse by Topic | GSoC Project Categories",
    template: "%s | GSoC Topics"
  },
  description: "Explore Google Summer of Code projects by topic and category. Find opportunities in Web Development, Machine Learning, Cloud Computing, Mobile Development, DevOps, AI, Blockchain, Security, Data Science, and more for GSoC 2026.",
  keywords: [
    "GSoC topics",
    "web development GSoC",
    "machine learning projects",
    "AI open source projects",
    "cloud computing GSoC",
    "mobile development opportunities",
    "DevOps GSoC projects",
    "blockchain development",
    "cybersecurity open source",
    "data science GSoC",
    "frontend development",
    "backend engineering",
    "full stack projects",
    "IoT open source",
    "game development GSoC"
  ],
  openGraph: {
    title: "Browse GSoC by Topic | Find Projects by Category",
    description: "Discover Google Summer of Code organizations filtered by project topics: Web Dev, ML, Cloud, Mobile, DevOps, AI, and more.",
    url: "https://gsoc-orgs.vercel.app/topics",
    images: ["/og.webp"],
  },
  alternates: {
    canonical: "https://gsoc-orgs.vercel.app/topics",
  },
};

/**
 * Layout wrapper for all /topics routes
 * This wraps:
 * - /topics (index)
 * - /topics/[topic] (detail pages)
 */
export default function TopicsLayout({ children }: TopicsLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - same across all pages */}
      <Header />
      
      {/* Main content area with consistent max-width */}
      {/* pt-20 accounts for fixed header height */}
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          {children}
        </Container>
      </main>
      
      {/* Smaller footer */}
      <FooterSmall />
    </div>
  );
}

