begin;

create extension if not exists pgcrypto;
create extension if not exists citext;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.account_status as enum ('active', 'suspended', 'deleted');
create type public.claim_status as enum ('pending', 'verified', 'rejected');
create type public.proposal_status as enum ('draft', 'pending', 'changes_requested', 'approved', 'rejected', 'withdrawn');
create type public.file_validation_status as enum ('quarantined', 'valid', 'invalid', 'superseded');
create type private.app_role as enum ('moderator', 'admin');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  canonical_id text unique,
  slug citext not null unique,
  name text not null,
  category text not null default '',
  description text not null default '',
  website text,
  contact jsonb not null default '{}'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  image_url text,
  image_background_color text,
  logo_r2_url text,
  active_years integer[] not null default '{}',
  first_year integer,
  last_year integer,
  first_time boolean not null default false,
  is_currently_active boolean not null default false,
  total_projects integer not null default 0 check (total_projects >= 0),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_years (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year integer not null check (year between 2005 and 2100),
  project_count integer not null default 0 check (project_count >= 0),
  archive_url text,
  source_payload jsonb not null default '{}'::jsonb,
  primary key (organization_id, year)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  legacy_id text unique,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  year integer not null check (year between 2005 and 2100),
  title text not null,
  abstract_short text,
  info_html text,
  project_url text,
  code_url text,
  source_payload jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_year_idx on public.projects(year);
create index projects_org_year_idx on public.projects(organization_id, year);
create index projects_title_search_idx on public.projects using gin (to_tsvector('simple', title));

create table public.project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  archived_name text not null,
  archived_profile_url text,
  ordinal smallint not null default 1 check (ordinal > 0),
  created_at timestamptz not null default now(),
  unique (project_id, ordinal)
);

create table public.project_mentors (
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  ordinal smallint not null default 1 check (ordinal > 0),
  primary key (project_id, ordinal)
);

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null unique
);
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null unique
);
create table public.organization_technologies (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  primary key (organization_id, technology_id)
);
create table public.organization_topics (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (organization_id, topic_id)
);
create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  primary key (project_id, technology_id)
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  interests text[] not null default '{}',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  invited_at timestamptz,
  converted_at timestamptz
);

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_checksum text,
  status text not null check (status in ('running', 'completed', 'failed')),
  counts jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 500),
  google_avatar_url text,
  avatar_r2_key text,
  avatar_public boolean not null default true,
  bio_public boolean not null default true,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  platform text not null check (platform in ('github','gitlab','linkedin','x','mastodon','bluesky','youtube','reddit','stackoverflow','medium','portfolio','custom')),
  label text check (label is null or char_length(label) <= 50),
  url text not null check (url ~* '^https?://[^[:space:]]+$'),
  is_public boolean not null default true,
  position smallint not null default 0 check (position between 0 and 99),
  created_at timestamptz not null default now()
);
create index profile_links_user_idx on public.profile_links(user_id, position);

create table private.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role private.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table private.rate_limit_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  bucket_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (user_id, action, bucket_started_at)
);

create table public.contributor_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_contributor_id uuid not null references public.project_contributors(id) on delete restrict,
  year integer not null check (year between 2005 and 2100),
  status public.claim_status not null default 'pending',
  claimant_note text check (claimant_note is null or char_length(claimant_note) <= 1000),
  evidence_urls text[] not null default '{}' check (cardinality(evidence_urls) <= 2),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_contributor_id)
);
create unique index contributor_claims_user_year_active_idx
  on public.contributor_claims(user_id, year) where status <> 'rejected';
create unique index contributor_claims_verified_slot_idx
  on public.contributor_claims(project_contributor_id) where status = 'verified';
