import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { archiveIndex, OrganizationProjectsView } from "@/components/cobalt/views/projects";
import {
  canonicalOrganizationSlug,
  loadOrganizationData,
} from "@/lib/organizations-page-types";
import {
  groupProjectsByYear,
  loadOrganizationProjects,
} from "@/lib/projects-page-types";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";

/**
 * Per-organization project index.
 *
 * Route: /organizations/[slug]/projects
 *
 * This page exists primarily as a crawlable hub. Project detail pages are listed
 * in the sitemap but were previously reachable only through the client-rendered
 * year tabs on the organization page, which left every project page without a
 * server-rendered incoming internal link. Rendering the full list here on the
 * server gives each project page a stable link from its own organization.
 */
export const revalidate = 2592000; // 30 days, matching the organization detail page.

// No paths at build time; each one is rendered on first visit and cached for the revalidate
// window. Without this export Next.js renders the route on every request (ISR needs it).
export async function generateStaticParams() {
  return [];
}

interface PageParams {
  params: Promise<{ slug: string }>;
}

async function loadPage(slug: string) {
  const organization = await loadOrganizationData(slug);
  if (!organization) return null;
  const projects = await loadOrganizationProjects(slug);
  return { organization, projects };
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  const page = await loadPage(canonicalSlug);
  if (!page) return buildNotFoundMetadata("Organization");

  const { organization, projects } = page;
  const years = groupProjectsByYear(projects).map((group) => group.year);
  const span =
    years.length > 1 ? `${years[years.length - 1]} to ${years[0]}` : years.length === 1 ? `${years[0]}` : null;

  return buildPageMetadata({
    title: [`${organization.name} GSoC Projects`, `${organization.name} Projects`],
    description: `Browse all ${projects.length} Google Summer of Code projects accepted at ${organization.name}.`,
    descriptionExtras: [
      span ? `Covering the ${span} program years` : null,
      "Each entry links to the contributor, mentors, technologies, and source code for that project",
    ],
    path: `/organizations/${canonicalSlug}/projects`,
    image: organization.img_r2_url,
    imageAlt: `${organization.name} logo`,
  });
}

export default async function OrganizationProjectsPage({ params }: PageParams) {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  if (canonicalSlug !== slug) redirect(`/organizations/${canonicalSlug}/projects`);

  const page = await loadPage(canonicalSlug);
  if (!page) notFound();

  const { organization, projects } = page;
  return (
    <OrganizationProjectsView
      slug={canonicalSlug}
      name={organization.name}
      groups={groupProjectsByYear(projects)}
      archive={archiveIndex(organization)}
    />
  );
}
