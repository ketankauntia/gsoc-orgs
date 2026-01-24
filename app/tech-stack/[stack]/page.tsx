import { notFound } from "next/navigation";
import {
  loadTechStackPageData,
  loadTechStackIndexData,
} from "@/lib/tech-stack-page-types";
import { TechStackDetailClient } from "./tech-stack-detail-client";

// Static Generation - cache forever, NO dynamic behavior
export const revalidate = false;
export const dynamic = 'force-static';

// Generate static params for all technologies
export async function generateStaticParams() {
  const indexData = await loadTechStackIndexData();
  if (!indexData) return [];
  
  return indexData.all_techs.map((tech) => ({
    stack: tech.slug,
  }));
}

// Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ stack: string }>;
}) {
  const { stack } = await params;
  const data = await loadTechStackPageData(stack);

  if (!data) {
    return { title: "Technology Not Found" };
  }

  return {
    title: `${data.name} | GSoC Organizations`,
    description: `Explore ${data.metrics.org_count} Google Summer of Code organizations using ${data.name}. View projects, trends, and find opportunities.`,
    openGraph: {
      title: `${data.name} | GSoC Organizations`,
      description: `Explore ${data.metrics.org_count} organizations using ${data.name} in Google Summer of Code`,
    },
  };
}

export default async function TechStackDetailPage({
  params,
}: {
  params: Promise<{ stack: string }>;
}) {
  const { stack } = await params;

  // Load data from static JSON - SINGLE FILE READ, NO AGGREGATION
  const data = await loadTechStackPageData(stack);

  if (!data) {
    notFound();
  }

  return (
    <TechStackDetailClient data={data} />
  );
}
