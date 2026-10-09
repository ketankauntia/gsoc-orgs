-- Contributor hub: a NULL-safe publishing rule, a two-step file attach,
-- actor-checked upload release, stricter claim, post and link rules, and two
-- new public_proposals columns.
--
-- Applied while the previous server build is still live: every existing
-- function keeps its name, arguments and result, and views only gain columns
-- at the end.

-- The migration runner wraps each file in a transaction; do not queue behind
-- long readers of the live tables.
set local lock_timeout = '5s';

-- ───────────────────────────── tables ─────────────────────────────

-- Who holds the upload reservation (upload_started_at).
alter table public.proposals add column if not exists upload_started_by uuid;
-- Who accepted the licence: public_proposals counts it as the author's only
-- while that account is the slot's verified owner.
alter table public.proposals add column if not exists licence_accepted_by uuid;
-- Whether the current file came from the admin upload path.
alter table public.proposals add column if not exists file_uploaded_by_admin boolean;
update public.proposals pr set licence_accepted_by = coalesce(
  (select a.actor_id from private.audit_log a
   where a.target = 'proposal' and a.target_id = pr.id and a.action = 'finalize'
   order by a.at desc, a.id desc limit 1),
  pr.file_uploaded_by)
where pr.licence_accepted_at is not null and pr.licence_accepted_by is null;

-- 0002's published rule let a file through when pii_confirmed_sha256 was NULL
-- (`x = NULL` is NULL, and a CHECK only fails on false). Replace it.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.proposals'::regclass and contype = 'c'
      and conname <> 'proposals_published_check'
      and pg_get_constraintdef(oid) like '%pii_confirmed_sha256%'
  loop
    execute format('alter table public.proposals drop constraint %I', c.conname);
  end loop;
end;
$$;
alter table public.proposals drop constraint if exists proposals_published_check;
alter table public.proposals add constraint proposals_published_check check (status <> 'published' or coalesce(
  file_key is not null
  and file_sha256 is not null
  and published_at is not null
  and extraction_status in ('ok', 'failed')
  and ((licence_accepted_at is not null and terms_version is not null)
       or (permission_basis is not null and permission_note is not null and permission_given_at is not null))
  and ((extraction_status = 'ok' and coalesce(jsonb_array_length(pii_findings), 0) = 0)
       or (pii_confirmed_sha256 is not null and pii_confirmed_sha256 = file_sha256)),
  false));

-- A validated upload waiting to be copied onto proposals/<id>.pdf. The
-- proposal keeps describing its current file until finish_proposal_upload.
create table if not exists private.proposal_uploads (
  proposal_id uuid primary key references public.proposals(id) on delete cascade,
  uploaded_by uuid not null,
  is_admin boolean not null,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  bytes integer not null check (bytes between 1 and 10485760),
  pages integer not null check (pages > 0),
  extraction_status text not null check (extraction_status in ('ok', 'failed')),
  text_content text,
  pii_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(pii_findings) = 'array'),
  staged_at timestamptz not null default now()
);
revoke all on private.proposal_uploads from public;

-- Daily claim limit counts claims made, including cancelled ones.
create index if not exists audit_log_actor_idx on private.audit_log(actor_id, action, at desc);

-- Unused: archive search matches titles with ilike.
drop index if exists public.projects_title_search_idx;

-- ───────────────────────────── helpers ─────────────────────────────

-- An http(s) link with a host and no credentials, whitespace, control,
-- invisible or bidi characters or backslashes, at most 2048 bytes.
create or replace function private.is_http_url(p_url text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    octet_length(p_url) <= 2048
    and p_url ~* '^https?://[a-z0-9\u00a1-\uffff][a-z0-9._\u00a1-\uffff-]*(:(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[0-9]{1,4}))?([/?#][^\\[:space:][:cntrl:]]*)?$'
    and p_url !~ '[\u0080-\u00a0\u00ad\u061c\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufe00-\ufe0f\ufeff\ufff9-\ufffb\U000e0000-\U000e007f]',
    false);
$$;

-- Lower-cased host without www, a trailing dot or a default port, https
-- scheme, no fragment, no tracking parameters, no trailing slash. Used to
-- stop the same post being listed twice.
create or replace function private.normalize_url(p_url text)
returns text language plpgsql immutable set search_path = '' as $$
declare
  parts text[];
  host text;
  rest text;
begin
  if not private.is_http_url(btrim(p_url)) then
    raise exception 'Enter a link that starts with http:// or https://';
  end if;
  parts := regexp_match(regexp_replace(btrim(p_url), '#.*$', ''), '^https?://([^/?#]+)(.*)$', 'i');
  host := regexp_replace(regexp_replace(lower(parts[1]), '^www\.', ''), '\.?(:(80|443))?$', '');
  rest := regexp_replace(parts[2], '([?&])(utm_[a-z_]+|fbclid|gclid|mc_cid|mc_eid)=[^&]*', '\1', 'gi');
  rest := regexp_replace(rest, '&{2,}', '&', 'g');
  rest := replace(rest, '?&', '?');
  rest := regexp_replace(rest, '[?&]+$', '');
  rest := regexp_replace(rest, '/+(\?|$)', '\1');
  return 'https://' || host || rest;
end;
$$;

create or replace function private.check_post_fields(p_url text, p_title text, p_kind text, p_published_on date)
returns void language plpgsql stable set search_path = '' as $$
begin
  if not private.is_http_url(btrim(p_url)) then
    raise exception 'Enter a link that starts with http:// or https://';
  end if;
  if p_title is not null and char_length(btrim(p_title)) not between 1 and 140 then
    raise exception 'Titles are 1 to 140 characters';
  end if;
  if coalesce(p_kind, '') not in ('weekly_update', 'midterm', 'final_report', 'talk_video', 'other') then
    raise exception 'Choose a post type';
  end if;
  if p_published_on is not null and p_published_on > current_date + 1 then
    raise exception 'The post date is in the future';
  end if;
end;
$$;

