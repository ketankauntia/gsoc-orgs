import { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import type { Metadata } from "next";

interface OrganizationsLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "All Organizations | GSoC 2026",
    template: "%s | GSoC Organizations",
  },
  description:
    "Browse all Google Summer of Code (GSoC) participating organizations. Filter by programming language (Python, JavaScript, Java, C++), difficulty level, and technology stack. Find beginner-friendly open-source projects for GSoC 2026.",
  keywords: [
    "GSoC organizations list",
    "Google Summer of Code participating orgs",
    "open source organizations",
    "GSoC 2026 organizations",
    "Python organizations GSoC",
    "JavaScript GSoC projects",
    "beginner friendly GSoC orgs",
    "machine learning GSoC",
    "web development open source",
    "cloud computing GSoC",
    "mobile development projects",
  ],
  openGraph: {
    title: "All GSoC Organizations | Find Your Perfect Match",
    description:
      "Explore 200+ Google Summer of Code organizations. Filter by tech stack, difficulty, and find projects that match your skills and interests.",
    url: "https://gsoc-orgs.vercel.app/organizations",
    images: ["/og.webp"],
  },
  alternates: {
    canonical: "https://gsoc-orgs.vercel.app/organizations",
  },
}

/**
 * Layout wrapper for all /organizations/* routes
 * This wraps:
 * - /organizations
 * - /organizations/[slug]
 * - /organizations/[slug]/projects
 * etc.
 */
export default function OrganizationsLayout({
  children,
}: OrganizationsLayoutProps) {
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

      {/* Smaller footer for organizations pages */}
      <FooterSmall />
    </div>
  );
}

