import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { Organization } from "@/lib/api";
import { CobaltProfile } from "@/components/cobalt/profile";
import { cobaltOrganization } from "@/components/cobalt/data";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { canonicalOrganizationSlug, loadOrganizationData } from "@/lib/organizations-page-types";

/**
 * Organization Detail Page
 * Route: /organizations/[slug]
 * 
 * Organization profile: status, contributors per cycle against the median organization,
 * where to start, stack and topics, quick answers, accepted projects by year (linked to their
 * project pages) and similar organizations.
 * 
 * Reads the static organization JSON (no request-time API fallback, so the page can be cached).
 */

/**
 * ISR Configuration for Organization Detail Pages
 *
 * Organization data changes rarely (yearly updates).
 * Cache for 30 days for optimal performance.
 *
 * For immediate updates after data changes:
 * POST /api/admin/invalidate-cache { "type": "organization", "slug": "org-slug" }
 */
export const revalidate = 2592000; // 30 days

// No paths at build time; each one is rendered on first visit and cached for the revalidate
// window. Without this export Next.js renders the route on every request (ISR needs it).
export async function generateStaticParams() {
  return [];
}

// Extend the Organization type with full stats
interface OrganizationWithStats extends Organization {
  stats?: {
    avg_projects_per_appeared_year: number;
    projects_by_year: Record<string, number>;
    students_by_year: Record<string, number>;
    total_students: number;
  };
  years?: Record<string, {
    num_projects: number;
    projects_url: string;
    projects: Array<{
      id: string;
      title: string;
      short_description: string;
      description: string;
      student_name: string;
      difficulty?: string;
      tags: string[];
      slug: string;
      status?: string;
      code_url?: string;
      project_url: string;
    }>;
  }>;
}

async function getOrganization(slug: string): Promise<OrganizationWithStats | null> {
  // Static JSON only: the page is cached (ISR), so it must not read request headers, and the
  // profile needs the organization in the static index anyway.
  return (await loadOrganizationData(slug)) as OrganizationWithStats | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  const org = await getOrganization(canonicalSlug);

  if (!org) {
    return buildNotFoundMetadata("Organization");
  }

  const years = org.years ? Object.keys(org.years).sort() : [];
  const participationSpan =
    years.length > 1
      ? `Participating in Google Summer of Code from ${years[0]} to ${years[years.length - 1]}`
      : years.length === 1
        ? `Participated in Google Summer of Code ${years[0]}`
        : null;

  return buildPageMetadata({
    title: [`${org.name} - GSoC Organization`, org.name],
    description: org.description,
    descriptionExtras: [
      participationSpan,
      `Browse ${org.name}'s accepted GSoC projects, technologies, topics, and contributor history`,
    ],
    path: `/organizations/${canonicalSlug}`,
    image: org.img_r2_url,
    imageAlt: `${org.name} logo`,
  });
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  if (canonicalSlug !== slug) redirect(`/organizations/${canonicalSlug}`);
  if (!cobaltOrganization(canonicalSlug)) notFound();
  // Every year's projects are in the HTML (tabs only toggle visibility, ?year= deep links
  // still work), so the page is cached for the revalidate window and fully crawlable.
  return <CobaltProfile slug={canonicalSlug} />;
}
