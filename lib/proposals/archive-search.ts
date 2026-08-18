import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  archivePageRange,
  normalizeArchiveQuery,
  type ArchiveOrganization,
  type ArchiveQueryInput,
} from "@/lib/proposals/archive-search-core";
import { groupTechnologies, type TechnologyGroup } from "@/lib/vocabulary/technology";
import { canonicalTechnology } from "@/lib/vocabulary/catalog";
import { loadOrganizationsIndexData, loadOrganizationsMetadata } from "@/lib/organizations-page-types";
import { getAvailableProjectYears, loadProjectsYearData } from "@/lib/projects-page-types";

/**
 * The public, sign-in-free half of the proposal library: search the archived
 * GSoC selections themselves, not just the documents already uploaded. Every
 * result either links to an approved proposal or invites the contributor who
 * owns it to claim the slot.
 */

export type ArchiveContributor = { id: string; name: string; ordinal: number };

export type ArchiveResult = {
  projectId: string;
  externalId: string;
  title: string;
  abstract: string | null;
  year: number;
  organizationSlug: string;
  organizationName: string;
  contributors: ArchiveContributor[];
  mentors: string[];
  /** Public slug of the approved proposal for this project, when one exists. */
  proposalSlug: string | null;
};

export type ArchiveFacets = {
  years: number[];
  organizations: ArchiveOrganization[];
  technologies: TechnologyGroup[];
  totals: { projects: number; organizations: number; technologies: number; firstYear: number | null; lastYear: number | null };
};

export type ArchiveQuery = ArchiveQueryInput;

const PAGE_SIZE = 20;
const EMPTY_FACETS: ArchiveFacets = {
  years: [], organizations: [], technologies: [],
  totals: { projects: 0, organizations: 0, technologies: 0, firstYear: null, lastYear: null },
};

/**
 * PostgREST caps an un-ranged select at 1000 rows and returns the truncation
 * silently. `organization_technologies` is well past that, so every full-table
 * read here has to page explicitly or the facet counts come out wrong.
 */
async function selectAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

/** Everything the three choosers need. The database work is cached across requests, then deduplicated per render. */
async function loadArchiveFacets(): Promise<ArchiveFacets> {
  if (!isSupabaseAdminConfigured()) return EMPTY_FACETS;
  const admin = createAdminClient();

  const [years, organizations, technologies, links] = await Promise.all([
    admin.from("year_stats").select("year,projects").order("year", { ascending: false }),
    selectAllRows<{ slug: string; name: string; total_projects: number; active_years: number[] }>((from, to) =>
      admin.from("organizations").select("slug,name,total_projects,active_years").order("name").range(from, to),
    ),
    selectAllRows<{ id: string; slug: string; name: string }>((from, to) =>
      admin.from("technologies").select("id,slug,name").order("slug").range(from, to),
    ),
    selectAllRows<{ technology_id: string }>((from, to) =>
      admin.from("organization_technologies").select("technology_id").order("technology_id").range(from, to),
    ),
  ]);
  if (years.error) throw new Error(years.error.message);

  // Popularity for the technology chooser, so the useful options surface first.
  const orgCounts = new Map<string, number>();
  for (const row of links) {
    const id = String(row.technology_id);
    orgCounts.set(id, (orgCounts.get(id) ?? 0) + 1);
  }

  const archiveYears = (years.data ?? []).map((row) => Number(row.year));
  const groupedTechnologies = groupTechnologies(
    technologies.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      orgCount: orgCounts.get(String(row.id)) ?? 0,
    })),
  ).filter((group) => group.orgCount > 0);

  return {
    years: archiveYears,
    organizations: organizations.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      projectCount: Number(row.total_projects ?? 0),
      years: (row.active_years ?? []).map(Number).filter((year) => archiveYears.includes(year)),
    })),
    technologies: groupedTechnologies,
    totals: {
      projects: (years.data ?? []).reduce((sum, row) => sum + Number(row.projects ?? 0), 0),
      organizations: organizations.length,
      technologies: groupedTechnologies.length,
      firstYear: archiveYears.at(-1) ?? null,
      lastYear: archiveYears[0] ?? null,
    },
  };
}

const getCachedArchiveFacets = unstable_cache(loadArchiveFacets, ["proposal-archive-facets-v2"], {
  revalidate: 3600,
  tags: ["proposal-archive-facets"],
});

async function loadStaticArchiveFacets(): Promise<ArchiveFacets> {
  const years = [...getAvailableProjectYears()].sort((a, b) => b - a);
  const [index, metadata, ...projectDocuments] = await Promise.all([
    loadOrganizationsIndexData(),
    loadOrganizationsMetadata(),
    ...years.map(loadProjectsYearData),
  ]);
  if (!index || !metadata) return EMPTY_FACETS;

  const technologies = groupTechnologies(metadata.technologies.map((technology) => {
    const canonical = canonicalTechnology(technology.name);
    return { slug: canonical.slug, name: technology.name, orgCount: technology.count };
  }));

  return {
    years,
    organizations: index.organizations.map((organization) => ({
      slug: organization.slug,
      name: organization.name,
      projectCount: organization.total_projects,
      years: organization.active_years.filter((year) => !organization.withdrawn_years?.includes(year)),
    })),
    technologies,
    totals: {
      projects: projectDocuments.reduce((sum, document) => sum + (document?.metrics.total_projects ?? 0), 0),
      organizations: index.total,
      technologies: technologies.length,
      firstYear: years.at(-1) ?? null,
      lastYear: years[0] ?? null,
    },
  };
}

