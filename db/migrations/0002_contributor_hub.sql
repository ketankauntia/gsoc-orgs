-- Contributor hub: profiles, claims on archive people, proposals (one per
-- contributor slot, one stored file), progress posts and an audit log.
--
-- Conventions
-- * Only the Next.js server talks to the database. Functions that take p_user
--   expect the id of the signed-in user from a verified Neon Auth session;
--   functions that take p_admin expect a user id the server has checked
--   against ADMIN_USER_IDS. Nothing here trusts a client-supplied id.
-- * Every write goes through a function. `raise exception` messages
--   (SQLSTATE P0001) are written for end users; the server returns them as-is.
-- * User ids come from neon_auth."user". There is no foreign key into that
--   managed schema; profiles are created by ensure_profile at first sign-in.

-- ───────────────────────────── tables ─────────────────────────────

create table public.profiles (
  user_id uuid primary key,
  display_name text not null check (char_length(display_name) between 1 and 80),
  handle public.citext unique check (handle::text ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  bio text check (char_length(bio) <= 500),
  avatar_key text check (avatar_key ~ '^avatars/[0-9a-f-]{36}/google-[0-9a-f]{16}\.(jpg|png|webp)$'),
  website_url text check (website_url ~* '^https://[^[:space:]]+$' and char_length(website_url) <= 300),
  github_username text check (github_username ~ '^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$' and position('--' in github_username) = 0),
  x_username text check (x_username ~ '^[A-Za-z0-9_]{1,15}$'),
  medium_url text check (medium_url ~* '^https://[^[:space:]]+$' and char_length(medium_url) <= 300),
  is_public boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_public or handle is not null)
);

-- A user's claim to be one of the people on a project (contributor or mentor).
create table public.participations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.project_people(id) on delete restrict,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  verification text not null default 'unverified' check (verification in ('unverified', 'verified', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  note text check (char_length(note) <= 1000),
  evidence_urls text[] not null default '{}' check (cardinality(evidence_urls) <= 3),
  story jsonb check (story is null or (jsonb_typeof(story) = 'object' and story ? 'v' and char_length(story::text) <= 8000)),
  story_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, person_id),
  check (verification = 'unverified' or reviewed_at is not null),
  check (verification <> 'rejected' or rejection_reason is not null)
);
-- One verified account per archive person, contributors and mentors alike.
create unique index participations_one_verified_per_person on public.participations(person_id) where verification = 'verified';
create index participations_user_idx on public.participations(user_id, created_at desc);
create index participations_queue_idx on public.participations(verification, created_at);

-- One proposal per contributor slot, with exactly one file in R2 at
-- proposals/<id>.pdf that every replacement overwrites.
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.project_people(id) on delete restrict,
  slug public.citext not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'removed')),
  locked_at timestamptz,
  file_key text unique,
  file_sha256 text check (file_sha256 ~ '^[a-f0-9]{64}$'),
  file_bytes integer check (file_bytes between 1 and 10485760),
  file_pages integer check (file_pages > 0),
  file_version integer not null default 0 check (file_version >= 0),
  file_uploaded_by uuid,
  file_uploaded_at timestamptz,
  upload_started_at timestamptz,
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'ok', 'failed')),
  text_content text,
  pii_findings jsonb check (pii_findings is null or jsonb_typeof(pii_findings) = 'array'),
  pii_confirmed_sha256 text,
  licence_accepted_at timestamptz,
  terms_version text check (char_length(terms_version) between 1 and 40),
  permission_basis text check (permission_basis in ('author_consent', 'rights_holder_consent', 'already_cc_by_4_0')),
  permission_note text check (char_length(permission_note) between 3 and 2000),
  permission_source_url text check (permission_source_url ~* '^https?://[^[:space:]]+$'),
  permission_given_at date,
  permission_proof_key text check (permission_proof_key ~ '^permissions/[0-9a-f-]{36}\.(pdf|png|jpg|webp|txt|eml)$'),
  published_at timestamptz,
  removal_requested_at timestamptz,
  removed_at timestamptz,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (file_key is null or file_key = 'proposals/' || id::text || '.pdf'),
  check ((file_key is null) = (file_sha256 is null)),
  -- Published: a readable file, the author's consent or recorded permission,
  -- and redaction confirmed for this exact file whenever the scan found
  -- personal data or could not read the text.
  check (status <> 'published' or (
    file_key is not null
    and published_at is not null
    and extraction_status in ('ok', 'failed')
    and ((licence_accepted_at is not null and terms_version is not null)
         or (permission_basis is not null and permission_note is not null and permission_given_at is not null))
    and ((extraction_status = 'ok' and coalesce(jsonb_array_length(pii_findings), 0) = 0)
         or pii_confirmed_sha256 = file_sha256)
  )),
  check (status <> 'removed' or (file_key is null and locked_at is not null and removed_at is not null))
);
create index proposals_status_idx on public.proposals(status, published_at desc);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.project_people(id) on delete restrict,
  created_by uuid not null,
  source text not null check (source in ('owner', 'admin')),
  url text not null check (url ~* '^https?://[^[:space:]]+$' and char_length(url) <= 2048),
  normalized_url text not null,
  title text check (char_length(title) between 1 and 140),
  kind text not null default 'weekly_update' check (kind in ('weekly_update', 'midterm', 'final_report', 'talk_video', 'other')),
  published_on date,
  hidden boolean not null default false,
  hidden_at timestamptz,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, normalized_url),
  check (hidden = (hidden_at is not null))
);
create index posts_person_idx on public.posts(person_id, published_on desc nulls last);
create index posts_creator_idx on public.posts(created_by, created_at desc);

