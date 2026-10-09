import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Organization, project, yearly and contributor profile pages are cached
// (ISR/static). When public contributor content changes, refresh the pages
// that show it.
//
// Look the paths up before a delete (the rows are gone afterwards) and only
// revalidate once the change succeeded:
//   const paths = await contributorWorkPaths({ postId });
//   await <mutation>;
//   revalidatePaths(paths);

type Target = { personId?: string; proposalId?: string; postId?: string; participationId?: string; userId?: string };

/** Pages that show the target's slot or its people. Never throws; an empty list means the lookup failed. */
export async function contributorWorkPaths(target: Target): Promise<string[]> {
  try {
    const rows = await db().query(
      `with people as (
         select $1::uuid as id
         union select person_id from public.proposals where id = $2::uuid
         union select person_id from public.posts where id = $3::uuid
         union select person_id from public.participations where id = $4::uuid
         union select person_id from public.participations where user_id = $5::uuid
       )
       select o.slug::text as organization_slug, p.external_id, p.year, null::text as handle
       from people x
       join public.project_people pp on pp.id = x.id
       join public.projects p on p.id = pp.project_id
       join public.organizations o on o.id = p.organization_id
       union all
       select null, null, null, prof.handle::text
       from public.profiles prof
       where prof.handle is not null
         and (prof.user_id = $5::uuid
           or prof.user_id in (select pa.user_id from public.participations pa join people x on x.id = pa.person_id))`,
      [target.personId ?? null, target.proposalId ?? null, target.postId ?? null, target.participationId ?? null, target.userId ?? null],
    );
    const paths = ["/proposals", "/contributor-blogs"];
    for (const row of rows) {
      if (row.handle) {
        paths.push(`/contributors/${row.handle}`);
        continue;
      }
      paths.push(
        `/organizations/${row.organization_slug}`,
        `/organizations/${row.organization_slug}/projects/${row.external_id}`,
        `/yearly/google-summer-of-code-${row.year}`,
      );
    }
    return [...new Set(paths)];
  } catch (error) {
    // Pages still refresh when their cache expires.
    console.error("[revalidate contributor work]", error instanceof Error ? error.message : error);
    return [];
  }
}

export function revalidatePaths(paths: Iterable<string>) {
  for (const path of new Set(paths)) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error("[revalidate contributor work]", path, error instanceof Error ? error.message : error);
    }
  }
}

/** After a successful change: refreshes the target's pages now, plus any looked up before the change. */
export async function revalidateContributorWork(target: Target, before: string[] = []) {
  revalidatePaths([...before, ...(await contributorWorkPaths(target))]);
}
