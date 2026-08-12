import "server-only";

import { cache } from "react";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicProfileLink = { platform: string; label: string | null; url: string; position: number };
export type PublicProposal = {
  id: string;
  public_slug: string;
  year: number;
  project_external_id: string;
  project_title: string;
  abstract_short: string | null;
  organization_slug: string;
  organization_name: string;
  archived_contributor_name: string;
  pdf_byte_size: number;
  pdf_sha256: string;
  display_name: string;
  avatar_r2_key: string | null;
  bio: string | null;
  profile_links: PublicProfileLink[];
  approved_at: string;
  license_code: "CC-BY-4.0";
};

export const getApprovedProposals = cache(async (filters?: { q?: string; year?: number; organization?: string; project?: string; page?: number }) => {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = 24;
  if (!isSupabaseAdminConfigured()) return { data: [] as PublicProposal[], total: 0, page, limit };
  let query = createAdminClient().from("approved_proposals").select("*", { count: "exact" }).order("approved_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (filters?.q) query = query.ilike("project_title", `%${filters.q.replaceAll("%", "").slice(0, 80)}%`);
  if (filters?.year) query = query.eq("year", filters.year);
  if (filters?.organization) query = query.eq("organization_slug", filters.organization);
  if (filters?.project) query = query.eq("project_external_id", filters.project);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as PublicProposal[], total: count ?? 0, page, limit };
});

export const getApprovedProposal = cache(async (slug: string) => {
  if (!isSupabaseAdminConfigured()) return null;
  const { data, error } = await createAdminClient().from("approved_proposals").select("*").eq("public_slug", slug).maybeSingle();
  if (error) throw error;
  return data as PublicProposal | null;
});

export const getApprovedProposalSitemapEntries = cache(async () => {
  if (!isSupabaseAdminConfigured()) return [] as Pick<PublicProposal, "public_slug" | "approved_at">[];
  const entries: Pick<PublicProposal, "public_slug" | "approved_at">[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await createAdminClient()
      .from("approved_proposals")
      .select("public_slug,approved_at")
      .order("public_slug")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    entries.push(...((data ?? []) as Pick<PublicProposal, "public_slug" | "approved_at">[]));
    if (!data || data.length < pageSize) break;
  }
  return entries;
});
