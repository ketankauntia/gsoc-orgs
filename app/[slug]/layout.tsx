import { ReactNode } from "react";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import type { Metadata } from "next";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

// Parse slug to extract year from format: gsoc-YYYY-organizations
function parseGSoCSlug(slug: string): string | null {
  const match = slug.match(/^gsoc-(\d{4})-organizations$/);
  return match ? match[1] : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const year = parseGSoCSlug(slug);
  
  // Default metadata if parsing fails
  if (!year) {
    return {
      title: "GSoC Organizations | Google Summer of Code",
      description: "Explore organizations participating in Google Summer of Code.",
    };
  }

  const yearNum = parseInt(year, 10);
  const isUpcoming = yearNum > new Date().getFullYear();
  const isPast = yearNum < new Date().getFullYear();
  
  const statusText = isUpcoming ? "Upcoming" : isPast ? "Archive" : "Current";
  
  return {
    title: `GSoC ${year} Organizations | ${statusText} Participating Orgs`,
    description: `Complete list of Google Summer of Code ${year} organizations. Browse ${statusText.toLowerCase()} participating organizations, filter by programming language, difficulty level, and project topics. Find beginner-friendly open-source projects for GSoC ${year}.`,
    keywords: [
      `GSoC ${year}`,
      `Google Summer of Code ${year}`,
      `GSoC ${year} organizations`,
      `GSoC ${year} projects`,
      `open source ${year}`,
      `student coding programs ${year}`,
      `${year} summer internships`,
      `programming opportunities ${year}`,
      `beginner projects ${year}`,
      `Python projects GSoC ${year}`,
      `JavaScript GSoC ${year}`,
      `machine learning GSoC ${year}`,
    ],
    openGraph: {
      title: `GSoC ${year} Organizations | Complete List & Statistics`,
      description: `Explore all Google Summer of Code ${year} participating organizations with detailed insights, tech stacks, and difficulty levels.`,
      url: `https://gsoc-orgs.vercel.app/${slug}`,
      images: ["/og.webp"],
    },
    alternates: {
      canonical: `https://gsoc-orgs.vercel.app/${slug}`,
    },
  };
}

export default function GSoCYearOrganizationsLayout({
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        {children}
      </main>
      <FooterSmall />
    </div>
  );
}

