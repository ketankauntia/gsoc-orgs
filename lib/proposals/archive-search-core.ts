export type ArchiveOrganization = {
  slug: string;
  name: string;
  projectCount: number;
  years: number[];
};

export type ArchiveQueryInput = {
  year?: number;
  q?: string;
  organization?: string;
  technology?: string;
  page?: number;
};

export type NormalizedArchiveQuery = {
  year?: number;
  q?: string;
  organization?: string;
  technology?: string;
  page: number;
};

const cleanFacet = (value?: string) => value?.trim().slice(0, 100) || undefined;

/** Normalize URL input before it reaches PostgREST. Wildcard characters are discarded so title search stays literal. */
export function normalizeArchiveQuery(query: ArchiveQueryInput): NormalizedArchiveQuery {
  const cleanedTitle = query.q?.replace(/[%_]/g, "").trim().slice(0, 80);
  return {
    page: Number.isSafeInteger(query.page) && (query.page ?? 0) > 0 ? Math.min(query.page!, 10_000) : 1,
    year: Number.isSafeInteger(query.year) && (query.year ?? 0) > 0 ? query.year : undefined,
    q: cleanedTitle || undefined,
    organization: cleanFacet(query.organization),
    technology: cleanFacet(query.technology),
  };
}

export function archivePageRange(page: number, pageSize = 20) {
  return { from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

export function filterArchiveOrganizationsByYear(organizations: ArchiveOrganization[], year?: number) {
  return year ? organizations.filter((organization) => organization.years.includes(year)) : organizations;
}
