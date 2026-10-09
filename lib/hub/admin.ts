import "server-only";

import { db } from "@/lib/db";

// Reads for /admin. Every admin write is a SQL function that records the
// action in private.audit_log.

export type AdminClaim = {
  id: string; user_id: string; person_id: string; role: "contributor" | "mentor"; archived_name: string; archived_profile_url: string | null;
  year: number; project_external_id: string; project_title: string; organization_slug: string; organization_name: string;
  work_product_url: string | null; note: string | null; evidence_urls: string[]; created_at: string;
  display_name: string; github_username: string | null; other_claims_on_person: number; user_claims: number;
  google_name?: string | null; email?: string | null;
};
export type AdminProposalRow = {
  id: string; slug: string; status: "draft" | "published" | "removed"; person_id: string; archived_name: string;
  year: number; project_external_id: string; project_title: string; organization_name: string;
  locked: boolean; file_version: number; file_pages: number | null; file_sha256: string | null; extraction_status: "pending" | "ok" | "failed";
  pii_findings: Array<{ kind: string; sample: string; page: number }> | null; pii_confirmed: boolean; needs_confirmation: boolean;
  owner_consented: boolean; permission_basis: string | null; permission_given_at: string | null; verified_owner: string | null;
  published_at: string | null; removal_requested_at: string | null; removed_at: string | null; updated_at: string;
};
export type AuditEntry = { id: number; at: string; actor_id: string; action: string; target: string; target_id: string; reason: string | null };
export type PersonMatch = { person_id: string; role: "contributor" | "mentor"; archived_name: string; year: number; project_external_id: string; project_title: string; organization_name: string; proposal_id: string | null };

const SLOT_JOIN = `join public.project_people pp on pp.id = x.person_id
  join public.projects p on p.id = pp.project_id
  join public.organizations o on o.id = p.organization_id`;

export async function getAdminQueue() {
  const rows = await db().query(
    `select
      coalesce((select jsonb_agg(c order by c->>'created_at') from (
        select jsonb_build_object(
          'id', x.id, 'user_id', x.user_id, 'person_id', x.person_id, 'role', pp.role,
          'archived_name', pp.archived_name, 'archived_profile_url', pp.archived_profile_url,
          'year', p.year, 'project_external_id', p.external_id, 'project_title', p.title,
          'organization_slug', o.slug::text, 'organization_name', o.name, 'work_product_url', p.work_product_url,
          'note', x.note, 'evidence_urls', to_jsonb(x.evidence_urls), 'created_at', x.created_at,
          'display_name', prof.display_name, 'github_username', prof.github_username,
          'other_claims_on_person', (select count(*) from public.participations y where y.person_id = x.person_id and y.id <> x.id and y.verification <> 'rejected'),
          'user_claims', (select count(*) from public.participations z where z.user_id = x.user_id)
        ) as c
        from public.participations x ${SLOT_JOIN}
        join public.profiles prof on prof.user_id = x.user_id
        where x.verification = 'unverified'
      ) claims), '[]'::jsonb) as claims,
      coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'at', a.at, 'actor_id', a.actor_id, 'action', a.action,
        'target', a.target, 'target_id', a.target_id, 'reason', a.reason) order by a.at desc)
        from (select * from private.audit_log order by at desc limit 30) a), '[]'::jsonb) as recent`,
  );
  const claims = (rows[0]?.claims ?? []) as AdminClaim[];
  const accounts = await getAccountNames(claims.map((claim) => claim.user_id));
  for (const claim of claims) Object.assign(claim, accounts.get(claim.user_id) ?? {});
  return { claims, recent: (rows[0]?.recent ?? []) as AuditEntry[] };
}

/** Google name and email from Neon Auth, for comparing with the archive. */
async function getAccountNames(userIds: string[]) {
  const result = new Map<string, { google_name: string | null; email: string | null }>();
  if (!userIds.length) return result;
  try {
    const rows = await db().query(`select id::text as id, name, email from neon_auth."user" where id = any($1::uuid[])`, [userIds]);
    for (const row of rows) result.set(String(row.id), { google_name: (row.name as string) ?? null, email: (row.email as string) ?? null });
  } catch (error) {
    console.warn("[admin:account-names]", error instanceof Error ? error.message : error);
  }
  return result;
}

