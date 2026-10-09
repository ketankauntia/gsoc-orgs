// SQL fragments that rebuild the nested shapes the catalog APIs have always
// returned (organizations, project_contributors, project_mentors).

/** Contributor and mentor columns for a project row `p`. */
export const PROJECT_PEOPLE = `
  coalesce((select jsonb_agg(jsonb_build_object('id', pp.id, 'archived_name', pp.archived_name, 'archived_profile_url', pp.archived_profile_url, 'ordinal', pp.ordinal) order by pp.ordinal)
    from public.project_people pp where pp.project_id = p.id and pp.role = 'contributor'), '[]'::jsonb) as project_contributors,
  coalesce((select jsonb_agg(jsonb_build_object('name', pp.archived_name, 'ordinal', pp.ordinal) order by pp.ordinal)
    from public.project_people pp where pp.project_id = p.id and pp.role = 'mentor'), '[]'::jsonb) as project_mentors`;

/** Organization, contributor and mentor columns for a project row `p` joined to its organization `o`. */
export const PROJECT_WITH_PEOPLE = `jsonb_build_object('slug', o.slug::text, 'name', o.name) as organizations, ${PROJECT_PEOPLE}`;

/** Strips % and _ so user input matches literally inside ILIKE patterns. */
export function likeTerm(value: string | null | undefined, max = 80) {
  const cleaned = value?.replace(/[%_\\]/g, "").trim().slice(0, max);
  return cleaned || null;
}

/**
 * Runs a page query that selects `count(*) over () as total_count` and splits the total off.
 * A page past the end has no row to carry the total, so the first row is read for it.
 */
export async function pageOf<T extends Record<string, unknown>>(run: (limit: number, offset: number) => Promise<T[]>, limit: number, offset: number) {
  const rows = await run(limit, offset);
  const first = rows[0] ?? (offset > 0 ? (await run(1, 0))[0] : undefined);
  const total = Number(first?.total_count ?? 0);
  const data = rows.map((row) => {
    const copy = { ...row };
    delete copy.total_count;
    return copy;
  });
  return { total, data };
}

/** `page` and `limit` for the v1 API: whole numbers, `limit` capped at `max`; missing, zero or invalid values get the defaults. */
export function legacyPaging(params: URLSearchParams, defaults: { limit: number; max: number }) {
  const page = Math.trunc(Number(params.get("page")));
  const limit = Math.trunc(Number(params.get("limit")));
  return {
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 100_000) : 1,
    limit: Number.isFinite(limit) && limit !== 0 ? Math.min(defaults.max, Math.max(1, limit)) : defaults.limit,
  };
}
