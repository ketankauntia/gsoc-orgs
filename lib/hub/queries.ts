import "server-only";

import { db } from "@/lib/db";
import type { MyParticipation, SlotOrganization, SlotProject } from "@/lib/hub/types";

// Reads for the signed-in owner and the claim picker. Writes go through the
// SQL functions in db/migrations; see the route handlers under /api/v2/me.

// Who stored the current file, as the claim's owner sees it. Files from
// before file_uploaded_by_admin existed count as the admin's unless the owner
// uploaded them.
const UPLOADED_BY = `case
  when pr.file_uploaded_by is null then null
  when pr.file_uploaded_by = pa.user_id then 'you'
  when coalesce(pr.file_uploaded_by_admin, true) then 'admin'
  else 'another_account' end`;

const PROPOSAL_JSON = `jsonb_build_object(
  'id', pr.id, 'slug', pr.slug::text, 'status', pr.status, 'locked_at', pr.locked_at,
  'file_version', pr.file_version, 'file_pages', pr.file_pages, 'file_bytes', pr.file_bytes,
  'file_sha256', pr.file_sha256, 'file_uploaded_at', pr.file_uploaded_at,
  'uploaded_by', ${UPLOADED_BY}, 'uploaded_by_admin', coalesce(${UPLOADED_BY} = 'admin', false),
  'extraction_status', pr.extraction_status, 'pii_findings', pr.pii_findings,
  'pii_confirmed', pr.pii_confirmed_sha256 is not null and pr.pii_confirmed_sha256 = pr.file_sha256,
  'needs_confirmation', pr.file_key is not null and (pr.extraction_status = 'failed' or coalesce(jsonb_array_length(pr.pii_findings), 0) > 0),
  'licence_accepted_at', pr.licence_accepted_at, 'published_at', pr.published_at,
  'removal_requested_at', pr.removal_requested_at, 'removed_at', pr.removed_at, 'removed_reason', pr.removed_reason,
  'upload_in_progress', coalesce(pr.upload_started_at > now() - interval '10 minutes', false),
  'upload_pending', exists (select 1 from private.proposal_uploads u where u.proposal_id = pr.id)
)`;

/** Every claim of a user, newest year first, with the proposal and posts of contributor claims. */
export async function getMyParticipations(userId: string): Promise<MyParticipation[]> {
  const rows = await db().query(
    `select coalesce(jsonb_agg(item order by (item->>'year')::int desc, item->>'created_at' desc), '[]'::jsonb) as items
     from (
       select jsonb_build_object(
         'id', pa.id, 'person_id', pa.person_id, 'role', pp.role, 'archived_name', pp.archived_name,
         'year', p.year, 'project_external_id', p.external_id, 'project_title', p.title,
         'organization_slug', o.slug::text, 'organization_name', o.name, 'work_product_url', p.work_product_url,
         'verification', pa.verification, 'reviewed_at', pa.reviewed_at, 'rejection_reason', pa.rejection_reason,
         'note', pa.note, 'evidence_urls', to_jsonb(pa.evidence_urls), 'story', pa.story, 'story_public', pa.story_public,
         'created_at', pa.created_at,
         'proposal', case when pp.role = 'contributor' and pa.verification = 'verified'
           then (select ${PROPOSAL_JSON} from public.proposals pr where pr.person_id = pa.person_id) end,
         'posts', case when pp.role = 'contributor' then coalesce((
           select jsonb_agg(jsonb_build_object(
             'id', po.id, 'url', po.url, 'title', po.title, 'kind', po.kind, 'published_on', po.published_on,
             'hidden', po.hidden, 'hidden_reason', po.hidden_reason, 'created_at', po.created_at
           ) order by po.published_on desc nulls last, po.created_at desc)
           from public.posts po
           where po.person_id = pa.person_id and po.created_by = pa.user_id and po.source = 'owner'
         ), '[]'::jsonb) else '[]'::jsonb end
       ) as item
       from public.participations pa
       join public.project_people pp on pp.id = pa.person_id
       join public.projects p on p.id = pp.project_id
       join public.organizations o on o.id = p.organization_id
       where pa.user_id = $1
     ) claims`,
    [userId],
  );
  return (rows[0]?.items ?? []) as MyParticipation[];
}

/** Proposal row for an owner action; null unless the user holds a verified claim on its slot. */
export async function getOwnedProposal(userId: string, proposalId: string) {
  const rows = await db().query(
    `select pr.id, pr.person_id, pr.slug::text as slug, pr.file_key, pr.file_sha256, pr.locked_at, pr.status
     from public.proposals pr
     join public.participations pa on pa.person_id = pr.person_id and pa.user_id = $1 and pa.verification = 'verified'
     where pr.id = $2`,
    [userId, proposalId],
  );
  return (rows[0] ?? null) as { id: string; person_id: string; slug: string; file_key: string | null; file_sha256: string | null; locked_at: string | null; status: string } | null;
}

export async function getProposalForAdmin(proposalId: string) {
  const rows = await db().query(
    `select id, person_id, slug::text as slug, file_key, file_sha256, locked_at, status from public.proposals where id = $1`,
    [proposalId],
  );
  return (rows[0] ?? null) as { id: string; person_id: string; slug: string; file_key: string | null; file_sha256: string | null; locked_at: string | null; status: string } | null;
}

// ─────────────────────────── claim picker ───────────────────────────

export async function getClaimYears(): Promise<number[]> {
  const rows = await db()`select distinct year from public.projects where year <= extract(year from now())::int order by year desc`;
  return rows.map((row) => Number(row.year));
}

export async function getClaimOrganizations(year: number): Promise<SlotOrganization[]> {
  const rows = await db()`
    select o.slug::text as slug, o.name, count(p.id)::int as projects
    from public.projects p join public.organizations o on o.id = p.organization_id
    where p.year = ${year}
    group by o.slug, o.name
    order by o.name`;
  return rows as SlotOrganization[];
}

export async function getClaimProjects(year: number, organizationSlug: string): Promise<SlotProject[]> {
  const rows = await db()`
    select p.external_id, p.title,
      coalesce(jsonb_agg(jsonb_build_object(
        'person_id', pp.id, 'role', pp.role, 'archived_name', pp.archived_name, 'ordinal', pp.ordinal,
        'verified', exists (select 1 from public.participations pa where pa.person_id = pp.id and pa.verification = 'verified')
      ) order by pp.role, pp.ordinal) filter (where pp.id is not null), '[]'::jsonb) as people
    from public.projects p
    join public.organizations o on o.id = p.organization_id
    left join public.project_people pp on pp.project_id = p.id
    where p.year = ${year} and o.slug = ${organizationSlug}::citext
    group by p.id, p.external_id, p.title
    order by p.title`;
  return rows as SlotProject[];
}

/** Year, organization and archive spelling of a project id in any case, to prefill the picker from a link. */
export async function getClaimPrefill(externalId: string) {
  const rows = await db()`
    select p.year, o.slug::text as organization_slug, p.external_id as project_external_id
    from public.projects p join public.organizations o on o.id = p.organization_id
    where lower(p.external_id) = lower(${externalId})
    order by p.external_id = ${externalId} desc
    limit 1`;
  return (rows[0] ?? null) as { year: number; organization_slug: string; project_external_id: string } | null;
}