create table private.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid not null,
  action text not null,
  target text not null check (target in ('profile', 'participation', 'proposal', 'post')),
  target_id uuid not null,
  reason text,
  before jsonb,
  after jsonb
);
create index audit_log_target_idx on private.audit_log(target, target_id, at desc);

create trigger profiles_touch before update on public.profiles
for each row execute function private.touch_updated_at();
create trigger participations_touch before update on public.participations
for each row execute function private.touch_updated_at();
create trigger proposals_touch before update on public.proposals
for each row execute function private.touch_updated_at();
create trigger posts_touch before update on public.posts
for each row execute function private.touch_updated_at();

create or replace function private.require_contributor_slot()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.project_people where id = new.person_id and role = 'contributor') then
    raise exception 'Proposals and posts belong to a project''s contributor';
  end if;
  return new;
end;
$$;
create trigger proposals_contributor_slot before insert or update of person_id on public.proposals
for each row execute function private.require_contributor_slot();
create trigger posts_contributor_slot before insert or update of person_id on public.posts
for each row execute function private.require_contributor_slot();

-- ───────────────────────────── helpers ─────────────────────────────

create or replace function private.audit(
  p_actor uuid, p_action text, p_target text, p_target_id uuid,
  p_reason text default null, p_before jsonb default null, p_after jsonb default null
) returns void language sql set search_path = '' as $$
  insert into private.audit_log(actor_id, action, target, target_id, reason, before, after)
  values (p_actor, p_action, p_target, p_target_id, nullif(btrim(p_reason), ''), p_before, p_after);
$$;

create or replace function private.require_active(p_user uuid)
returns void language plpgsql stable set search_path = '' as $$
begin
  if p_user is null or not exists (select 1 from public.profiles where user_id = p_user and status = 'active') then
    raise exception 'Your account is not active';
  end if;
end;
$$;

-- The caller holds a verified claim on this contributor slot.
create or replace function private.require_verified_owner(p_user uuid, p_person uuid)
returns void language plpgsql stable set search_path = '' as $$
begin
  perform private.require_active(p_user);
  if not exists (
    select 1 from public.participations pa
    join public.project_people pp on pp.id = pa.person_id
    where pa.user_id = p_user and pa.person_id = p_person
      and pa.verification = 'verified' and pp.role = 'contributor'
  ) then
    raise exception 'Proposals open once your claim is verified';
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
  if exists (select 1 from unnest(cleaned) as u where u !~* '^https?://[^[:space:]]+$' or char_length(u) > 2048) then
    raise exception 'Evidence links must start with http:// or https://';
  end if;
  return cleaned;
end;
$$;

-- Lower-cased host without www, https scheme, no fragment, no tracking
-- parameters, no trailing slash. Used to stop the same post being listed twice.
create or replace function private.normalize_url(p_url text)
returns text language plpgsql immutable set search_path = '' as $$
declare
  parts text[];
  rest text;
