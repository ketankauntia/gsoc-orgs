import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, isDatabaseConfigured } from "@/lib/db";
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

/** Everything the three choosers need. The database work is cached across requests, then deduplicated per render. */
async function loadArchiveFacets(): Promise<ArchiveFacets> {
  if (!isDatabaseConfigured()) return EMPTY_FACETS;
  const sql = db();
  const [years, organizations, technologies] = await Promise.all([
    sql`select year, projects from public.year_stats order by year desc`,
    sql`select slug::text as slug, name, total_projects, active_years from public.organizations order by name`,
    // Popularity for the technology chooser, so the useful options surface first.
    sql`select t.slug::text as slug, t.name, count(ot.organization_id)::int as org_count
        from public.technologies t left join public.organization_technologies ot on ot.technology_id = t.id
        group by t.id order by t.slug`,
  ]);

  const archiveYears = years.map((row) => Number(row.year));
  const groupedTechnologies = groupTechnologies(
    technologies.map((row) => ({ slug: String(row.slug), name: String(row.name), orgCount: Number(row.org_count) })),
  ).filter((group) => group.orgCount > 0);

  return {
    years: archiveYears,
    organizations: organizations.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      projectCount: Number(row.total_projects ?? 0),
      years: ((row.active_years as number[] | null) ?? []).map(Number).filter((year) => archiveYears.includes(year)),
    })),
    technologies: groupedTechnologies,
    totals: {
      projects: years.reduce((sum, row) => sum + Number(row.projects ?? 0), 0),
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
  const rows = await db().query(
    `select distinct o.slug::text as slug
     from public.organization_technologies ot
     join public.technologies t on t.id = ot.technology_id
     join public.organizations o on o.id = ot.organization_id
     where lower(t.slug::text) = any($1::text[])`,
    [group.slugs.map((slug) => slug.toLowerCase())],
  );
  return rows.map((row) => String(row.slug));
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
  if (!isDatabaseConfigured()) return empty;

  let organizationSlugs: string[] | null = null;
  if (normalized.technology && !normalized.organization) {
    organizationSlugs = await organizationSlugsForTechnology(normalized.technology);
    if (organizationSlugs && !organizationSlugs.length) return empty;
  }

  const { from } = archivePageRange(page, PAGE_SIZE);
  const rows = await db().query(
    `select p.id, p.external_id, p.year, p.title, p.abstract_short, o.slug::text as organization_slug, o.name as organization_name,
       coalesce((select jsonb_agg(jsonb_build_object('id', pp.id, 'name', pp.archived_name, 'ordinal', pp.ordinal) order by pp.ordinal)
         from public.project_people pp where pp.project_id = p.id and pp.role = 'contributor'), '[]'::jsonb) as contributors,
       coalesce((select jsonb_agg(pp.archived_name order by pp.ordinal)
         from public.project_people pp where pp.project_id = p.id and pp.role = 'mentor'), '[]'::jsonb) as mentors,
       (select v.slug from public.public_proposals v where v.project_id = p.id order by v.published_at desc limit 1) as proposal_slug,
       count(*) over () as total
     from public.projects p
     join public.organizations o on o.id = p.organization_id
     where ($1::int is null or p.year = $1)
       and ($2::text is null or p.title ilike '%' || $2 || '%')
       and ($3::text is null or o.slug = $3::citext)
       and ($4::text[] is null or o.slug::text = any($4::text[]))
     order by p.year desc, p.title
     limit ${PAGE_SIZE} offset $5`,
    [normalized.year ?? null, normalized.q ?? null, normalized.organization ?? null, organizationSlugs, from],
  );

  return {
    data: rows.map((row) => ({
      projectId: String(row.id),
      externalId: String(row.external_id),
      title: String(row.title),
      abstract: (row.abstract_short as string | null) ?? null,
      year: Number(row.year),
      organizationSlug: String(row.organization_slug),
      organizationName: String(row.organization_name),
      contributors: row.contributors as ArchiveContributor[],
      mentors: row.mentors as string[],
      proposalSlug: (row.proposal_slug as string | null) ?? null,
    })),
    total: Number(rows[0]?.total ?? 0),
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
