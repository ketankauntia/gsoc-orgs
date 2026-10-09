import "server-only";

import { cache } from "react";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { PostKind, Story } from "@/lib/hub/types";

export type PublicHistoryItem = {
  person_id: string; role: "contributor" | "mentor"; year: number; project_external_id: string; project_title: string;
  organization_slug: string; organization_name: string; story: Story | null;
};
export type PublicProfile = {
  handle: string; display_name: string; bio: string | null; avatar_key: string | null; website_url: string | null;
  github_username: string | null; x_username: string | null; medium_url: string | null; created_at: string; history: PublicHistoryItem[];
};

/** Handles are stored in lowercase; any casing finds the profile (its `handle` is the canonical one). */
export const getPublicProfile = cache(async (handle: string): Promise<PublicProfile | null> => {
  const key = handle.toLowerCase();
  if (!isDatabaseConfigured() || !/^[a-z0-9-]{3,30}$/.test(key)) return null;
  const rows = await db()`select to_jsonb(p) as profile from public.public_profiles p where p.handle = ${key}`;
  return (rows[0]?.profile as PublicProfile | undefined) ?? null;
});

// ───────────── contributor work shown on project, organization and yearly pages ─────────────

export type HubProposal = {
  slug: string; project_external_id: string; project_title: string; year: number;
  organization_slug: string; organization_name: string; author: string; pages: number | null;
  published_at: string; verified: boolean; author_published: boolean;
};
export type HubPost = {
  id: string; url: string; title: string | null; kind: PostKind; published_on: string | null; verified: boolean;
  author: string; project_external_id: string; project_title: string; year: number; organization_slug: string; organization_name: string;
};
export type HubPerson = { role: "contributor" | "mentor"; archived_name: string; handle: string | null; display_name: string | null };
export type ContributorWork = { proposals: HubProposal[]; posts: HubPost[]; people: HubPerson[]; proposalCount: number; postCount: number };

const EMPTY: ContributorWork = { proposals: [], posts: [], people: [], proposalCount: 0, postCount: 0 };

type Scope = { project?: string; organization?: string; year?: number };

/**
 * Published proposals, visible posts and verified people for one project, organization or year.
 * Empty without a database, or when it fails during `next build`. At runtime a failure throws, so
 * a cached page keeps its last good render instead of caching an empty section for 30 days.
 */
async function loadContributorWork(scope: Scope, limits: { proposals: number; posts: number }): Promise<ContributorWork> {
  if (!isDatabaseConfigured()) return EMPTY;
  const project = scope.project ?? null;
  const organization = scope.organization ?? null;
  const year = scope.year ?? null;
  try {
    const sql = db();
    const [proposals, posts, people, counts] = await Promise.all([
      sql.query(
        `select slug, project_external_id, project_title, year, organization_slug, organization_name,
           coalesce(owner_display_name, archived_name) as author, file_pages as pages, published_at, verified, author_published
         from public.public_proposals
         where ($1::text is null or project_external_id = $1) and ($2::text is null or lower(organization_slug) = lower($2)) and ($3::int is null or year = $3)
         order by published_at desc limit $4`,
        [project, organization, year, limits.proposals],
      ),
      sql.query(
        `select id, url, title, kind, published_on::text as published_on, verified, archived_name as author,
           project_external_id, project_title, year, organization_slug, organization_name
         from public.public_posts
         where ($1::text is null or project_external_id = $1) and ($2::text is null or lower(organization_slug) = lower($2)) and ($3::int is null or year = $3)
         order by published_on desc nulls last, created_at desc limit $4`,
        [project, organization, year, limits.posts],
      ),
      project
        ? sql.query(`select role, archived_name, handle, display_name from public.public_people where project_external_id = $1 order by role, archived_name`, [project])
        : Promise.resolve([]),
      sql.query(
        `select
           (select count(*) from public.public_proposals where ($1::text is null or project_external_id = $1) and ($2::text is null or lower(organization_slug) = lower($2)) and ($3::int is null or year = $3))::int as proposals,
           (select count(*) from public.public_posts where ($1::text is null or project_external_id = $1) and ($2::text is null or lower(organization_slug) = lower($2)) and ($3::int is null or year = $3))::int as posts`,
        [project, organization, year],
      ),
    ]);
    return {
      proposals: proposals.map((row) => ({ ...row, published_at: new Date(row.published_at as string).toISOString() })) as HubProposal[],
      posts: posts as HubPost[],
      people: people as HubPerson[],
      proposalCount: Number(counts[0]?.proposals ?? 0),
      postCount: Number(counts[0]?.posts ?? 0),
    };
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error;
    console.error("[contributor work] database unavailable during build", error instanceof Error ? error.message : error);
    return EMPTY;
  }
}

export const getProjectWork = cache((externalId: string) => loadContributorWork({ project: externalId }, { proposals: 10, posts: 50 }));
export const getOrganizationWork = cache((slug: string) => loadContributorWork({ organization: slug }, { proposals: 4, posts: 6 }));
export const getYearWork = cache((year: number) => loadContributorWork({ year }, { proposals: 6, posts: 6 }));