begin
  parts := regexp_match(regexp_replace(btrim(p_url), '#.*$', ''), '^https?://([^/?#]+)(.*)$', 'i');
  if parts is null then return lower(btrim(p_url)); end if;
  rest := regexp_replace(parts[2], '([?&])(utm_[a-z_]+|fbclid|gclid|mc_cid|mc_eid)=[^&]*', '\1', 'gi');
  rest := regexp_replace(rest, '&{2,}', '&', 'g');
  rest := replace(rest, '?&', '?');
  rest := regexp_replace(rest, '[?&]+$', '');
  rest := regexp_replace(rest, '/+(\?|$)', '\1');
  return 'https://' || regexp_replace(lower(parts[1]), '^www\.', '') || rest;
end;
$$;

create or replace function private.check_post_fields(p_url text, p_title text, p_kind text, p_published_on date)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if p_url is null or btrim(p_url) !~* '^https?://[^[:space:]]+$' or char_length(btrim(p_url)) > 2048 then
    raise exception 'Enter a link that starts with http:// or https://';
  end if;
  if p_title is not null and char_length(btrim(p_title)) not between 1 and 140 then
    raise exception 'Titles are 1 to 140 characters';
  end if;
  if p_kind not in ('weekly_update', 'midterm', 'final_report', 'talk_video', 'other') then
    raise exception 'Choose a post type';
  end if;
  if p_published_on is not null and p_published_on > current_date + 1 then
    raise exception 'The post date is in the future';
  end if;
end;
$$;

create or replace function private.new_proposal_slug(p_person uuid)
returns text language sql volatile set search_path = '' as $$
  select lower(regexp_replace(
    format('%s-%s-%s-%s', p.year, o.slug, p.external_id, left(replace(gen_random_uuid()::text, '-', ''), 6)),
    '[^a-zA-Z0-9]+', '-', 'g'))
  from public.project_people pp
  join public.projects p on p.id = pp.project_id
  join public.organizations o on o.id = p.organization_id
  where pp.id = p_person;
$$;

-- ─────────────────────── profiles (signed-in user) ───────────────────────

create or replace function public.ensure_profile(p_user uuid, p_display_name text)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare result public.profiles;
begin
  if p_user is null then raise exception 'Sign in first'; end if;
  insert into public.profiles(user_id, display_name)
  values (p_user, left(coalesce(nullif(btrim(p_display_name), ''), 'GSoC contributor'), 80))
  on conflict (user_id) do nothing;
  select * into result from public.profiles where user_id = p_user;
  return result;
end;
$$;

