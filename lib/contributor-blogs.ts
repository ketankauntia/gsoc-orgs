import "server-only";

import { cache } from "react";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContributorBlog = {
  id: string;
  title: string | null;
  url: string;
  contributor_name: string;
  project_external_id: string;
  project_title: string;
  year: number;
  project_url: string | null;
  code_url: string | null;
  organization_slug: string;
  organization_name: string;
};

export const getContributorBlogs = cache(async (filters?: { year?: number; organization?: string }) => {
  if (!isSupabaseAdminConfigured()) return [] as ContributorBlog[];
  try {
    let query = createAdminClient().from("published_contributor_blogs").select("*").order("year", { ascending: false }).order("organization_name").order("project_title");
    if (filters?.year) query = query.eq("year", filters.year);
    if (filters?.organization) query = query.eq("organization_slug", filters.organization);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).flatMap((item) => {
      if (!item.id || !item.url || !item.contributor_name || !item.project_external_id || !item.project_title || !item.year || !item.organization_slug || !item.organization_name) return [];
      return [{
        id: item.id,
        title: item.title,
        url: item.url,
        contributor_name: item.contributor_name,
        project_external_id: item.project_external_id,
        project_title: item.project_title,
        year: item.year,
        project_url: item.project_url,
        code_url: item.code_url,
        organization_slug: item.organization_slug,
        organization_name: item.organization_name,
      } satisfies ContributorBlog];
    });
  } catch (error) {
    console.error("[contributor blogs] database unavailable", error);
    return [] as ContributorBlog[];
  }
});
