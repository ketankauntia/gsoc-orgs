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

/** Splits `count(*) over () as total_count` off a page of rows. */
export function pageOf<T extends Record<string, unknown>>(rows: T[]) {
  const total = Number(rows[0]?.total_count ?? 0);
  const data = rows.map((row) => {
    const copy: Record<string, unknown> = { ...row };
    delete copy.total_count;
    return copy;
  });
  return { total, data };
}
