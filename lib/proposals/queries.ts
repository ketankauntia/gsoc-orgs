import "server-only";

import { cache } from "react";
import { db, isDatabaseConfigured } from "@/lib/db";

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
  pdf_byte_size: number | null;
  pdf_sha256: string | null;
  file_version: number;
  pages: number | null;
  display_name: string;
  handle: string | null;
  /** Public avatar endpoint of the author's profile, when they show one. */
  avatar_url: string | null;
  bio: string | null;
  profile_links: PublicProfileLink[];
  approved_at: string;
  license_code: "CC-BY-4.0";
  /** "contributor": the author published it; "admin_curated": published with the author's recorded permission. */
  submission_source: "contributor" | "admin_curated";
  /** A verified account stands behind this proposal. */
  verified: boolean;
};

type Row = Omit<PublicProposal, "profile_links" | "approved_at" | "avatar_url"> & {
  approved_at: string | Date; has_avatar: boolean | null;
  website_url: string | null; github_username: string | null; x_username: string | null; medium_url: string | null;
};

const SELECT = `
  select v.id, v.slug as public_slug, v.year, v.project_external_id, v.project_title, v.abstract_short,
    v.organization_slug, v.organization_name, v.archived_name as archived_contributor_name,
    v.file_bytes as pdf_byte_size, v.file_sha256 as pdf_sha256, v.file_version, v.file_pages as pages,
    coalesce(v.owner_display_name, v.archived_name) as display_name, v.owner_handle as handle,
    v.has_avatar, prof.bio, prof.website_url, prof.github_username, prof.x_username, prof.medium_url,
    v.published_at as approved_at, v.licence as license_code,
    case when v.author_published then 'contributor' else 'admin_curated' end as submission_source,
    v.verified
  from public.public_proposals v
  left join public.profiles prof on v.owner_handle is not null and prof.handle = v.owner_handle::citext and prof.is_public`;

function toProposal(row: Row): PublicProposal {
  const links: PublicProfileLink[] = [];
  if (row.website_url) links.push({ platform: "website", label: "Website", url: row.website_url, position: links.length });
  if (row.github_username) links.push({ platform: "github", label: "GitHub", url: `https://github.com/${row.github_username}`, position: links.length });
  if (row.x_username) links.push({ platform: "x", label: "X", url: `https://x.com/${row.x_username}`, position: links.length });
  if (row.medium_url) links.push({ platform: "medium", label: "Medium", url: row.medium_url, position: links.length });
  return {
    id: row.id, public_slug: row.public_slug, year: row.year, project_external_id: row.project_external_id, project_title: row.project_title,
    abstract_short: row.abstract_short, organization_slug: row.organization_slug, organization_name: row.organization_name,
    archived_contributor_name: row.archived_contributor_name, pdf_byte_size: row.pdf_byte_size, pdf_sha256: row.pdf_sha256, file_version: row.file_version, pages: row.pages,
    display_name: row.display_name, handle: row.handle, avatar_url: row.has_avatar && row.handle ? `/api/v2/avatars/${row.handle}` : null, bio: row.bio, profile_links: links,
    approved_at: new Date(row.approved_at).toISOString(), license_code: row.license_code, submission_source: row.submission_source, verified: row.verified,
  };
}

/** One page of published proposals, newest first. Throws when the database fails. */
export const getApprovedProposals = cache(async (filters?: { q?: string; year?: number; organization?: string; project?: string; page?: number; limit?: number }) => {
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 24));
  if (!isDatabaseConfigured()) return { data: [] as PublicProposal[], total: 0, page, limit };
  const q = filters?.q?.replace(/[%_\\]/g, "").trim().slice(0, 80) || null;
  const where = `where ($1::text is null or v.project_title ilike '%' || $1 || '%')
       and ($2::int is null or v.year = $2)
       and ($3::text is null or v.organization_slug = $3)
       and ($4::text is null or v.project_external_id = $4)`;
  const values = [q, filters?.year ?? null, filters?.organization ?? null, filters?.project ?? null];
  const [rows, counted] = await Promise.all([
    db().query(`${SELECT} ${where} order by v.published_at desc, v.id limit $5 offset $6`, [...values, limit, (page - 1) * limit]),
    db().query(`select count(*)::int as total from public.public_proposals v ${where}`, values),
  ]);
  return { data: (rows as Row[]).map(toProposal), total: Number(counted[0]?.total ?? 0), page, limit };
});

export const getApprovedProposal = cache(async (slug: string) => {
  if (!isDatabaseConfigured()) return null;
  const rows = await db().query(`${SELECT} where v.slug = $1`, [slug]);
  return rows[0] ? toProposal(rows[0] as Row) : null;
});

/** Storage key of a publicly visible proposal (same conditions as public_proposals). */
export async function getPublicProposalFile(id: string) {
  const rows = await db().query(
    `select pr.file_key, pr.slug::text as slug from public.proposals pr join public.public_proposals v on v.id = pr.id where pr.id = $1`,
    [id],
  );
  return (rows[0] ?? null) as { file_key: string; slug: string } | null;
}

export const getApprovedProposalSitemapEntries = cache(async () => {
  if (!isDatabaseConfigured()) return [] as Pick<PublicProposal, "public_slug" | "approved_at">[];
  try {
    const rows = await db()`select slug as public_slug, published_at from public.public_proposals order by slug`;
    return rows.map((row) => ({ public_slug: String(row.public_slug), approved_at: new Date(row.published_at as string).toISOString() }));
  } catch (error) {
    console.error("[proposal sitemap] database unavailable", error);
    return [] as Pick<PublicProposal, "public_slug" | "approved_at">[];
  }
});