export async function getAdminProposals(): Promise<AdminProposalRow[]> {
  const rows = await db().query(
    `select coalesce(jsonb_agg(row order by (row->>'needs_attention')::boolean desc, row->>'updated_at' desc), '[]'::jsonb) as items from (
      select jsonb_build_object(
        'id', x.id, 'slug', x.slug::text, 'status', x.status, 'person_id', x.person_id, 'archived_name', pp.archived_name,
        'year', p.year, 'project_external_id', p.external_id, 'project_title', p.title, 'organization_name', o.name,
        'locked', x.locked_at is not null, 'file_version', x.file_version, 'file_pages', x.file_pages, 'file_sha256', x.file_sha256,
        'extraction_status', x.extraction_status, 'pii_findings', x.pii_findings,
        'pii_confirmed', x.pii_confirmed_sha256 is not null and x.pii_confirmed_sha256 = x.file_sha256,
        'needs_confirmation', x.file_key is not null and (x.extraction_status = 'failed' or coalesce(jsonb_array_length(x.pii_findings), 0) > 0),
        'owner_consented', x.licence_accepted_at is not null, 'permission_basis', x.permission_basis, 'permission_given_at', x.permission_given_at,
        'verified_owner', (select prof.display_name from public.participations pa join public.profiles prof on prof.user_id = pa.user_id
                           where pa.person_id = x.person_id and pa.verification = 'verified' limit 1),
        'published_at', x.published_at, 'removal_requested_at', x.removal_requested_at, 'removed_at', x.removed_at, 'updated_at', x.updated_at,
        'needs_attention', (x.removal_requested_at is not null and x.status = 'published') or (x.status = 'draft' and x.file_key is not null)
      ) as row
      from public.proposals x ${SLOT_JOIN}
    ) items`,
  );
  return (rows[0]?.items ?? []) as AdminProposalRow[];
}

export type AdminPostRow = {
  id: string; url: string; title: string | null; kind: string; published_on: string | null; created_at: string; source: "owner" | "admin";
  hidden: boolean; hidden_reason: string | null; archived_name: string; project_title: string; year: number; organization_name: string;
  author: string | null; verification: string | null;
};

export async function getAdminPosts(): Promise<AdminPostRow[]> {
  const rows = await db()`
    select po.id, po.url, po.title, po.kind, po.published_on::text as published_on, po.created_at, po.source, po.hidden, po.hidden_reason,
      pp.archived_name, p.title as project_title, p.year, o.name as organization_name,
      prof.display_name as author, pa.verification
    from public.posts po
    join public.project_people pp on pp.id = po.person_id
    join public.projects p on p.id = pp.project_id
    join public.organizations o on o.id = p.organization_id
    left join public.profiles prof on prof.user_id = po.created_by
    left join public.participations pa on pa.person_id = po.person_id and pa.user_id = po.created_by
    order by po.created_at desc
    limit 150`;
  return rows.map((row) => ({ ...row, created_at: new Date(row.created_at as string).toISOString() })) as AdminPostRow[];
}

export async function getProposalAudit(proposalId: string): Promise<AuditEntry[]> {
  const rows = await db()`
    select id, at, actor_id, action, target, target_id, reason from private.audit_log
    where target = 'proposal' and target_id = ${proposalId}::uuid order by at desc limit 50`;
  return rows as AuditEntry[];
}

/** Archive people by name, project title or project id, for curating proposals, posts and claims. */
export async function searchPeople(query: string, contributorsOnly = true): Promise<PersonMatch[]> {
  const pattern = `%${query.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
  const rows = await db()`
    select pp.id as person_id, pp.role, pp.archived_name, p.year, p.external_id as project_external_id, p.title as project_title,
      o.name as organization_name, pr.id as proposal_id
    from public.project_people pp
    join public.projects p on p.id = pp.project_id
    join public.organizations o on o.id = p.organization_id
    left join public.proposals pr on pr.person_id = pp.id
    where (pp.role = 'contributor' or not ${contributorsOnly})
      and (pp.archived_name ilike ${pattern} or p.title ilike ${pattern} or p.external_id = ${query})
    order by p.year desc, pp.role, pp.archived_name
    limit 30`;
  return rows as PersonMatch[];
}

/** Neon Auth user id for an email, for recording a claim on someone's behalf. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const rows = await db().query(`select id::text as id from neon_auth."user" where lower(email) = lower($1) limit 1`, [email]);
  return (rows[0]?.id as string | undefined) ?? null;
}