create index contributor_claims_user_idx on public.contributor_claims(user_id, created_at desc);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.contributor_claims(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_slug citext not null unique,
  status public.proposal_status not null default 'draft',
  current_file_id uuid,
  license_code text check (license_code is null or license_code = 'CC-BY-4.0'),
  license_version text,
  license_accepted_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  moderator_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index proposals_user_idx on public.proposals(user_id, created_at desc);
create index proposals_public_idx on public.proposals(status, reviewed_at desc);
alter table public.proposals add constraint proposals_user_profile_fk
  foreign key (user_id) references public.profiles(user_id) on delete cascade;

create table public.proposal_files (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  version integer not null check (version > 0),
  r2_key text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 150),
  mime_type text not null check (mime_type = 'application/pdf'),
  byte_size integer not null check (byte_size between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  etag text,
  validation_status public.file_validation_status not null,
  validation_error text,
  created_at timestamptz not null default now(),
  unique (proposal_id, version)
);
alter table public.proposals
  add constraint proposals_current_file_fk foreign key (current_file_id)
  references public.proposal_files(id) on delete set null;

create table private.moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null check (entity_type in ('proposal','claim','role','profile')),
  entity_id uuid not null,
  reason text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index moderation_events_entity_idx on private.moderation_events(entity_type, entity_id, created_at desc);

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_touch before update on public.organizations
for each row execute function private.touch_updated_at();
create trigger projects_touch before update on public.projects
for each row execute function private.touch_updated_at();
create trigger profiles_touch before update on public.profiles
for each row execute function private.touch_updated_at();
create trigger claims_touch before update on public.contributor_claims
for each row execute function private.touch_updated_at();
create trigger proposals_touch before update on public.proposals
for each row execute function private.touch_updated_at();

create or replace function private.validate_profile_link_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare total_count integer; custom_count integer;
begin
  select count(*), count(*) filter (where platform = 'custom')
  into total_count, custom_count
  from public.profile_links
  where user_id = new.user_id and (tg_op <> 'UPDATE' or id <> new.id);
  if total_count >= 12 then raise exception 'A profile can contain at most 12 links'; end if;
  if new.platform = 'custom' and custom_count >= 2 then raise exception 'A profile can contain at most 2 custom links'; end if;
  return new;
end;
$$;
create trigger profile_link_limits before insert or update on public.profile_links
for each row execute function private.validate_profile_link_limits();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, display_name, google_avatar_url)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'GSoC contributor'), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.has_role(required_role private.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.user_roles
    where user_id = (select auth.uid())
      and (role = required_role or role = 'admin')
      and exists (select 1 from public.profiles where user_id = auth.uid() and status = 'active')
  );
$$;

create or replace function public.consume_rate_limit(requested_action text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  window_seconds integer;
  request_limit integer;
  bucket timestamptz;
  current_count integer;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where user_id = caller and status = 'active') then raise exception 'Active account required'; end if;
  select limits.window_seconds, limits.request_limit
    into window_seconds, request_limit
  from (values
    ('create_claim', 86400, 10),
    ('upload_url', 3600, 20),
    ('upload_complete', 3600, 20),
    ('submit_proposal', 3600, 20),
    ('refresh_avatar', 86400, 5),
    ('moderate_proposal', 3600, 120),
    ('manage_roles', 3600, 30)
  ) as limits(action, window_seconds, request_limit)
  where limits.action = requested_action;
  if window_seconds is null then raise exception 'Unsupported rate-limit action'; end if;

  delete from private.rate_limit_buckets
  where user_id = caller and bucket_started_at < clock_timestamp() - interval '2 days';
  bucket := to_timestamp(floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds);
  insert into private.rate_limit_buckets(user_id, action, bucket_started_at, request_count)
  values (caller, requested_action, bucket, 1)
  on conflict (user_id, action, bucket_started_at)
  do update set request_count = private.rate_limit_buckets.request_count + 1
  returning request_count into current_count;
  return current_count <= request_limit;
end;
$$;

