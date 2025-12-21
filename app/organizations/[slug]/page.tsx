import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { OrganizationClient } from "./organization-client";
import { FooterSmall } from "@/components/footer-small";
import { getFullUrl } from "@/lib/constants";

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
 */

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
  try {
    return await apiFetchServer<OrganizationWithStats>(`/api/organizations/${slug}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    return {
      title: "Organization Not Found",
    };
  }

  return {
    title: `${org.name} - GSoC Organizations Guide`,
    description: org.description || `Learn about ${org.name} and their Google Summer of Code projects, technologies, and opportunities.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${org.name} - GSoC Organizations Guide`,
      description: org.description || `Learn about ${org.name} and their Google Summer of Code projects.`,
      images: org.img_r2_url ? [org.img_r2_url] : ["/og.webp"],
    },
    alternates: {
      canonical: getFullUrl(`/organizations/${slug}`),
    },
  };
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  return (
    <>
      <OrganizationClient organization={org} />
      <FooterSmall />
    </>
  );
}