create or replace function public.set_my_avatar(p_user uuid, p_avatar_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_active(p_user);
  update public.profiles set avatar_key = p_avatar_key where user_id = p_user;
end;
$$;

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
  if v_website is not null and (v_website !~* '^https://[^[:space:]]+$' or char_length(v_website) > 300) then
    raise exception 'Your website link must start with https://';
  end if;
  if v_medium is not null and (v_medium !~* '^https://[^[:space:]]+$' or char_length(v_medium) > 300) then
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

-- ─────────────────────── claims (signed-in user) ───────────────────────

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
  if (select count(*) from public.participations where user_id = p_user and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Too many claims today. Try again tomorrow.';
  end if;

  if v_role = 'contributor' then
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

create or replace function public.cancel_my_claim(p_user uuid, p_participation uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare row_before public.participations;
begin
  select * into row_before from public.participations where id = p_participation and user_id = p_user for update;
  if row_before.id is null then raise exception 'Claim not found'; end if;
  if row_before.verification <> 'unverified' then raise exception 'Only unverified claims can be cancelled'; end if;
  delete from public.posts where person_id = row_before.person_id and created_by = p_user and source = 'owner';
  delete from public.participations where id = p_participation;
  perform private.audit(p_user, 'cancel_claim', 'participation', p_participation, null, to_jsonb(row_before), null);
end;
$$;

create or replace function public.save_my_participation(
  p_user uuid, p_participation uuid, p_note text, p_evidence text[], p_story jsonb, p_story_public boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  current_row public.participations;
  v_role text;
begin
  perform private.require_active(p_user);
  select * into current_row from public.participations where id = p_participation and user_id = p_user for update;
  if current_row.id is null then raise exception 'Claim not found'; end if;
  if current_row.verification = 'rejected' then raise exception 'This claim was rejected'; end if;
  select role into v_role from public.project_people where id = current_row.person_id;
  if v_role <> 'contributor' and p_story is not null then raise exception 'Stories are for contributors'; end if;
  if p_story is not null and (jsonb_typeof(p_story) <> 'object' or not p_story ? 'v' or char_length(p_story::text) > 8000) then
    raise exception 'Your answers could not be saved. Shorten them and try again.';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 then raise exception 'Notes are at most 1000 characters'; end if;

  update public.participations set
    -- Notes and evidence support verification, so they freeze once reviewed.
    note = case when verification = 'unverified' then nullif(btrim(p_note), '') else note end,
    evidence_urls = case when verification = 'unverified' then private.clean_evidence(p_evidence) else evidence_urls end,
    story = p_story,
    story_public = coalesce(p_story_public, false) and p_story is not null
  where id = p_participation;
end;
$$;

-- ─────────────────────── proposals ───────────────────────

-- Signed-in owner: returns the proposal id to upload into. Creates the row on
-- first use. Refuses while another upload for the same proposal is in flight.
create or replace function public.start_my_proposal_upload(p_user uuid, p_person uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  perform private.require_verified_owner(p_user, p_person);
  select * into current_row from public.proposals where person_id = p_person for update;
  if current_row.id is null then
    insert into public.proposals(person_id, slug, upload_started_at)
    values (p_person, private.new_proposal_slug(p_person), now())
    returning * into current_row;
    return current_row.id;
  end if;
  if current_row.locked_at is not null then
    raise exception 'This proposal is final. Ask us if something needs to change.';
  end if;
  if current_row.upload_started_at > now() - interval '10 minutes' then
    raise exception 'An upload is already in progress. Try again in a few minutes.';
  end if;
  update public.proposals set upload_started_at = now() where id = current_row.id;
  return current_row.id;
end;
$$;

-- Admin: same, without the owner and lock checks.
create or replace function public.admin_start_proposal_upload(p_admin uuid, p_person uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where person_id = p_person for update;
  if current_row.id is null then
    insert into public.proposals(person_id, slug, upload_started_at)
    values (p_person, private.new_proposal_slug(p_person), now())
    returning * into current_row;
    return current_row.id;
  end if;
  if current_row.upload_started_at > now() - interval '10 minutes' then
    raise exception 'An upload is already in progress. Try again in a few minutes.';
  end if;
  update public.proposals set upload_started_at = now() where id = current_row.id;
  return current_row.id;
end;
$$;

-- Server: an upload failed validation. Frees the slot and drops a row that
-- never received a file.
create or replace function public.abandon_proposal_upload(p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.proposals set upload_started_at = null where id = p_proposal;
  delete from public.proposals where id = p_proposal and file_key is null and status = 'draft' and published_at is null;
end;
$$;

-- Server: the upload passed validation. Call this BEFORE copying the file onto
-- proposals/<id>.pdf: it takes the proposal out of public view first, so the
-- new file is never served before it is confirmed and published.
create or replace function public.attach_proposal_file(
  p_actor uuid, p_is_admin boolean, p_proposal uuid,
  p_sha256 text, p_bytes integer, p_pages integer,
  p_extraction_status text, p_text text, p_pii_findings jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  row_before public.proposals;
  row_after public.proposals;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  if not p_is_admin then
    perform private.require_verified_owner(p_actor, row_before.person_id);
    if row_before.locked_at is not null then raise exception 'This proposal is final. Ask us if something needs to change.'; end if;
  end if;
  if row_before.upload_started_at is null then raise exception 'Start the upload again'; end if;
  if p_extraction_status not in ('ok', 'failed') then raise exception 'Unknown extraction status'; end if;

  update public.proposals set
    file_key = 'proposals/' || id::text || '.pdf',
    file_sha256 = p_sha256,
    file_bytes = p_bytes,
    file_pages = p_pages,
    file_version = file_version + 1,
    file_uploaded_by = p_actor,
    file_uploaded_at = now(),
    upload_started_at = null,
    extraction_status = p_extraction_status,
    text_content = p_text,
    pii_findings = coalesce(p_pii_findings, '[]'::jsonb),
    pii_confirmed_sha256 = null,
    status = 'draft',
    removed_at = null,
    removed_reason = null,
    -- An owner's new file needs the owner's own consent at finalize; an admin
    -- replacement (for example a redacted copy) keeps the consent on record.
    licence_accepted_at = case when p_is_admin then licence_accepted_at end,
    terms_version = case when p_is_admin then terms_version end,
    -- Permission recorded for an admin upload does not cover the owner's file.
    permission_basis = case when p_is_admin then permission_basis end,
    permission_note = case when p_is_admin then permission_note end,
    permission_source_url = case when p_is_admin then permission_source_url end,
    permission_given_at = case when p_is_admin then permission_given_at end,
    permission_proof_key = case when p_is_admin then permission_proof_key end
  where id = p_proposal
  returning * into row_after;

  perform private.audit(p_actor, case when row_before.file_key is null then 'upload' else 'replace' end, 'proposal', p_proposal, null,
    case when row_before.file_key is null then null else jsonb_build_object(
      'sha256', row_before.file_sha256, 'bytes', row_before.file_bytes, 'pages', row_before.file_pages,
      'version', row_before.file_version, 'status', row_before.status) end,
    jsonb_build_object('sha256', p_sha256, 'bytes', p_bytes, 'pages', p_pages, 'version', row_after.file_version, 'admin', p_is_admin));
  return jsonb_build_object('file_key', row_after.file_key, 'file_version', row_after.file_version);
end;
$$;

-- Owner (unlocked) deletes the proposal and its file. Returns the R2 key to delete.
create or replace function public.delete_my_proposal(p_user uuid, p_proposal uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare row_before public.proposals;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  perform private.require_verified_owner(p_user, row_before.person_id);
  if row_before.locked_at is not null then raise exception 'This proposal is final. Ask us to remove it.'; end if;
  delete from public.proposals where id = p_proposal;
  perform private.audit(p_user, 'delete', 'proposal', p_proposal, null,
    jsonb_build_object('sha256', row_before.file_sha256, 'version', row_before.file_version, 'status', row_before.status), null);
  return row_before.file_key;
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
  if current_row.file_sha256 is distinct from p_sha256 then
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
    terms_version = btrim(p_terms_version),
    published_at = coalesce(published_at, now()),
    locked_at = now()
  where id = p_proposal;
  perform private.audit(p_user, 'finalize', 'proposal', p_proposal, null, null,
    jsonb_build_object('sha256', current_row.file_sha256, 'terms_version', btrim(p_terms_version)));
end;
$$;

create or replace function public.request_proposal_removal(p_user uuid, p_proposal uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.proposals;
begin
  select * into current_row from public.proposals where id = p_proposal for update;
  if current_row.id is null then raise exception 'Proposal not found'; end if;
  perform private.require_verified_owner(p_user, current_row.person_id);
  if current_row.status <> 'published' or current_row.locked_at is null then
    raise exception 'You can delete this proposal yourself';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 1000 then raise exception 'Tell us briefly why (3 to 1000 characters)'; end if;
  update public.proposals set removal_requested_at = now() where id = p_proposal;
  perform private.audit(p_user, 'request_removal', 'proposal', p_proposal, p_reason);
end;
$$;

create or replace function public.admin_set_proposal_permission(
  p_admin uuid, p_proposal uuid, p_basis text, p_note text, p_source_url text, p_given_at date, p_proof_key text
) returns void language plpgsql security definer set search_path = '' as $$
declare row_before public.proposals;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  if p_basis not in ('author_consent', 'rights_holder_consent', 'already_cc_by_4_0') then raise exception 'Choose a permission basis'; end if;
  if char_length(btrim(coalesce(p_note, ''))) not between 3 and 2000 then raise exception 'Describe the permission (3 to 2000 characters)'; end if;
  if p_given_at is null or p_given_at > current_date then raise exception 'Enter the date permission was given'; end if;
  if p_basis = 'already_cc_by_4_0' and nullif(btrim(p_source_url), '') is null then
    raise exception 'Link the CC BY 4.0 source';
  end if;
  update public.proposals set
    permission_basis = p_basis, permission_note = btrim(p_note),
    permission_source_url = nullif(btrim(p_source_url), ''), permission_given_at = p_given_at,
    permission_proof_key = coalesce(nullif(btrim(p_proof_key), ''), permission_proof_key)
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
  update public.proposals set status = 'published', published_at = coalesce(published_at, now()) where id = p_proposal;
  perform private.audit(p_admin, 'publish', 'proposal', p_proposal, null, null, jsonb_build_object('sha256', current_row.file_sha256));
exception when check_violation then
  raise exception 'Publishing needs a checked file, the author''s consent or recorded permission, and confirmed redaction';
end;
$$;

-- Admin removes the file and locks the proposal. Returns the R2 key to delete.
create or replace function public.admin_remove_proposal(p_admin uuid, p_proposal uuid, p_reason text)
returns text language plpgsql security definer set search_path = '' as $$
declare row_before public.proposals;
begin
  select * into row_before from public.proposals where id = p_proposal for update;
  if row_before.id is null then raise exception 'Proposal not found'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  update public.proposals set
    status = 'removed', locked_at = coalesce(locked_at, now()), removed_at = now(), removed_reason = btrim(p_reason),
    file_key = null, file_sha256 = null, file_bytes = null, file_pages = null, upload_started_at = null,
    extraction_status = 'pending', text_content = null, pii_findings = null, pii_confirmed_sha256 = null
  where id = p_proposal;
  perform private.audit(p_admin, 'remove', 'proposal', p_proposal, p_reason,
    jsonb_build_object('sha256', row_before.file_sha256, 'version', row_before.file_version, 'status', row_before.status), null);
  return row_before.file_key;
end;
$$;

-- ─────────────────────── posts ───────────────────────

create or replace function public.add_my_post(
  p_user uuid, p_person uuid, p_url text, p_title text, p_kind text, p_published_on date
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_active(p_user);
  if not exists (
    select 1 from public.participations pa join public.project_people pp on pp.id = pa.person_id
    where pa.user_id = p_user and pa.person_id = p_person and pa.verification <> 'rejected' and pp.role = 'contributor'
  ) then
    raise exception 'Claim this project as its contributor to add posts';
  end if;
  perform private.check_post_fields(p_url, p_title, p_kind, p_published_on);
  if (select count(*) from public.posts where created_by = p_user and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You can add 20 posts a day. Try again tomorrow.';
  end if;
  insert into public.posts(person_id, created_by, source, url, normalized_url, title, kind, published_on)
  values (p_person, p_user, 'owner', btrim(p_url), private.normalize_url(p_url), nullif(btrim(p_title), ''), p_kind, p_published_on)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'This post is already listed';
end;
$$;

create or replace function public.update_my_post(
  p_user uuid, p_post uuid, p_url text, p_title text, p_kind text, p_published_on date
) returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.posts;
begin
  perform private.require_active(p_user);
  select * into current_row from public.posts where id = p_post and created_by = p_user and source = 'owner' for update;
  if current_row.id is null then raise exception 'Post not found'; end if;
  if current_row.hidden then raise exception 'This post was hidden by a moderator'; end if;
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
  select * into current_row from public.posts where id = p_post and created_by = p_user and source = 'owner' for update;
  if current_row.id is null then raise exception 'Post not found'; end if;
  -- Hidden posts stay, so the same link cannot be added again.
  if current_row.hidden then raise exception 'This post was hidden by a moderator'; end if;
  delete from public.posts where id = p_post;
end;
$$;

create or replace function public.admin_add_post(
  p_admin uuid, p_person uuid, p_url text, p_title text, p_kind text, p_published_on date
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.check_post_fields(p_url, p_title, p_kind, p_published_on);
  insert into public.posts(person_id, created_by, source, url, normalized_url, title, kind, published_on)
  values (p_person, p_admin, 'admin', btrim(p_url), private.normalize_url(p_url), nullif(btrim(p_title), ''), p_kind, p_published_on)
  returning id into v_id;
  perform private.audit(p_admin, 'add_post', 'post', v_id, null, null, jsonb_build_object('url', btrim(p_url)));
  return v_id;
exception when unique_violation then
  raise exception 'This post is already listed';
end;
$$;

create or replace function public.admin_set_post_hidden(p_admin uuid, p_post uuid, p_hidden boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_hidden and char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  update public.posts set
    hidden = p_hidden,
    hidden_at = case when p_hidden then now() end,
    hidden_reason = case when p_hidden then btrim(p_reason) end
  where id = p_post;
  if not found then raise exception 'Post not found'; end if;
  perform private.audit(p_admin, case when p_hidden then 'hide_post' else 'unhide_post' end, 'post', p_post, p_reason);
end;
$$;

-- ─────────────────────── admin: claims and accounts ───────────────────────

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
exception when unique_violation then
  raise exception 'Another account is already verified for this person';
end;
$$;

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
end;
$$;

-- Admin records a verified claim that the normal rules refuse (for example
-- archive records that predate today's eligibility rules).
create or replace function public.admin_override_claim(p_admin uuid, p_user uuid, p_person uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.require_active(p_user);
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  insert into public.participations(person_id, user_id, verification, reviewed_at, reviewed_by)
  values (p_person, p_user, 'verified', now(), p_admin)
  on conflict (user_id, person_id) do update set
    verification = 'verified', reviewed_at = now(), reviewed_by = p_admin, rejection_reason = null
  returning id into v_id;
  perform private.audit(p_admin, 'override', 'participation', v_id, p_reason, null,
    jsonb_build_object('user_id', p_user, 'person_id', p_person));
  return v_id;
exception when unique_violation then
  raise exception 'Another account is already verified for this person';
end;
$$;

create or replace function public.admin_set_profile_status(p_admin uuid, p_user uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare previous_status text;
begin
  if p_status not in ('active', 'suspended') then raise exception 'Unknown status'; end if;
  if p_status = 'suspended' and char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Give a reason'; end if;
  select status into previous_status from public.profiles where user_id = p_user for update;
  if previous_status is null then raise exception 'Account not found'; end if;
  update public.profiles set status = p_status where user_id = p_user;
  perform private.audit(p_admin, case when p_status = 'suspended' then 'suspend' else 'reinstate' end, 'profile', p_user, p_reason,
    jsonb_build_object('status', previous_status), jsonb_build_object('status', p_status));
end;
$$;

-- ─────────────────────── public views ───────────────────────

-- Verified people with their project. Profile fields only when the profile is public.
create view public.public_people as
select
  pp.id as person_id,
  pp.role,
  pp.archived_name,
  pp.archived_profile_url,
  p.id as project_id,
  p.external_id as project_external_id,
  p.title as project_title,
  p.year,
  o.slug::text as organization_slug,
  o.name as organization_name,
  case when prof.is_public then prof.handle::text end as handle,
  case when prof.is_public then prof.display_name end as display_name,
  case when prof.is_public then prof.avatar_key end as avatar_key,
  pa.reviewed_at as verified_at
from public.participations pa
join public.profiles prof on prof.user_id = pa.user_id and prof.status = 'active'
join public.project_people pp on pp.id = pa.person_id
join public.projects p on p.id = pp.project_id
join public.organizations o on o.id = p.organization_id
where pa.verification = 'verified';

-- Published proposals: either a verified, active owner stands behind it, or
-- the admin recorded permission to publish it.
create view public.public_proposals as
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
  pr.licence_accepted_at is not null as author_published,
  case when owner_profile.is_public then owner_profile.handle::text end as owner_handle,
  case when owner_profile.is_public then owner_profile.display_name end as owner_display_name,
  case when owner_profile.is_public then owner_profile.avatar_key end as owner_avatar_key,
  'CC-BY-4.0'::text as licence
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
  and (owner_profile.user_id is not null or pr.permission_basis is not null);

-- Visible posts. An owner's post shows while their claim is not rejected and
-- their account is active; its badge follows the claim.
create view public.public_posts as
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
  and (po.source = 'admin' or (pa.verification in ('unverified', 'verified') and prof.status = 'active'));

-- Opt-in public profiles with verified history.
create view public.public_profiles as
select
  prof.handle::text as handle,
  prof.display_name,
  prof.bio,
  prof.avatar_key,
  prof.website_url,
  prof.github_username,
  prof.x_username,
  prof.medium_url,
  prof.created_at,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'person_id', pp.id, 'role', pp.role, 'year', p.year,
      'project_external_id', p.external_id, 'project_title', p.title,
      'organization_slug', o.slug::text, 'organization_name', o.name,
      'story', case when pa.story_public then pa.story end
    ) order by p.year desc, pp.role)
    from public.participations pa
    join public.project_people pp on pp.id = pa.person_id
    join public.projects p on p.id = pp.project_id
    join public.organizations o on o.id = p.organization_id
    where pa.user_id = prof.user_id and pa.verification = 'verified'
  ), '[]'::jsonb) as history
from public.profiles prof
where prof.is_public and prof.status = 'active' and prof.handle is not null;

-- ─────────────────────── privileges ───────────────────────

-- Our functions are not executable by PUBLIC. Extension functions (citext)
-- are left alone so a restricted role can still compare citext values.
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
revoke all on all tables in schema private from public;
alter default privileges in schema private revoke execute on functions from public;
