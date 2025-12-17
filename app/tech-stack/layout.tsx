import { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import type { Metadata } from "next";

interface TechStackLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "Browse by Technology | GSoC Programming Languages",
    template: "%s | GSoC Tech Stack",
  },
  description:
    "Explore Google Summer of Code organizations by programming language and technology stack. Find projects in Python, JavaScript, Java, C++, Rust, Go, TypeScript, Ruby, PHP, and more. Filter GSoC 2026 opportunities by your technical expertise.",
  keywords: [
    "GSoC programming languages",
    "Python GSoC organizations",
    "JavaScript open source projects",
    "Java GSoC projects",
    "C++ open source",
    "Rust programming GSoC",
    "Go language projects",
    "TypeScript GSoC",
    "Ruby on Rails GSoC",
    "PHP open source organizations",
    "Kotlin Android projects",
    "Swift iOS development",
    "machine learning Python projects",
    "web development JavaScript",
    "backend development GSoC",
  ],
  openGraph: {
    title: "Browse GSoC by Technology | Find Projects in Your Language",
    description:
      "Filter 200+ Google Summer of Code organizations by programming language. Find Python, JavaScript, Java, C++, and other tech stack projects.",
    url: "https://gsoc-orgs.vercel.app/tech-stack",
    images: ["/og.webp"],
  },
  alternates: {
    canonical: "https://gsoc-orgs.vercel.app/tech-stack",
  },
};

/**
 * Layout wrapper for all /tech-stack routes
 * This wraps:
 * - /tech-stack (index)
 * - /tech-stack/[stack] (detail pages)
 */
export default function TechStackLayout({ children }: TechStackLayoutProps) {
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

