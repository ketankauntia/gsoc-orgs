import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { jsonObject, jsonStringArray } from "@/lib/supabase/legacy-shapes";

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
  const { data, error } = await createAdminClient()
    .from("organizations")
    .select("canonical_id,name,slug,active_years,total_projects,is_currently_active,source_payload")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const source = jsonObject(row.source_payload);
    return {
    id_: row.canonical_id,
    name: row.name,
    slug: String(row.slug),
    technologies: jsonStringArray(source.technologies),
    active_years: row.active_years ?? [],
    withdrawn_years: Array.isArray(source.withdrawn_years)
      ? source.withdrawn_years.filter((year): year is number => typeof year === "number")
      : [],
    years: jsonObject(source.years),
    total_projects: row.total_projects ?? 0,
    is_currently_active: row.is_currently_active,
    };
  }) as AnalyticsOrganization[];
}