create or replace function public.create_contributor_claim(
  contributor_slot_id uuid,
  private_note text default null,
  private_evidence_urls text[] default '{}'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  slot_year integer;
  project_external_id text;
  organization_slug text;
  active_claims integer;
  new_claim_id uuid;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where user_id = caller and status = 'active') then raise exception 'Active account required'; end if;
  if not public.consume_rate_limit('create_claim') then raise exception 'Claim rate limit exceeded'; end if;
  if cardinality(coalesce(private_evidence_urls, '{}')) > 2 then raise exception 'At most two evidence URLs are allowed'; end if;
  if exists (select 1 from unnest(coalesce(private_evidence_urls, '{}')) value where value !~* '^https?://[^[:space:]]+$') then
    raise exception 'Evidence URLs must use HTTP or HTTPS';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  select p.year, p.external_id, o.slug::text
    into slot_year, project_external_id, organization_slug
  from public.project_contributors pc
  join public.projects p on p.id = pc.project_id
  join public.organizations o on o.id = p.organization_id
  where pc.id = contributor_slot_id and p.year <= 2025;
  if slot_year is null then raise exception 'Contributor slot is not available for claims'; end if;

  select count(*) into active_claims
  from public.contributor_claims
  where user_id = caller and status <> 'rejected';
  if active_claims >= 2 then raise exception 'A contributor can hold at most two active GSoC claims'; end if;

  insert into public.contributor_claims(user_id, project_contributor_id, year, claimant_note, evidence_urls)
  values (caller, contributor_slot_id, slot_year, nullif(trim(private_note), ''), coalesce(private_evidence_urls, '{}'))
  returning id into new_claim_id;

  insert into public.proposals(claim_id, user_id, public_slug)
  values (
    new_claim_id,
    caller,
    lower(regexp_replace(format('%s-%s-%s-%s', slot_year, organization_slug, project_external_id, left(replace(new_claim_id::text, '-', ''), 8)), '[^a-zA-Z0-9]+', '-', 'g'))
  );
  return new_claim_id;
end;
$$;

create or replace view public.approved_proposals
with (security_barrier = true) as
select
  pr.id,
  pr.public_slug::text as public_slug,
  p.year,
  p.external_id as project_external_id,
  p.title as project_title,
  p.abstract_short,
  o.slug::text as organization_slug,
  o.name as organization_name,
  pc.archived_name as archived_contributor_name,
  pf.byte_size as pdf_byte_size,
  pf.sha256 as pdf_sha256,
  prof.display_name,
  case when prof.avatar_public then prof.avatar_r2_key end as avatar_r2_key,
  case when prof.bio_public then prof.bio end as bio,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'platform', pl.platform,
      'label', pl.label,
      'url', pl.url,
      'position', pl.position
    ) order by pl.position, pl.created_at)
    from public.profile_links pl
    where pl.user_id = pr.user_id and pl.is_public
  ), '[]'::jsonb) as profile_links,
  pr.reviewed_at as approved_at,
  pr.license_code
from public.proposals pr
join public.contributor_claims cc on cc.id = pr.claim_id and cc.status = 'verified'
join public.project_contributors pc on pc.id = cc.project_contributor_id
join public.projects p on p.id = pc.project_id
join public.organizations o on o.id = p.organization_id
join public.profiles prof on prof.user_id = pr.user_id and prof.status = 'active'
join public.proposal_files pf on pf.id = pr.current_file_id and pf.validation_status = 'valid'
where pr.status = 'approved';

comment on view public.approved_proposals is
  'Deliberate security-definer public projection. It exposes only approved, verified proposal metadata and never selects auth.users or email.';

create or replace view public.year_stats
with (security_invoker = true, security_barrier = true) as
select
  p.year,
  count(distinct p.organization_id)::integer as organizations,
  count(distinct p.id)::integer as projects,
  count(pc.id)::integer as contributors
from public.projects p
left join public.project_contributors pc on pc.project_id = p.id
group by p.year;

create or replace function public.get_my_roles()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(role::text order by role::text), '{}')
  from private.user_roles where user_id = (select auth.uid())
    and exists (select 1 from public.profiles where user_id = auth.uid() and status = 'active');
$$;

create or replace function public.update_my_profile(
  new_display_name text,
  new_bio text,
  new_avatar_public boolean,
  new_bio_public boolean,
  new_links jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(new_display_name, ''))) not between 1 and 80 then raise exception 'Display name is invalid'; end if;
  if new_bio is not null and char_length(new_bio) > 500 then raise exception 'Bio is too long'; end if;
  if new_links is null or jsonb_typeof(new_links) <> 'array' or jsonb_array_length(new_links) > 12 then raise exception 'Profile links are invalid'; end if;
  if (select count(*) from jsonb_array_elements(new_links) link where link ->> 'platform' = 'custom') > 2 then raise exception 'At most two custom links are allowed'; end if;

  update public.profiles set
    display_name = trim(new_display_name), bio = nullif(trim(new_bio), ''),
    avatar_public = new_avatar_public, bio_public = new_bio_public
  where user_id = caller and status = 'active';
  if not found then raise exception 'Active profile not found'; end if;

  delete from public.profile_links where user_id = caller;
  insert into public.profile_links(user_id, platform, label, url, is_public, position)
  select caller, links.platform, nullif(trim(links.label), ''), links.url, links.is_public, links.position
  from jsonb_to_recordset(new_links) as links(platform text, label text, url text, is_public boolean, position smallint);