create or replace function private.clean_evidence(p_urls text[])
returns text[] language plpgsql immutable set search_path = '' as $$
declare cleaned text[];
begin
  select coalesce(array_agg(distinct btrim(u)), '{}') into cleaned
  from unnest(coalesce(p_urls, '{}')) as u
  where btrim(u) <> '';
  if cardinality(cleaned) > 3 then raise exception 'Add at most three evidence links'; end if;
  if exists (select 1 from unnest(cleaned) as u where not private.is_http_url(u)) then
    raise exception 'Evidence links must start with http:// or https://';
  end if;
  return cleaned;
end;
$$;

-- Emails compare case-insensitively. Under search_path = '' citext operators
-- are not found and `=` falls back to text, so compare lower() values.
create or replace function private.relink_legacy_account(p_user uuid, p_verified_email text)
returns void language plpgsql set search_path = '' as $$
declare legacy private.legacy_accounts;
begin
  if nullif(btrim(p_verified_email), '') is null or exists (select 1 from public.profiles where user_id = p_user) then return; end if;
  select * into legacy from private.legacy_accounts
  where lower(email::text) = lower(btrim(p_verified_email)) and relinked_to is null
  order by migrated_at
  limit 1
  for update;
  if legacy.legacy_user_id is null or not exists (select 1 from public.profiles where user_id = legacy.legacy_user_id) then return; end if;
  update public.profiles set user_id = p_user where user_id = legacy.legacy_user_id;
  update public.posts set created_by = p_user where created_by = legacy.legacy_user_id;
  update public.proposals set file_uploaded_by = p_user where file_uploaded_by = legacy.legacy_user_id;
  update public.proposals set licence_accepted_by = p_user where licence_accepted_by = legacy.legacy_user_id;
  update private.legacy_accounts set relinked_to = p_user, relinked_at = now() where legacy_user_id = legacy.legacy_user_id;
  perform private.audit(p_user, 'relink_legacy_account', 'profile', p_user, null, jsonb_build_object('legacy_user_id', legacy.legacy_user_id), null);
end;
$$;

-- A rejected claim's posts on the person go, hidden ones included: the account
-- can no longer edit or add posts there, and the links stay free for the
-- person's owner. The removed links stay in the log.
create or replace function private.drop_rejected_posts(p_admin uuid, p_participation uuid)
returns void language plpgsql set search_path = '' as $$
declare
  claim public.participations;
  removed jsonb;
begin
  select * into claim from public.participations where id = p_participation;
  if claim.id is null then return; end if;
  with gone as (
    delete from public.posts
    where person_id = claim.person_id and created_by = claim.user_id and source = 'owner'
    returning url, hidden, hidden_reason
  )
  select jsonb_agg(jsonb_build_object('url', url, 'hidden', hidden, 'hidden_reason', hidden_reason)) into removed from gone;
  if removed is not null then
    perform private.audit(p_admin, 'delete_posts', 'participation', p_participation, 'Claim rejected',
      jsonb_build_object('posts', removed), null);
  end if;
end;
$$;

-- Once a person has a verified account, the other open claims on them are rejected.
create or replace function private.reject_other_claims(p_admin uuid, p_person uuid, p_verified uuid)
returns void language plpgsql set search_path = '' as $$
declare other_id uuid;
begin
  for other_id in
    update public.participations set
      verification = 'rejected', reviewed_at = now(), reviewed_by = p_admin,
      rejection_reason = 'Another account was verified for this person'
    where person_id = p_person and id <> p_verified and verification = 'unverified'
    returning id
  loop
    perform private.audit(p_admin, 'reject', 'participation', other_id, 'Another account was verified for this person',
      jsonb_build_object('verification', 'unverified'), jsonb_build_object('verification', 'rejected'));
    perform private.drop_rejected_posts(p_admin, other_id);
  end loop;
end;
$$;

-- The slot's owner changed: a lock, licence or redaction confirmation the
-- previous account left does not stand for the next one. The proposal leaves
-- public view (the admin can publish it again with a recorded permission).
-- p_former's reservation ends; a file they had pending stays on record, so
-- their copy can no longer finish and nobody confirms or publishes what
-- storage may now hold until a new upload replaces it.
create or replace function private.reset_proposal_consent(p_admin uuid, p_person uuid, p_former uuid, p_reason text)
returns void language plpgsql set search_path = '' as $$
declare row_before public.proposals;
begin
  select * into row_before from public.proposals where person_id = p_person for update;
  if row_before.id is null then return; end if;
  update public.proposals set
    status = case when status = 'removed' then status else 'draft' end,
    locked_at = case when status = 'removed' then locked_at end,
    licence_accepted_at = null,
    licence_accepted_by = null,
    terms_version = null,
    pii_confirmed_sha256 = null,
    upload_started_at = case when upload_started_by = p_former then null else upload_started_at end,
    upload_started_by = case when upload_started_by = p_former then null else upload_started_by end
  where id = row_before.id;
  perform private.audit(p_admin, 'reset_consent', 'proposal', row_before.id, p_reason,
    jsonb_build_object('status', row_before.status, 'locked', row_before.locked_at is not null,
      'licence_accepted_by', row_before.licence_accepted_by, 'pii_confirmed_sha256', row_before.pii_confirmed_sha256),
    jsonb_build_object('status', case when row_before.status = 'removed' then 'removed' else 'draft' end));
end;
$$;

-- p_owner just became the slot's verified owner. A lock or licence left by a
-- different account (one rejected before reset_proposal_consent existed, for
-- example) is reset; the owner's own and the admin's permission stay.
create or replace function private.reset_foreign_consent(p_admin uuid, p_person uuid, p_owner uuid)
returns void language plpgsql set search_path = '' as $$
declare
  current_row public.proposals;
  finalizer uuid;
begin
  select * into current_row from public.proposals where person_id = p_person for update;
  if current_row.id is null or current_row.status = 'removed'
     or (current_row.licence_accepted_at is null and current_row.locked_at is null) then
    return;
  end if;
  finalizer := coalesce(current_row.licence_accepted_by, (
    select a.actor_id from private.audit_log a
    where a.target = 'proposal' and a.target_id = current_row.id and a.action = 'finalize'
    order by a.at desc, a.id desc limit 1));
  if finalizer is not distinct from p_owner then return; end if;
  perform private.reset_proposal_consent(p_admin, p_person, null, 'Another account was verified for this person');
