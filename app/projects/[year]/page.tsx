import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadProjectsYearData, getAvailableProjectYears } from "@/lib/projects-page-types";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { ProjectsYearView } from "@/components/cobalt/views/projects";

// Static Generation - cache forever
export const revalidate = false;

// Generate static params for all known years
export async function generateStaticParams() {
  return getAvailableProjectYears().map((year) => ({
    year: year.toString(),
  }));
}

// Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const data = await loadProjectsYearData(parseInt(year));

  if (!data) {
    return buildNotFoundMetadata("Projects");
  }

  return buildPageMetadata({
    title: [data.title, `GSoC ${year} Projects`],
    description: data.description,
    descriptionExtras: [
      `Browse ${data.metrics.total_projects} accepted projects from ${data.metrics.total_organizations} organizations`,
      "Filter by organization, contributor, mentor, or technology",
    ],
    path: `/projects/${year}`,
  });
}

export default async function ProjectsYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr);

  // Load data from static JSON - single file read, no aggregation
  const data = await loadProjectsYearData(year);

  if (!data) {
    notFound();
  }

  return <ProjectsYearView data={data} />;
}
