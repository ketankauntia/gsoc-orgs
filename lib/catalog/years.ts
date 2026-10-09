import "server-only";

import { db } from "@/lib/db";

export type YearCounts = {
  year: number;
  announced: number;
  withdrawn: number;
  participating: number;
  projects: number;
  contributors: number;
};

/** Per-year organization counts (announced, withdrawn) with project and contributor totals. */
export async function getYearCounts(year?: number): Promise<YearCounts[]> {
  const rows = await db().query(
    `select y.year,
       count(oy.organization_id)::int as announced,
       count(oy.organization_id) filter (where oy.selection_status = 'withdrawn')::int as withdrawn,
       coalesce(max(s.projects), 0)::int as projects,
       coalesce(max(s.contributors), 0)::int as contributors
     from (select year from public.organization_years union select year from public.year_stats) y
     left join public.organization_years oy on oy.year = y.year
     left join public.year_stats s on s.year = y.year
     where ($1::int is null or y.year = $1)
     group by y.year
     order by y.year desc`,
    [year ?? null],
  );
  return rows.map((row) => ({
    year: Number(row.year),
    announced: Number(row.announced),
    withdrawn: Number(row.withdrawn),
    participating: Number(row.announced) - Number(row.withdrawn),
    projects: Number(row.projects),
    contributors: Number(row.contributors),
  }));
}
