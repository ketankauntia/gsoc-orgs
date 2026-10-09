import "server-only";

import { cache } from "react";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { PostKind } from "@/lib/hub/types";

/** A progress post (weekly update, report, talk) linked to its archived project. */
export type ContributorBlog = {
  id: string;
  title: string | null;
  url: string;
  kind: PostKind;
  published_on: string | null;
  verified: boolean;
  contributor_name: string;
  project_external_id: string;
  project_title: string;
  year: number;
  project_url: string | null;
  code_url: string | null;
  organization_slug: string;
  organization_name: string;
};

export const getContributorBlogs = cache(async (filters?: { year?: number; organization?: string; project?: string }) => {
  if (!isDatabaseConfigured()) return [] as ContributorBlog[];
  try {
    const rows = await db().query(
      `select po.id, po.title, po.url, po.kind, po.published_on::text as published_on, po.verified,
         po.archived_name as contributor_name, po.project_external_id, po.project_title, po.year,
         p.project_url, p.work_product_url as code_url, po.organization_slug, po.organization_name
       from public.public_posts po
       join public.projects p on p.external_id = po.project_external_id
       where ($1::int is null or po.year = $1)
         and ($2::text is null or po.organization_slug = $2)
         and ($3::text is null or po.project_external_id = $3)
       order by po.year desc, po.organization_name, po.project_title, po.published_on desc nulls last
       limit 600`,
      [filters?.year ?? null, filters?.organization ?? null, filters?.project ?? null],
    );
    return rows as ContributorBlog[];
  } catch (error) {
    console.error("[contributor posts] database unavailable", error);
    return [] as ContributorBlog[];
  }
});
