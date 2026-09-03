import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { OrganizationClient } from "./organization-client";
import { FooterSmall } from "@/components/footer-small";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { canonicalOrganizationSlug, loadOrganizationData } from "@/lib/organizations-page-types";
import { loadOrganizationProjects } from "@/lib/projects-page-types";

/**
 * Organization Detail Page
 * Route: /organizations/[slug]
 * 
 * Comprehensive organization profile with:
 * - Header with logo, name, description, and social links
 * - GSoC participation history
 * - Technologies and topics
 * - Past projects with year tabs
 * - Participation and project charts
 * - Programming languages and difficulty distribution
 * - Organization-specific FAQ
 * 
 * Uses static JSON by default, falls back to API if JSON not available.
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
  // Try static JSON first
  const jsonData = await loadOrganizationData(slug);
  if (jsonData) {
    return jsonData as OrganizationWithStats;
  }

  // Fallback to API if JSON not available
  try {
    return await apiFetchServer<OrganizationWithStats>(`/api/organizations/${slug}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function countOrganizationProjects(slug: string): Promise<number> {
  return (await loadOrganizationProjects(slug)).length;
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
  const org = await getOrganization(canonicalSlug);

  if (!org) {
    notFound();
  }

  // Server-rendered so crawlers reach the project index without executing the
  // organization page's client-side year tabs.
  const projectCount = await countOrganizationProjects(canonicalSlug);

  return (
    <>
      <OrganizationClient organization={org} />
      {projectCount > 0 ? (
        <div className="mx-auto max-w-6xl px-6 pb-12">
          <Link
            href={`/organizations/${canonicalSlug}/projects`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Browse all {projectCount} {org.name} GSoC projects
          </Link>
        </div>
      ) : null}
      <FooterSmall />
    </>
  );
}
