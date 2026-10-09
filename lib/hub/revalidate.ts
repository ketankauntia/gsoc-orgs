import "server-only";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Organization and yearly pages are cached (ISR/static). When public
// contributor content changes, refresh exactly the pages that show it.

type Target = { personId?: string; proposalId?: string; postId?: string; participationId?: string; userId?: string };

export async function revalidateContributorWork(target: Target) {
  try {
    const rows = await db().query(
      `select distinct o.slug::text as organization_slug, p.external_id, p.year
       from public.project_people pp
       join public.projects p on p.id = pp.project_id
       join public.organizations o on o.id = p.organization_id
       where pp.id = $1::uuid
          or pp.id = (select person_id from public.proposals where id = $2::uuid)
          or pp.id = (select person_id from public.posts where id = $3::uuid)
          or pp.id = (select person_id from public.participations where id = $4::uuid)
          or pp.id in (select person_id from public.participations where user_id = $5::uuid)`,
      [target.personId ?? null, target.proposalId ?? null, target.postId ?? null, target.participationId ?? null, target.userId ?? null],
    );
    for (const row of rows) {
      revalidatePath(`/organizations/${row.organization_slug}`);
      revalidatePath(`/organizations/${row.organization_slug}/projects/${row.external_id}`);
      revalidatePath(`/yearly/google-summer-of-code-${row.year}`);
    }
    revalidatePath("/proposals");
    revalidatePath("/contributor-blogs");
  } catch (error) {
    // Pages still refresh when their cache expires.
    console.error("[revalidate contributor work]", error instanceof Error ? error.message : error);
  }
}
