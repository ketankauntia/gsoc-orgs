import { ReactNode } from "react";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";

// Force revalidation to ensure footer links stay updated
// This prevents serving stale cached HTML with old links
export const revalidate = 3600; // Revalidate every hour

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
  
  return {
    title: `GSoC ${year} Organizations | Google Summer of Code`,
    description: `Explore all organizations that participated in Google Summer of Code ${year}. Find projects, tech stacks, and difficulty levels.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `GSoC ${year} Organizations`,
      description: `Explore all organizations that participated in Google Summer of Code ${year}.`,
      url: getFullUrl(`/${slug}`),
      type: "website",
      siteName: "GSoC Organizations Guide",
      images: [
        {
          url: getFullUrl("/og/gsoc-organizations-guide.jpg"),
          width: 1200,
          height: 630,
          alt: "GSoC Organizations Guide",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `GSoC ${year} Organizations`,
      description: `Explore all organizations that participated in Google Summer of Code ${year}.`,
      images: [getFullUrl("/og/gsoc-organizations-guide.jpg")],
    },
    alternates: {
      canonical: getFullUrl(`/${slug}`),
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

