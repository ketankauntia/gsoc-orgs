type JsonObject = Record<string, unknown>;
type LegacyRow = JsonObject & { source_payload?: JsonObject };
type Contributor = { archived_name?: string };
type Mentor = { name: string; ordinal: number };
export type LegacyOrganization = JsonObject & {
  years?: Record<string, unknown>;
  stats?: JsonObject;
  technologies?: string[];
  topics?: string[];
};

export function organizationV1(row: LegacyRow): LegacyOrganization {
  const source = row.source_payload ?? {};
  return {
    ...source,
    id: row.legacy_id ?? row.id,
    id_: row.canonical_id,
    slug: String(row.slug),
    name: row.name,
    category: row.category,
    description: row.description,
    url: row.website,
    contact: row.contact,
    social: row.socials,
    image_url: row.image_url,
    logo_r2_url: row.logo_r2_url,
    active_years: row.active_years,
    first_year: row.first_year,
    last_year: row.last_year,
    is_currently_active: row.is_currently_active,
    total_projects: row.total_projects,
  } as LegacyOrganization;
}

export function projectV1(row: LegacyRow) {
  const source = row.source_payload ?? {};
  const contributors = (row.project_contributors ?? []) as Contributor[];
  const mentors = (row.project_mentors ?? []) as Mentor[];
  const org = (row.organizations ?? {}) as JsonObject;
  return {
    ...source,
    id: row.legacy_id ?? row.id,
    project_id: row.external_id,
    project_title: row.title,
    project_abstract_short: row.abstract_short,
    project_info_html: row.info_html,
    project_code_url: row.code_url,
    project_url: row.project_url,
    contributor: contributors[0]?.archived_name ?? source.contributor ?? "",
    mentors: mentors.sort((a, b) => a.ordinal - b.ordinal).map((mentor) => mentor.name),
    org_name: org.name ?? source.org_name,
    org_slug: String(org.slug ?? source.org_slug ?? ""),
    year: row.year,
    date_created: row.source_created_at,
    date_updated: row.source_updated_at,
  };
}
