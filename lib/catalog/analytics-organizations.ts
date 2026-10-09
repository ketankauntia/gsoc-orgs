import "server-only";

import { jsonObject, jsonStringArray, type Json } from "@/lib/catalog/legacy-shapes";
import { db } from "@/lib/db";

export type AnalyticsOrganization = {
  id_: string | null;
  name: string;
  slug: string;
  technologies: string[];
  active_years: number[];
  withdrawn_years: number[];
  years: Record<string, { num_projects?: number; projects?: Array<{ difficulty?: string }> }>;
  total_projects: number;
  is_currently_active: boolean;
};

export async function getAnalyticsOrganizations() {
  const rows = await db()`
    select canonical_id, name, slug::text as slug, active_years, total_projects, is_currently_active, source_payload
    from public.organizations order by name`;
  return rows.map((row) => {
    const source = jsonObject(row.source_payload as Json);
    return {
      id_: (row.canonical_id as string | null) ?? null,
      name: String(row.name),
      slug: String(row.slug),
      technologies: jsonStringArray(source.technologies),
      active_years: (row.active_years as number[] | null) ?? [],
      withdrawn_years: Array.isArray(source.withdrawn_years)
        ? source.withdrawn_years.filter((year): year is number => typeof year === "number")
        : [],
      years: jsonObject(source.years),
      total_projects: Number(row.total_projects ?? 0),
      is_currently_active: Boolean(row.is_currently_active),
    };
  }) as AnalyticsOrganization[];
}