end;
$$;

-- The actor may store a file on this proposal now: an owner needs a verified
-- claim and an unlocked proposal, and the upload must be reserved by the actor.
-- One reservation stores one file: a second complete on it is refused.
create or replace function private.require_upload_reservation(p_actor uuid, p_is_admin boolean, p_row public.proposals)
returns void language plpgsql stable set search_path = '' as $$
begin
  if p_row.id is null then raise exception 'Proposal not found'; end if;
  if not p_is_admin then
    perform private.require_verified_owner(p_actor, p_row.person_id);
    if p_row.locked_at is not null then raise exception 'This proposal is final. Ask us if something needs to change.'; end if;
  end if;
  if p_actor is null or p_row.upload_started_at is null
     or (p_row.upload_started_by is not null and p_row.upload_started_by <> p_actor) then
    raise exception 'Start the upload again';
  end if;
  if exists (select 1 from private.proposal_uploads where proposal_id = p_row.id and staged_at >= p_row.upload_started_at) then
    raise exception 'An upload is already in progress. Try again in a few minutes.';
  end if;
end;
$$;

-- Reserves the proposal of a contributor slot for one upload, creating the
-- row on first use. Concurrent first uploads get the in-progress message.
create or replace function private.reserve_proposal_upload(p_actor uuid, p_person uuid, p_is_admin boolean)
returns uuid language plpgsql set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where person_id = p_person for update;
  if current_row.id is null then
    if not exists (select 1 from public.project_people where id = p_person and role = 'contributor') then
      raise exception 'Proposals belong to a project''s contributor';
    end if;
    insert into public.proposals(person_id, slug, upload_started_at, upload_started_by)
    values (p_person, private.new_proposal_slug(p_person), now(), p_actor)
    on conflict do nothing
    returning * into current_row;
    if current_row.id is not null then return current_row.id; end if;
    select * into current_row from public.proposals where person_id = p_person for update;
    if current_row.id is null then raise exception 'Try again in a moment'; end if;
  end if;
  if not p_is_admin and current_row.locked_at is not null then
    raise exception 'This proposal is final. Ask us if something needs to change.';
  end if;
  if current_row.upload_started_at > now() - interval '10 minutes' then
    raise exception 'An upload is already in progress. Try again in a few minutes.';
  end if;
  update public.proposals set upload_started_at = now(), upload_started_by = p_actor where id = current_row.id;
  return current_row.id;
end;
$$;

-- Ends the actor's own reservation after a failed upload, and drops a
-- proposal row that never received a file, a pending file or a permission.
-- Once the reservation staged a file, only finish or revert end it.
create or replace function private.release_proposal_upload(p_actor uuid, p_proposal uuid, p_is_admin boolean)
returns void language plpgsql set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if p_actor is null or current_row.id is null then return; end if;
  if not p_is_admin then perform private.require_verified_owner(p_actor, current_row.person_id); end if;
  if current_row.upload_started_at is null
     or (current_row.upload_started_by is not null and current_row.upload_started_by <> p_actor) then
    return;
  end if;
  if exists (select 1 from private.proposal_uploads where proposal_id = p_proposal and staged_at >= current_row.upload_started_at) then
    return;
  end if;
  update public.proposals set upload_started_at = null, upload_started_by = null where id = p_proposal;
  delete from public.proposals
  where id = p_proposal and file_key is null and status = 'draft' and published_at is null
    and locked_at is null and permission_basis is null
    and not exists (select 1 from private.proposal_uploads where proposal_id = p_proposal);
end;
$$;

-- ─────────────────────── claims ───────────────────────