export const getArchiveFacets = cache(async () => {
  try {
    return await getCachedArchiveFacets();
  } catch (error) {
    console.error("[proposal archive facets] using static fallback", error);
    return loadStaticArchiveFacets();
  }
});

/**
 * Organizations tagged with a technology group.
 *
 * `project_technologies` is empty in the current dataset — Google exposes tech
 * tags on the organization profile, never on the individual archived project —
 * so a technology filter can only narrow to "projects at organizations that
 * work with this technology". The UI states that explicitly rather than
 * implying per-project precision the data cannot support.
 */
async function organizationSlugsForTechnology(technologyKey: string): Promise<string[] | null> {
  const facets = await getArchiveFacets();
  const group = facets.technologies.find((entry) => entry.key === technologyKey);
  if (!group) return null;

  const admin = createAdminClient();
  const { data: techRows, error: technologyError } = await admin.from("technologies").select("id").in("slug", group.slugs);
  if (technologyError) throw new Error(technologyError.message);
  const ids = (techRows ?? []).map((row) => String(row.id));
  if (!ids.length) return [];

  const joins = await selectAllRows<{ organizations: { slug: string } | Array<{ slug: string }> | null }>((from, to) =>
    admin
      .from("organization_technologies")
      .select("organizations(slug)")
      .in("technology_id", ids)
      .order("organization_id")
      .range(from, to),
  );

  const slugs = new Set<string>();
  for (const row of joins) {
    const record = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    if (record?.slug) slugs.add(String(record.slug));
  }
  return [...slugs];
}

export type ArchiveSearchResponse = {
  data: ArchiveResult[];
  total: number;
  page: number;
  limit: number;
  /** How many organizations a technology filter resolved to, for an honest "this is broad" note. */
  technologyOrganizations: number | null;
};

async function searchArchiveFromDatabase(query: ArchiveQuery): Promise<ArchiveSearchResponse> {
  const normalized = normalizeArchiveQuery(query);
  const { page } = normalized;
  const empty: ArchiveSearchResponse = { data: [], total: 0, page, limit: PAGE_SIZE, technologyOrganizations: null };
  if (!isSupabaseAdminConfigured()) return empty;

  const admin = createAdminClient();
  let organizationSlugs: string[] | null = null;
  if (normalized.technology) {
    organizationSlugs = await organizationSlugsForTechnology(normalized.technology);
    if (organizationSlugs && !organizationSlugs.length) return empty;
  }

  let builder = admin
    .from("projects")
    .select(
      "id,external_id,year,title,abstract_short,organizations!inner(slug,name),project_contributors(id,archived_name,ordinal),project_mentors(name,ordinal)",
      { count: "exact" },
    )
    .order("year", { ascending: false })
    .order("title")
    .range(archivePageRange(page, PAGE_SIZE).from, archivePageRange(page, PAGE_SIZE).to);

  if (normalized.year) builder = builder.eq("year", normalized.year);
  if (normalized.q) builder = builder.ilike("title", `%${normalized.q}%`);
  if (normalized.organization) builder = builder.eq("organizations.slug", normalized.organization);
  else if (organizationSlugs) builder = builder.in("organizations.slug", organizationSlugs);

  const { data, error, count } = await builder;
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    external_id: string;
    year: number;
    title: string;
    abstract_short: string | null;
    organizations: { slug: string; name: string } | Array<{ slug: string; name: string }>;
    project_contributors: Array<{ id: string; archived_name: string; ordinal: number }>;
    project_mentors: Array<{ name: string; ordinal: number }>;
  }>;

  // One extra round trip marks the results that already have a published PDF.
  const externalIds = rows.map((row) => row.external_id);
  const proposalByExternalId = new Map<string, string>();
  if (externalIds.length) {
    const { data: approved, error: approvedError } = await admin
      .from("approved_proposals")
      .select("public_slug,project_external_id")
      .in("project_external_id", externalIds);
    if (approvedError) throw approvedError;
    for (const row of approved ?? []) {
      proposalByExternalId.set(String(row.project_external_id), String(row.public_slug));
    }
  }

  return {
    data: rows.map((row) => {
      const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      return {
        projectId: row.id,
        externalId: row.external_id,
        title: row.title,
        abstract: row.abstract_short,
        year: row.year,
        organizationSlug: organization?.slug ?? "",
        organizationName: organization?.name ?? "",
        contributors: [...(row.project_contributors ?? [])]
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((person) => ({ id: person.id, name: person.archived_name, ordinal: person.ordinal })),
        mentors: [...(row.project_mentors ?? [])].sort((a, b) => a.ordinal - b.ordinal).map((mentor) => mentor.name),
        proposalSlug: proposalByExternalId.get(row.external_id) ?? null,
      };
    }),
    total: count ?? 0,
    page,
    limit: PAGE_SIZE,
    technologyOrganizations: organizationSlugs?.length ?? null,
  };
}

export async function searchArchive(query: ArchiveQuery): Promise<ArchiveSearchResponse> {
  try {
    return await searchArchiveFromDatabase(query);
  } catch (error) {
    console.error("[proposal archive search] database unavailable", error);
    const page = normalizeArchiveQuery(query).page;
    return { data: [], total: 0, page, limit: PAGE_SIZE, technologyOrganizations: null };
  }
}
