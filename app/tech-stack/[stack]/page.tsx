import { notFound } from "next/navigation";
import {
  loadTechStackPageData,
  loadTechStackIndexData,
} from "@/lib/tech-stack-page-types";
import { TechStackDetailClient } from "./tech-stack-detail-client";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

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
    description: `Browse ${data.metrics.org_count} Google Summer of Code organization records and ${data.metrics.project_count} projects associated with the ${data.name} technology label.`,
    openGraph: {
      title: `${data.name} | GSoC Organizations`,
      description: `Browse archived organization and project records associated with ${data.name} in Google Summer of Code.`,
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
    <div>
      <SiteBreadcrumbs
        items={[
          { label: "Tech Stack", href: "/tech-stack" },
          { label: data.name, href: `/tech-stack/${stack}` },
        ]}
        className="pb-6 pt-1"
      />
      <TechStackDetailClient data={data} />
    </div>
  );
}