create or replace function public.claim_slot(p_user uuid, p_person uuid, p_note text, p_evidence text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_year integer;
  v_evidence text[];
  v_id uuid;
begin
  perform private.require_active(p_user);
  -- Serialize claims per user so concurrent requests cannot pass the limits together.
  perform pg_advisory_xact_lock(hashtextextended('claim:' || p_user::text, 0));

  select pp.role, p.year into v_role, v_year
  from public.project_people pp join public.projects p on p.id = pp.project_id
  where pp.id = p_person;
  if v_role is null then raise exception 'That person is not in the archive'; end if;
  if v_year > extract(year from now())::integer then raise exception 'Claims for % are not open yet', v_year; end if;
  if char_length(coalesce(p_note, '')) > 1000 then raise exception 'Notes are at most 1000 characters'; end if;
  v_evidence := private.clean_evidence(p_evidence);

  if exists (select 1 from public.participations where user_id = p_user and person_id = p_person) then
    raise exception 'You have already claimed this';
  end if;
  if exists (select 1 from public.participations where person_id = p_person and verification = 'verified') then
    raise exception 'Another account is already verified for this person. Contact us if this is you.';
  end if;
  -- Counted from the action log, so cancelling a claim does not free a slot.
  if (select count(*) from private.audit_log
      where actor_id = p_user and action = 'claim' and target = 'participation' and at > now() - interval '1 day') >= 10 then
    raise exception 'Too many claims today. Try again tomorrow.';
  end if;

  if v_role = 'contributor' then
    if exists (select 1 from public.participations pa
        join public.project_people pp on pp.id = pa.person_id
        join public.projects p on p.id = pp.project_id
        where pa.user_id = p_user and pa.verification <> 'rejected' and pp.role = 'contributor' and p.year = v_year) then
      raise exception 'You already claimed a contributor project for %. GSoC accepts one project per contributor each year.', v_year;
    end if;
    if (select count(*) from public.participations pa join public.project_people pp on pp.id = pa.person_id
        where pa.user_id = p_user and pa.verification <> 'rejected' and pp.role = 'contributor') >= 2 then
      raise exception 'GSoC accepts a contributor at most twice';
    end if;
    if exists (select 1 from public.participations pa
        join public.project_people pp on pp.id = pa.person_id
        join public.projects p on p.id = pp.project_id
        where pa.user_id = p_user and pa.verification <> 'rejected' and pp.role = 'mentor' and p.year <= v_year) then
      raise exception 'GSoC does not allow contributing in or after a year you mentored';
    end if;
  else
    if exists (select 1 from public.participations pa
        join public.project_people pp on pp.id = pa.person_id
        join public.projects p on p.id = pp.project_id
        where pa.user_id = p_user and pa.verification <> 'rejected' and pp.role = 'contributor' and p.year >= v_year) then
      raise exception 'GSoC does not allow mentoring in a year you contributed, or contributing after mentoring';
    end if;
  end if;

  insert into public.participations(person_id, user_id, note, evidence_urls)
  values (p_person, p_user, nullif(btrim(p_note), ''), v_evidence)
  returning id into v_id;
  perform private.audit(p_user, 'claim', 'participation', v_id, null, null,
    jsonb_build_object('person_id', p_person, 'role', v_role, 'year', v_year));
  return v_id;
end;
$$;

-- Posts a moderator hid stay, so cancelling and claiming again cannot clear them.
create or replace function public.cancel_my_claim(p_user uuid, p_participation uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare row_before public.participations;
begin
  perform private.require_active(p_user);
  select * into row_before from public.participations where id = p_participation and user_id = p_user for update;
  if row_before.id is null then raise exception 'Claim not found'; end if;
  if row_before.verification <> 'unverified' then raise exception 'Only unverified claims can be cancelled'; end if;
  delete from public.posts where person_id = row_before.person_id and created_by = p_user and source = 'owner' and not hidden;
  delete from public.participations where id = p_participation;
  perform private.audit(p_user, 'cancel_claim', 'participation', p_participation, null, to_jsonb(row_before), null);
end;
$$;

create or replace function public.admin_verify_participation(p_admin uuid, p_participation uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.participations;
begin
  select * into current_row from public.participations where id = p_participation for update;
  if current_row.id is null then raise exception 'Claim not found'; end if;
  if current_row.verification <> 'unverified' then raise exception 'Only unverified claims can be verified'; end if;
  update public.participations set
    verification = 'verified', reviewed_at = now(), reviewed_by = p_admin, rejection_reason = null
  where id = p_participation;
  perform private.audit(p_admin, 'verify', 'participation', p_participation, null,
    jsonb_build_object('verification', current_row.verification), jsonb_build_object('verification', 'verified'));
  perform private.reject_other_claims(p_admin, current_row.person_id, p_participation);
  perform private.reset_foreign_consent(p_admin, current_row.person_id, current_row.user_id);
exception when unique_violation then
  raise exception 'Another account is already verified for this person';
end;
$$;

-- Rejecting a verified owner takes back what the account did as owner: its
-- proposal consent and lock (see reset_proposal_consent) and its posts.
create or replace function public.admin_reject_participation(p_admin uuid, p_participation uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.participations;
begin
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  select * into current_row from public.participations where id = p_participation for update;
  if current_row.id is null then raise exception 'Claim not found'; end if;
  if current_row.verification = 'rejected' then raise exception 'This claim is already rejected'; end if;
  update public.participations set
    verification = 'rejected', reviewed_at = now(), reviewed_by = p_admin, rejection_reason = btrim(p_reason)
  where id = p_participation;
  perform private.audit(p_admin, 'reject', 'participation', p_participation, p_reason,
    jsonb_build_object('verification', current_row.verification), jsonb_build_object('verification', 'rejected'));
  perform private.drop_rejected_posts(p_admin, p_participation);
  if current_row.verification = 'verified' then
    perform private.reset_proposal_consent(p_admin, current_row.person_id, current_row.user_id, 'Owner claim rejected');
  end if;
end;
$$;

-- Admin records a verified claim that the normal rules refuse (for example
-- archive records that predate today's eligibility rules). One contributor
-- project per account each year still holds.
create or replace function public.admin_override_claim(p_admin uuid, p_user uuid, p_person uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_year integer;
  v_id uuid;
begin
  perform private.require_active(p_user);
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  perform pg_advisory_xact_lock(hashtextextended('claim:' || p_user::text, 0));
  select pp.role, p.year into v_role, v_year
  from public.project_people pp join public.projects p on p.id = pp.project_id
  where pp.id = p_person;
  if v_role is null then raise exception 'That person is not in the archive'; end if;
  if v_role = 'contributor' and exists (select 1 from public.participations pa
      join public.project_people pp on pp.id = pa.person_id
      join public.projects p on p.id = pp.project_id
      where pa.user_id = p_user and pa.person_id <> p_person and pa.verification <> 'rejected'
        and pp.role = 'contributor' and p.year = v_year) then
    raise exception 'This account already has a contributor claim for %. Reject that claim first.', v_year;
  end if;
  insert into public.participations(person_id, user_id, verification, reviewed_at, reviewed_by)
  values (p_person, p_user, 'verified', now(), p_admin)
  on conflict (user_id, person_id) do update set
    verification = 'verified', reviewed_at = now(), reviewed_by = p_admin, rejection_reason = null
  returning id into v_id;
  perform private.audit(p_admin, 'override', 'participation', v_id, p_reason, null,
    jsonb_build_object('user_id', p_user, 'person_id', p_person));
  perform private.reject_other_claims(p_admin, p_person, v_id);
  perform private.reset_foreign_consent(p_admin, p_person, p_user);
  return v_id;
exception when unique_violation then
  raise exception 'Another account is already verified for this person';
end;
$$;

-- ─────────────────────── profiles ───────────────────────

create or replace function public.update_my_profile(
  p_user uuid, p_display_name text, p_handle text, p_bio text,
  p_website_url text, p_github_username text, p_x_username text, p_medium_url text, p_is_public boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_handle text := lower(nullif(btrim(p_handle), ''));
  v_github text := nullif(ltrim(btrim(p_github_username), '@'), '');
  v_x text := nullif(ltrim(btrim(p_x_username), '@'), '');
  v_website text := nullif(btrim(p_website_url), '');
  v_medium text := nullif(btrim(p_medium_url), '');
begin
  perform private.require_active(p_user);
  if char_length(btrim(coalesce(p_display_name, ''))) not between 1 and 80 then raise exception 'Names are 1 to 80 characters'; end if;
  if char_length(coalesce(p_bio, '')) > 500 then raise exception 'Bios are at most 500 characters'; end if;
  if v_handle is not null and v_handle !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' then
    raise exception 'Handles are 3 to 30 lowercase letters, digits or hyphens';
  end if;
  if coalesce(p_is_public, false) and v_handle is null then raise exception 'Choose a handle to make your profile public'; end if;
  if v_website is not null and (v_website !~* '^https://' or not private.is_http_url(v_website) or char_length(v_website) > 300) then
    raise exception 'Your website link must start with https://';
  end if;
  if v_medium is not null and (v_medium !~* '^https://' or not private.is_http_url(v_medium) or char_length(v_medium) > 300) then
    raise exception 'Your Medium link must start with https://';
  end if;
  if v_github is not null and (v_github !~ '^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$' or position('--' in v_github) > 0) then
    raise exception 'That is not a valid GitHub username';
  end if;
  if v_x is not null and v_x !~ '^[A-Za-z0-9_]{1,15}$' then raise exception 'That is not a valid X username'; end if;

  update public.profiles set
    display_name = btrim(p_display_name), handle = v_handle, bio = nullif(btrim(p_bio), ''),
    website_url = v_website, github_username = v_github, x_username = v_x, medium_url = v_medium,
    is_public = coalesce(p_is_public, false)
  where user_id = p_user;
exception when unique_violation then
  raise exception 'That handle is taken';
end;
$$;

-- ─────────────────────── proposals ───────────────────────

-- Signed-in owner: returns the proposal id to upload into. Creates the row on
-- first use. Refuses while another upload for the same proposal is in flight.
create or replace function public.start_my_proposal_upload(p_user uuid, p_person uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_verified_owner(p_user, p_person);
  return private.reserve_proposal_upload(p_user, p_person, false);
end;
$$;

-- Admin: same, without the owner and lock checks.
create or replace function public.admin_start_proposal_upload(p_admin uuid, p_person uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  return private.reserve_proposal_upload(p_admin, p_person, true);
end;
$$;

-- Replaced by abandon_my_proposal_upload and admin_abandon_proposal_upload,
-- which check who is asking. Kept for older server builds; does nothing.
create or replace function public.abandon_proposal_upload(p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  null;
end;
$$;

-- Server: the signed-in owner's upload failed before it was staged.
create or replace function public.abandon_my_proposal_upload(p_user uuid, p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.release_proposal_upload(p_user, p_proposal, false);
end;
$$;

-- Server: the admin's upload failed before it was staged.
create or replace function public.admin_abandon_proposal_upload(p_admin uuid, p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.release_proposal_upload(p_admin, p_proposal, true);
end;
$$;

-- Server: before reading an upload, check the actor may still store it here.
create or replace function public.check_proposal_upload(p_actor uuid, p_is_admin boolean, p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal;
  perform private.require_upload_reservation(p_actor, p_is_admin, current_row);
end;
$$;

-- Server, step 1 of 2 once an upload passed validation. Call it BEFORE copying
-- the file onto proposals/<id>.pdf: it records the file as pending and takes
-- the proposal out of public view, so the new file is never served before it
-- is confirmed and published. The reservation stays until step 2. Returns
-- the hash of the file currently on record.
create or replace function public.stage_proposal_file(
  p_actor uuid, p_is_admin boolean, p_proposal uuid,
  p_sha256 text, p_bytes integer, p_pages integer,
  p_extraction_status text, p_text text, p_pii_findings jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  perform private.require_upload_reservation(p_actor, p_is_admin, current_row);
  if coalesce(p_extraction_status, '') not in ('ok', 'failed') then raise exception 'Unknown extraction status'; end if;

  insert into private.proposal_uploads(proposal_id, uploaded_by, is_admin, sha256, bytes, pages, extraction_status, text_content, pii_findings, staged_at)
  values (p_proposal, p_actor, p_is_admin, p_sha256, p_bytes, p_pages, p_extraction_status, p_text, coalesce(p_pii_findings, '[]'::jsonb), now())
  on conflict (proposal_id) do update set
    uploaded_by = excluded.uploaded_by, is_admin = excluded.is_admin, sha256 = excluded.sha256,
    bytes = excluded.bytes, pages = excluded.pages, extraction_status = excluded.extraction_status,
    text_content = excluded.text_content, pii_findings = excluded.pii_findings, staged_at = excluded.staged_at;
  update public.proposals set
    status = case when status = 'published' then 'draft' else status end,
    upload_started_at = now()
  where id = p_proposal;
  return jsonb_build_object('previous_sha256', current_row.file_sha256);
end;
$$;

-- Server, step 2 of 2: the file now sits at proposals/<id>.pdf. Makes the
-- pending file current and ends the reservation. state 'gone': the proposal
-- was deleted or removed meanwhile, so delete the copied object;
-- 'superseded': another upload took over, leave storage alone; 'refused': the
-- owner who uploaded lost the slot meanwhile. With no file on record the copied
-- object is deleted (delete_object); otherwise it stays pending, which blocks
-- confirming and publishing until another upload replaces it.
create or replace function public.finish_proposal_upload(p_actor uuid, p_proposal uuid, p_sha256 text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  row_before public.proposals;
  row_after public.proposals;
  pending private.proposal_uploads;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then return jsonb_build_object('state', 'gone'); end if;
  select * into pending from private.proposal_uploads where proposal_id = p_proposal;
  if pending.proposal_id is null or pending.uploaded_by is distinct from p_actor or pending.sha256 is distinct from p_sha256 then
    return jsonb_build_object('state', case when pending.proposal_id is null and row_before.file_key is null then 'gone' else 'superseded' end);
  end if;
  if not pending.is_admin and (row_before.locked_at is not null or not exists (
      select 1 from public.participations pa
      join public.profiles prof on prof.user_id = pa.user_id and prof.status = 'active'
      where pa.user_id = pending.uploaded_by and pa.person_id = row_before.person_id and pa.verification = 'verified')) then
    update public.proposals set upload_started_at = null, upload_started_by = null
    where id = p_proposal and coalesce(upload_started_by, p_actor) = p_actor;
    if row_before.file_key is null then
      delete from private.proposal_uploads where proposal_id = p_proposal;
    end if;
    perform private.audit(p_actor, 'upload_refused', 'proposal', p_proposal, null, null, jsonb_build_object('sha256', p_sha256));
    return jsonb_build_object('state', 'refused', 'delete_object', row_before.file_key is null);
  end if;

  update public.proposals set
    file_key = 'proposals/' || id::text || '.pdf',
    file_sha256 = pending.sha256,
    file_bytes = pending.bytes,
    file_pages = pending.pages,
    file_version = file_version + 1,
    file_uploaded_by = pending.uploaded_by,
    file_uploaded_by_admin = pending.is_admin,
    file_uploaded_at = now(),
    upload_started_at = null,
    upload_started_by = null,
    extraction_status = pending.extraction_status,
    text_content = pending.text_content,
    pii_findings = pending.pii_findings,
    pii_confirmed_sha256 = null,
    status = 'draft',
    removed_at = null,
    removed_reason = null,
    -- Consent covers one file. A new file, the admin's included, needs the
    -- owner's consent again or a permission the admin records.
    licence_accepted_at = null,
    licence_accepted_by = null,
    terms_version = null,
    -- Permission recorded for an admin upload does not cover the owner's file.
    permission_basis = case when pending.is_admin then permission_basis end,
    permission_note = case when pending.is_admin then permission_note end,
    permission_source_url = case when pending.is_admin then permission_source_url end,
    permission_given_at = case when pending.is_admin then permission_given_at end,
    permission_proof_key = case when pending.is_admin then permission_proof_key end
  where id = p_proposal
  returning * into row_after;
  delete from private.proposal_uploads where proposal_id = p_proposal;

  perform private.audit(p_actor, case when row_before.file_key is null then 'upload' else 'replace' end, 'proposal', p_proposal, null,
    case when row_before.file_key is null then null else jsonb_build_object(
      'sha256', row_before.file_sha256, 'bytes', row_before.file_bytes, 'pages', row_before.file_pages,
      'version', row_before.file_version, 'status', row_before.status) end,
    jsonb_build_object('sha256', pending.sha256, 'bytes', pending.bytes, 'pages', pending.pages,
      'version', row_after.file_version, 'admin', pending.is_admin));
  return jsonb_build_object('state', 'ready', 'file_key', row_after.file_key, 'file_version', row_after.file_version);
end;
$$;

-- Server: copying the staged file failed, and the reservation ends.
-- p_file_intact: the stored object was read back and still holds the file on
-- record, so the pending file is dropped. Otherwise it stays pending, which
-- blocks confirming and publishing until another upload finishes.
create or replace function public.revert_proposal_upload(p_actor uuid, p_proposal uuid, p_sha256 text, p_file_intact boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.proposals where id = p_proposal for update;
  if not exists (select 1 from private.proposal_uploads where proposal_id = p_proposal and uploaded_by = p_actor and sha256 = p_sha256) then
    return;
  end if;
  if coalesce(p_file_intact, false) then
    delete from private.proposal_uploads where proposal_id = p_proposal;
  end if;
  update public.proposals set upload_started_at = null, upload_started_by = null
  where id = p_proposal and coalesce(upload_started_by, p_actor) = p_actor;
  perform private.audit(p_actor, 'upload_failed', 'proposal', p_proposal, null, null,
    jsonb_build_object('sha256', p_sha256, 'file_intact', coalesce(p_file_intact, false)));
end;
$$;

-- Single-step attach used by older server builds, which copy the file right
-- after this call: stage and finish in one go.
create or replace function public.attach_proposal_file(
  p_actor uuid, p_is_admin boolean, p_proposal uuid,
  p_sha256 text, p_bytes integer, p_pages integer,
  p_extraction_status text, p_text text, p_pii_findings jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform public.stage_proposal_file(p_actor, p_is_admin, p_proposal, p_sha256, p_bytes, p_pages, p_extraction_status, p_text, p_pii_findings);
  result := public.finish_proposal_upload(p_actor, p_proposal, p_sha256);
  return jsonb_build_object('file_key', result->>'file_key', 'file_version', (result->>'file_version')::integer);
end;
$$;

-- Owner (unlocked) deletes the proposal and its file. Returns the R2 key to delete.
create or replace function public.delete_my_proposal(p_user uuid, p_proposal uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  row_before public.proposals;
  had_pending boolean;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  perform private.require_verified_owner(p_user, row_before.person_id);
  if row_before.locked_at is not null then raise exception 'This proposal is final. Ask us to remove it.'; end if;
  if row_before.upload_started_at > now() - interval '10 minutes' then
    raise exception 'An upload is in progress. Try again in a few minutes.';
  end if;
  had_pending := exists (select 1 from private.proposal_uploads where proposal_id = p_proposal);
  delete from public.proposals where id = p_proposal;
  perform private.audit(p_user, 'delete', 'proposal', p_proposal, null,
    jsonb_build_object('sha256', row_before.file_sha256, 'version', row_before.file_version, 'status', row_before.status), null);
  return case when row_before.file_key is not null or had_pending then 'proposals/' || p_proposal::text || '.pdf' end;
end;
$$;

-- Owner or admin confirms the current file has no personal data left.
create or replace function public.confirm_proposal_redaction(p_actor uuid, p_is_admin boolean, p_proposal uuid, p_sha256 text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if current_row.id is null then raise exception 'Proposal not found'; end if;
  if not p_is_admin then
    perform private.require_verified_owner(p_actor, current_row.person_id);
    if current_row.locked_at is not null then raise exception 'This proposal is final'; end if;
  end if;
  if exists (select 1 from private.proposal_uploads where proposal_id = p_proposal) then
    raise exception 'The new file is still being saved. If this does not clear in a few minutes, upload it again.';
  end if;
  if current_row.file_sha256 is null or current_row.file_sha256 is distinct from p_sha256 then
    raise exception 'The file changed. Check the current file again.';
  end if;
  update public.proposals set pii_confirmed_sha256 = p_sha256 where id = p_proposal;
  perform private.audit(p_actor, 'confirm_redaction', 'proposal', p_proposal, null, null, jsonb_build_object('sha256', p_sha256));
end;
$$;

-- Owner publishes under CC BY 4.0. After this only the admin can change it.
create or replace function public.finalize_my_proposal(p_user uuid, p_proposal uuid, p_terms_version text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if current_row.id is null then raise exception 'Proposal not found'; end if;
  perform private.require_verified_owner(p_user, current_row.person_id);
  if current_row.locked_at is not null then raise exception 'This proposal is already final'; end if;
  if exists (select 1 from private.proposal_uploads where proposal_id = p_proposal) then
    raise exception 'The new file is still being saved. If this does not clear in a few minutes, upload it again.';
  end if;
  if current_row.file_key is null then raise exception 'Upload your proposal first'; end if;
  if current_row.extraction_status = 'pending' then raise exception 'Your file is still being checked'; end if;
  if (current_row.extraction_status = 'failed' or coalesce(jsonb_array_length(current_row.pii_findings), 0) > 0)
     and current_row.pii_confirmed_sha256 is distinct from current_row.file_sha256 then
    raise exception 'Confirm that personal details are removed from this file';
  end if;
  if char_length(btrim(coalesce(p_terms_version, ''))) not between 1 and 40 then raise exception 'Accept the publishing terms'; end if;

  update public.proposals set
    status = 'published',
    licence_accepted_at = now(),
    licence_accepted_by = p_user,
    terms_version = btrim(p_terms_version),
    published_at = coalesce(published_at, now()),
    locked_at = now()
  where id = p_proposal;
  perform private.audit(p_user, 'finalize', 'proposal', p_proposal, null, null,
    jsonb_build_object('sha256', current_row.file_sha256, 'terms_version', btrim(p_terms_version)));
end;
$$;

-- The owner can ask for removal whenever a file is on record, final or not.
create or replace function public.request_proposal_removal(p_user uuid, p_proposal uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if current_row.id is null then raise exception 'Proposal not found'; end if;
  perform private.require_verified_owner(p_user, current_row.person_id);
  if current_row.status = 'removed' then raise exception 'This proposal is already removed'; end if;
  if current_row.file_key is null then raise exception 'There is no file to remove'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 1000 then raise exception 'Tell us briefly why (3 to 1000 characters)'; end if;
  update public.proposals set removal_requested_at = now() where id = p_proposal;
  perform private.audit(p_user, 'request_removal', 'proposal', p_proposal, p_reason);
end;
$$;

create or replace function public.admin_set_proposal_permission(
  p_admin uuid, p_proposal uuid, p_basis text, p_note text, p_source_url text, p_given_at date, p_proof_key text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  row_before public.proposals;
  v_source text := nullif(btrim(p_source_url), '');
  v_proof text := nullif(btrim(p_proof_key), '');
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  if coalesce(p_basis, '') not in ('author_consent', 'rights_holder_consent', 'already_cc_by_4_0') then raise exception 'Choose a permission basis'; end if;
  if char_length(btrim(coalesce(p_note, ''))) not between 3 and 2000 then raise exception 'Describe the permission (3 to 2000 characters)'; end if;
  if p_given_at is null or p_given_at > current_date then raise exception 'Enter the date permission was given'; end if;
  if p_basis = 'already_cc_by_4_0' and v_source is null then
    raise exception 'Link the CC BY 4.0 source';
  end if;
  if v_source is not null and not private.is_http_url(v_source) then
    raise exception 'The source link must start with http:// or https:// and contain no spaces';
  end if;
  if v_proof is not null and v_proof !~ '^permissions/[0-9a-f-]{36}\.(pdf|png|jpg|webp|txt|eml)$' then
    raise exception 'Unknown permission proof file';
  end if;
  update public.proposals set
    permission_basis = p_basis, permission_note = btrim(p_note),
    permission_source_url = v_source, permission_given_at = p_given_at,
    permission_proof_key = coalesce(v_proof, permission_proof_key)
  where id = p_proposal;
  perform private.audit(p_admin, 'set_permission', 'proposal', p_proposal, null,
    jsonb_build_object('basis', row_before.permission_basis, 'given_at', row_before.permission_given_at),
    jsonb_build_object('basis', p_basis, 'given_at', p_given_at));
end;
$$;

create or replace function public.admin_publish_proposal(p_admin uuid, p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if current_row.id is null then raise exception 'Proposal not found'; end if;
  if current_row.status <> 'draft' then raise exception 'Only drafts can be published'; end if;
  if exists (select 1 from private.proposal_uploads where proposal_id = p_proposal) then
    raise exception 'The new file is still being saved. If this does not clear in a few minutes, upload it again.';
  end if;
  if current_row.file_key is null then raise exception 'Upload a file first'; end if;
  if current_row.extraction_status not in ('ok', 'failed') then raise exception 'The file is still being checked'; end if;
  if not ((current_row.licence_accepted_at is not null and current_row.terms_version is not null)
          or (current_row.permission_basis is not null and current_row.permission_note is not null and current_row.permission_given_at is not null)) then
    raise exception 'Publishing needs the author''s consent or recorded permission';
  end if;
  if (current_row.extraction_status = 'failed' or coalesce(jsonb_array_length(current_row.pii_findings), 0) > 0)
     and current_row.pii_confirmed_sha256 is distinct from current_row.file_sha256 then
    raise exception 'Confirm that personal details are removed from this file';
  end if;
  update public.proposals set status = 'published', published_at = coalesce(published_at, now()) where id = p_proposal;
  perform private.audit(p_admin, 'publish', 'proposal', p_proposal, null, null, jsonb_build_object('sha256', current_row.file_sha256));
exception when check_violation then
  raise exception 'Publishing needs a checked file, the author''s consent or recorded permission, and confirmed redaction';
end;
$$;

-- Admin removes the file and locks the proposal. Returns the R2 key to delete.
-- An upload in flight is dropped; its finish step then reports 'gone'.
create or replace function public.admin_remove_proposal(p_admin uuid, p_proposal uuid, p_reason text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  row_before public.proposals;
  had_pending boolean;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  had_pending := exists (select 1 from private.proposal_uploads where proposal_id = p_proposal);
  delete from private.proposal_uploads where proposal_id = p_proposal;
  update public.proposals set
    status = 'removed', locked_at = coalesce(locked_at, now()), removed_at = now(), removed_reason = btrim(p_reason),
    file_key = null, file_sha256 = null, file_bytes = null, file_pages = null, upload_started_at = null, upload_started_by = null,
    extraction_status = 'pending', text_content = null, pii_findings = null, pii_confirmed_sha256 = null
  where id = p_proposal;
  perform private.audit(p_admin, 'remove', 'proposal', p_proposal, p_reason,
    jsonb_build_object('sha256', row_before.file_sha256, 'version', row_before.file_version, 'status', row_before.status), null);
  return case when row_before.file_key is not null or had_pending then 'proposals/' || p_proposal::text || '.pdf' end;
end;
$$;

-- ─────────────────────── posts ───────────────────────

create or replace function public.update_my_post(
  p_user uuid, p_post uuid, p_url text, p_title text, p_kind text, p_published_on date
) returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.posts;
begin
  perform private.require_active(p_user);
  select * into current_row from public.posts where id = p_post and created_by = p_user and source = 'owner' for update;
  if current_row.id is null then raise exception 'Post not found'; end if;
  if current_row.hidden then raise exception 'This post was hidden by a moderator'; end if;
  if not exists (select 1 from public.participations
      where user_id = p_user and person_id = current_row.person_id and verification <> 'rejected') then
    raise exception 'Posts on a rejected claim cannot be edited';
  end if;
  perform private.check_post_fields(p_url, p_title, p_kind, p_published_on);
  update public.posts set
    url = btrim(p_url), normalized_url = private.normalize_url(p_url),
    title = nullif(btrim(p_title), ''), kind = p_kind, published_on = p_published_on
  where id = p_post;
exception when unique_violation then
  raise exception 'This post is already listed';
end;
$$;

create or replace function public.delete_my_post(p_user uuid, p_post uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.posts;
begin
  perform private.require_active(p_user);
  select * into current_row from public.posts where id = p_post and created_by = p_user and source = 'owner' for update;
  if current_row.id is null then raise exception 'Post not found'; end if;
  -- Hidden posts stay, so the same link cannot be added again.
  if current_row.hidden then raise exception 'This post was hidden by a moderator'; end if;
  delete from public.posts where id = p_post;
end;
$$;

-- ─────────────────────── public views ───────────────────────

-- Appends file_sha256 (readers can check the PDF they downloaded) and
-- has_avatar (owner_avatar_key embeds the user id and will stop being read).
-- A licence counts only while the account that accepted it is the slot's
-- verified owner; otherwise the proposal needs a permission the admin recorded.
create or replace view public.public_proposals as
select
  pr.id,
  pr.slug::text as slug,
  pr.person_id,
  pp.archived_name,
  p.id as project_id,
  p.external_id as project_external_id,
  p.title as project_title,
  p.abstract_short,
  p.year,
  o.slug::text as organization_slug,
  o.name as organization_name,
  pr.file_version,
  pr.file_pages,
  pr.file_bytes,
  pr.published_at,
  pr.file_uploaded_at as file_updated_at,
  owner_profile.user_id is not null as verified,
  coalesce(pr.licence_accepted_at is not null and pr.licence_accepted_by = owner_profile.user_id, false) as author_published,
  case when owner_profile.is_public then owner_profile.handle::text end as owner_handle,
  case when owner_profile.is_public then owner_profile.display_name end as owner_display_name,
  case when owner_profile.is_public then owner_profile.avatar_key end as owner_avatar_key,
  'CC-BY-4.0'::text as licence,
  pr.file_sha256,
  coalesce(owner_profile.is_public and owner_profile.avatar_key is not null, false) as has_avatar
from public.proposals pr
join public.project_people pp on pp.id = pr.person_id
join public.projects p on p.id = pp.project_id
join public.organizations o on o.id = p.organization_id
left join lateral (
  select prof.user_id, prof.is_public, prof.handle, prof.display_name, prof.avatar_key
  from public.participations pa
  join public.profiles prof on prof.user_id = pa.user_id and prof.status = 'active'
  where pa.person_id = pr.person_id and pa.verification = 'verified'
  limit 1
) owner_profile on true
where pr.status = 'published'
  and ((pr.licence_accepted_at is not null and pr.licence_accepted_by = owner_profile.user_id) or pr.permission_basis is not null);

-- Visible posts. An owner's post shows once their claim is verified and while
-- their account is active.
create or replace view public.public_posts as
select
  po.id,
  po.person_id,
  po.url,
  po.title,
  po.kind,
  po.published_on,
  po.created_at,
  po.source,
  pp.archived_name,
  p.external_id as project_external_id,
  p.title as project_title,
  p.year,
  o.slug::text as organization_slug,
  o.name as organization_name,
  (po.source = 'admin' or pa.verification = 'verified') as verified
from public.posts po
join public.project_people pp on pp.id = po.person_id
join public.projects p on p.id = pp.project_id
join public.organizations o on o.id = p.organization_id
left join public.participations pa on po.source = 'owner' and pa.person_id = po.person_id and pa.user_id = po.created_by
left join public.profiles prof on po.source = 'owner' and prof.user_id = po.created_by
where not po.hidden
  and (po.source = 'admin' or (pa.verification = 'verified' and prof.status = 'active'));

-- ─────────────────────── privileges ───────────────────────

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public', fn.signature);
  end loop;
end;
$$;