end;
$$;

create or replace function public.attach_proposal_file(
  target_user_id uuid,
  target_proposal_id uuid,
  new_file_id uuid,
  new_r2_key text,
  new_original_filename text,
  new_byte_size integer,
  new_sha256 text,
  new_etag text default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  proposal_row public.proposals;
  next_version integer;
  previous_key text;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (select 1 from public.profiles where user_id = target_user_id and status = 'active') then raise exception 'Active account required'; end if;
  select * into proposal_row from public.proposals where id = target_proposal_id for update;
  if proposal_row.id is null or proposal_row.user_id <> target_user_id then raise exception 'Proposal not found'; end if;
  if proposal_row.status not in ('draft', 'changes_requested') then raise exception 'Proposal is locked'; end if;
  if new_byte_size < 1 or new_byte_size > 10485760 then raise exception 'PDF is too large'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.proposal_files where proposal_id = target_proposal_id;
  select r2_key into previous_key from public.proposal_files where id = proposal_row.current_file_id;
  update public.proposal_files set validation_status = 'superseded' where id = proposal_row.current_file_id;
  insert into public.proposal_files(id, proposal_id, version, r2_key, original_filename, mime_type, byte_size, sha256, etag, validation_status)
  values (new_file_id, target_proposal_id, next_version, new_r2_key, new_original_filename, 'application/pdf', new_byte_size, new_sha256, new_etag, 'valid');
  update public.proposals set current_file_id = new_file_id where id = target_proposal_id;
  return previous_key;
end;
$$;

create or replace function public.submit_my_proposal(target_user_id uuid, target_proposal_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare proposal_row public.proposals;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  select * into proposal_row from public.proposals where id = target_proposal_id for update;
  if proposal_row.id is null or proposal_row.user_id <> target_user_id then raise exception 'Proposal not found'; end if;
  if proposal_row.status not in ('draft', 'changes_requested') then raise exception 'Proposal is locked'; end if;
  if proposal_row.current_file_id is null or not exists (
    select 1 from public.proposal_files where id = proposal_row.current_file_id and validation_status = 'valid'
  ) then raise exception 'A valid PDF is required'; end if;
  if not exists (select 1 from public.profiles where user_id = target_user_id and status = 'active' and char_length(trim(display_name)) > 0) then
    raise exception 'A complete profile is required';
  end if;
  update public.proposals set
    status = 'pending', license_code = 'CC-BY-4.0', license_version = '4.0',
    license_accepted_at = now(), submitted_at = now(), moderator_reason = null
  where id = target_proposal_id;
end;
$$;

create or replace function public.update_my_proposal_evidence(
  target_proposal_id uuid,
  private_note text,
  private_evidence_urls text[],
  should_update_note boolean,
  should_update_evidence boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  proposal_row public.proposals;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where user_id = caller and status = 'active') then raise exception 'Active account required'; end if;
  if should_update_note and char_length(coalesce(private_note, '')) > 1000 then raise exception 'Claimant note is too long'; end if;
  if should_update_evidence and cardinality(coalesce(private_evidence_urls, '{}')) > 2 then raise exception 'At most two evidence URLs are allowed'; end if;
  if should_update_evidence and exists (select 1 from unnest(coalesce(private_evidence_urls, '{}')) value where value !~* '^https?://[^[:space:]]+$') then
    raise exception 'Evidence URLs must use HTTP or HTTPS';
  end if;
  select * into proposal_row from public.proposals where id = target_proposal_id for update;
  if proposal_row.id is null or proposal_row.user_id <> caller then raise exception 'Proposal not found'; end if;
  if proposal_row.status not in ('draft', 'changes_requested') then raise exception 'Proposal is locked'; end if;
  update public.contributor_claims set
    claimant_note = case when should_update_note then nullif(trim(private_note), '') else claimant_note end,
    evidence_urls = case when should_update_evidence then coalesce(private_evidence_urls, '{}') else evidence_urls end
  where id = proposal_row.claim_id and user_id = caller;
end;
$$;

create or replace function public.delete_my_draft(target_proposal_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  proposal_row public.proposals;
  claim_row public.contributor_claims;
  file_keys jsonb;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles where user_id = caller and status = 'active') then raise exception 'Active account required'; end if;
  select * into proposal_row from public.proposals where id = target_proposal_id for update;
  if proposal_row.id is null or proposal_row.user_id <> caller then raise exception 'Proposal not found'; end if;
  if proposal_row.status not in ('draft', 'changes_requested') then raise exception 'Proposal is locked'; end if;
  select * into claim_row from public.contributor_claims where id = proposal_row.claim_id for update;
  select coalesce(jsonb_agg(r2_key), '[]'::jsonb) into file_keys
  from public.proposal_files where proposal_id = proposal_row.id;

  if claim_row.status = 'pending' then
    delete from public.proposals where id = proposal_row.id;
    delete from public.contributor_claims where id = claim_row.id;
    return jsonb_build_object('action', 'deleted', 'file_keys', file_keys);
  end if;

  update public.proposals set status = 'withdrawn', moderator_reason = null where id = proposal_row.id;
  return jsonb_build_object('action', 'withdrawn', 'file_keys', '[]'::jsonb);
end;
$$;

create or replace function public.moderate_proposal(
  target_proposal_id uuid,
  decision text,
  decision_reason text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  proposal_row public.proposals;
  claim_row public.contributor_claims;
  old_value jsonb;
begin
  if caller is null or not private.has_role('moderator') then raise exception 'Moderator access required'; end if;
  if not public.consume_rate_limit('moderate_proposal') then raise exception 'Moderation rate limit exceeded'; end if;
  if decision not in ('verify_claim','reject_claim','request_changes','approve','reject','reopen') then raise exception 'Unsupported decision'; end if;
  if decision in ('reject_claim','request_changes','reject','reopen') and char_length(trim(coalesce(decision_reason, ''))) < 3 then
    raise exception 'A decision reason is required';
  end if;
  if decision = 'reopen' and not private.has_role('admin') then raise exception 'Admin access required to reopen'; end if;

  select * into proposal_row from public.proposals where id = target_proposal_id for update;
  if proposal_row.id is null then raise exception 'Proposal not found'; end if;
  if proposal_row.user_id = caller then raise exception 'Moderators cannot moderate their own proposal'; end if;
  select * into claim_row from public.contributor_claims where id = proposal_row.claim_id for update;
  old_value := jsonb_build_object('proposal_status', proposal_row.status, 'claim_status', claim_row.status);

  if decision = 'verify_claim' then
    if claim_row.status <> 'pending' then raise exception 'Claim cannot be verified'; end if;
    update public.contributor_claims set status = 'verified', verified_by = caller, verified_at = now(), rejection_reason = null where id = claim_row.id;
  elsif decision = 'reject_claim' then
    if claim_row.status <> 'pending' then raise exception 'Claim cannot be rejected'; end if;
    update public.contributor_claims set status = 'rejected', verified_by = caller, verified_at = now(), rejection_reason = trim(decision_reason) where id = claim_row.id;
    update public.proposals set status = 'rejected', reviewed_by = caller, reviewed_at = now(), moderator_reason = trim(decision_reason) where id = proposal_row.id;
  elsif decision = 'request_changes' then
    if proposal_row.status <> 'pending' then raise exception 'Only pending proposals can request changes'; end if;
    update public.proposals set status = 'changes_requested', reviewed_by = caller, reviewed_at = now(), moderator_reason = trim(decision_reason) where id = proposal_row.id;
  elsif decision = 'approve' then
    if proposal_row.status <> 'pending' or claim_row.status <> 'verified' or proposal_row.current_file_id is null
      or proposal_row.license_accepted_at is null or proposal_row.license_code <> 'CC-BY-4.0'
      or not exists (select 1 from public.proposal_files where id = proposal_row.current_file_id and proposal_id = proposal_row.id and validation_status = 'valid') then
      raise exception 'Approval prerequisites are not satisfied';
    end if;
    update public.proposals set status = 'approved', reviewed_by = caller, reviewed_at = now(), moderator_reason = null where id = proposal_row.id;
  elsif decision = 'reject' then
    if proposal_row.status <> 'pending' then raise exception 'Only pending proposals can be rejected'; end if;
    update public.proposals set status = 'rejected', reviewed_by = caller, reviewed_at = now(), moderator_reason = trim(decision_reason) where id = proposal_row.id;
  elsif decision = 'reopen' then
    if proposal_row.status not in ('approved','rejected','withdrawn') then raise exception 'Proposal cannot be reopened'; end if;
    if claim_row.status = 'rejected' then
      perform pg_advisory_xact_lock(hashtextextended(claim_row.user_id::text, 0));
      if (select count(*) from public.contributor_claims where user_id = claim_row.user_id and status <> 'rejected' and id <> claim_row.id) >= 2 then
        raise exception 'Claim capacity is no longer available';
      end if;
      update public.contributor_claims set status = 'pending', verified_by = null, verified_at = null, rejection_reason = null where id = claim_row.id;
    end if;
    update public.proposals set status = 'changes_requested', reviewed_by = caller, reviewed_at = now(), moderator_reason = trim(decision_reason) where id = proposal_row.id;
  end if;

  insert into private.moderation_events(actor_id, action, entity_type, entity_id, reason, previous_value, new_value)
  values (
    caller, decision, case when decision in ('verify_claim','reject_claim') then 'claim' else 'proposal' end,
    case when decision in ('verify_claim','reject_claim') then claim_row.id else proposal_row.id end,
    nullif(trim(coalesce(decision_reason, '')), ''), old_value,
    jsonb_build_object(
      'proposal_status', (select status from public.proposals where id = proposal_row.id),
      'claim_status', (select status from public.contributor_claims where id = claim_row.id)
    )
  );
end;
$$;

create or replace function public.set_user_role(target_user_id uuid, target_role text, enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); parsed_role private.app_role;
begin
  if caller is null or not private.has_role('admin') then raise exception 'Admin access required'; end if;
  if not public.consume_rate_limit('manage_roles') then raise exception 'Role-management rate limit exceeded'; end if;
  parsed_role := target_role::private.app_role;
  if enabled then
    insert into private.user_roles(user_id, role, granted_by) values (target_user_id, parsed_role, caller)
    on conflict (user_id, role) do nothing;
  else
    if target_user_id = caller and parsed_role = 'admin' then raise exception 'Administrators cannot revoke their own admin role'; end if;
    delete from private.user_roles where user_id = target_user_id and role = parsed_role;
  end if;
  insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
  values (caller, case when enabled then 'grant_role' else 'revoke_role' end, 'role', target_user_id, jsonb_build_object('role', target_role));
end;
$$;

create or replace function public.bootstrap_admin(target_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_user uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  select id into target_user from auth.users where lower(email) = lower(target_email);
  if target_user is null then raise exception 'No authenticated user exists for that email'; end if;
  insert into private.user_roles(user_id, role) values (target_user, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.admin_list_users()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.has_role('admin') then raise exception 'Admin access required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'display_name', p.display_name,
      'roles', coalesce((select jsonb_agg(ur.role::text) from private.user_roles ur where ur.user_id = u.id), '[]'::jsonb),
      'created_at', u.created_at
    ) order by u.created_at desc)
    from auth.users u left join public.profiles p on p.user_id = u.id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_moderation_events(target_entity_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.has_role('moderator') then raise exception 'Moderator access required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'actor_id', actor_id,
      'action', action,
      'entity_type', entity_type,
      'entity_id', entity_id,
      'reason', reason,
      'previous_value', previous_value,
      'new_value', new_value,
      'created_at', created_at
    ) order by created_at desc)
    from private.moderation_events where entity_id = target_entity_id
  ), '[]'::jsonb);
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_years enable row level security;
alter table public.projects enable row level security;
alter table public.project_contributors enable row level security;
alter table public.project_mentors enable row level security;
alter table public.technologies enable row level security;
alter table public.topics enable row level security;
alter table public.organization_technologies enable row level security;
alter table public.organization_topics enable row level security;
alter table public.project_technologies enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.import_runs enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_links enable row level security;
alter table public.contributor_claims enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_files enable row level security;

