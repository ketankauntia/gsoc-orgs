import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsOrganization = {
  id_: string | null;
  name: string;
  slug: string;
  technologies: string[];
  active_years: number[];
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
  return (data ?? []).map((row) => ({
    id_: row.canonical_id,
    name: row.name,
    slug: String(row.slug),
    technologies: row.source_payload?.technologies ?? [],
    active_years: row.active_years ?? [],
    years: row.source_payload?.years ?? {},
    total_projects: row.total_projects ?? 0,
    is_currently_active: row.is_currently_active,
  })) as AnalyticsOrganization[];
}