create policy "catalog organizations public read" on public.organizations for select to anon, authenticated using (true);
create policy "catalog organization years public read" on public.organization_years for select to anon, authenticated using (true);
create policy "catalog projects public read" on public.projects for select to anon, authenticated using (true);
create policy "catalog contributors public read" on public.project_contributors for select to anon, authenticated using (true);
create policy "catalog mentors public read" on public.project_mentors for select to anon, authenticated using (true);
create policy "catalog technologies public read" on public.technologies for select to anon, authenticated using (true);
create policy "catalog topics public read" on public.topics for select to anon, authenticated using (true);
create policy "catalog organization technologies public read" on public.organization_technologies for select to anon, authenticated using (true);
create policy "catalog organization topics public read" on public.organization_topics for select to anon, authenticated using (true);
create policy "catalog project technologies public read" on public.project_technologies for select to anon, authenticated using (true);

create policy "profiles own read" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles own update" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and status = 'active');
create policy "profile links own read" on public.profile_links for select to authenticated using ((select auth.uid()) = user_id);
create policy "profile links own insert" on public.profile_links for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profile links own update" on public.profile_links for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profile links own delete" on public.profile_links for delete to authenticated using ((select auth.uid()) = user_id);
create policy "claims own read" on public.contributor_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "proposals own read" on public.proposals for select to authenticated using ((select auth.uid()) = user_id);
create policy "proposal files own read" on public.proposal_files for select to authenticated using (
  exists (select 1 from public.proposals where proposals.id = proposal_files.proposal_id and proposals.user_id = (select auth.uid()))
);

grant usage on schema public to anon, authenticated;
grant select on public.organizations, public.organization_years, public.projects, public.project_contributors,
  public.project_mentors, public.technologies, public.topics, public.organization_technologies,
  public.organization_topics, public.project_technologies, public.approved_proposals, public.year_stats to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, bio, avatar_public, bio_public, updated_at) on public.profiles to authenticated;
grant select on public.profile_links to authenticated;
grant select on public.contributor_claims, public.proposals, public.proposal_files to authenticated;
revoke execute on function public.create_contributor_claim(uuid, text, text[]) from public, anon;
revoke execute on function public.get_my_roles() from public, anon;
revoke execute on function public.consume_rate_limit(text) from public, anon;
revoke execute on function public.update_my_profile(text, text, boolean, boolean, jsonb) from public, anon;
revoke execute on function public.attach_proposal_file(uuid, uuid, uuid, text, text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.submit_my_proposal(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.update_my_proposal_evidence(uuid, text, text[], boolean, boolean) from public, anon;
revoke execute on function public.delete_my_draft(uuid) from public, anon;
revoke execute on function public.moderate_proposal(uuid, text, text) from public, anon;
revoke execute on function public.set_user_role(uuid, text, boolean) from public, anon;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.get_moderation_events(uuid) from public, anon;
revoke execute on function public.bootstrap_admin(text) from public, anon, authenticated;
grant execute on function public.create_contributor_claim(uuid, text, text[]) to authenticated;
grant execute on function public.get_my_roles() to authenticated;
grant execute on function public.consume_rate_limit(text) to authenticated;
grant execute on function public.update_my_profile(text, text, boolean, boolean, jsonb) to authenticated;
grant execute on function public.attach_proposal_file(uuid, uuid, uuid, text, text, integer, text, text) to service_role;
grant execute on function public.submit_my_proposal(uuid, uuid) to service_role;
grant execute on function public.update_my_proposal_evidence(uuid, text, text[], boolean, boolean) to authenticated;
grant execute on function public.delete_my_draft(uuid) to authenticated;
grant execute on function public.moderate_proposal(uuid, text, text) to authenticated;
grant execute on function public.set_user_role(uuid, text, boolean) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.get_moderation_events(uuid) to authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;

revoke all on public.waitlist_entries, public.import_runs from anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public;
alter default privileges in schema private revoke all on functions from public;

commit;
