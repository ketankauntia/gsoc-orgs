begin;

create table public.admin_proposal_imports (
  id uuid primary key default gen_random_uuid(),
  project_contributor_id uuid not null references public.project_contributors(id) on delete restrict,
  public_slug citext not null unique,
  display_name text not null check (char_length(display_name) between 1 and 80),
  rights_basis text not null check (rights_basis in ('author_consent', 'rights_holder_consent', 'public_license')),
  permission_note text not null check (char_length(permission_note) between 3 and 2000),
  source_url text check (source_url is null or source_url ~* '^https?://[^[:space:]]+$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'withdrawn')),
  current_file_id uuid,
  license_code text not null default 'CC-BY-4.0' check (license_code = 'CC-BY-4.0'),
  imported_by uuid not null references auth.users(id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_contributor_id)
);
create index admin_proposal_imports_status_idx on public.admin_proposal_imports(status, published_at desc);

create table public.admin_proposal_files (
  id uuid primary key,
  import_id uuid not null references public.admin_proposal_imports(id) on delete cascade,
  r2_key text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 150),
  mime_type text not null check (mime_type = 'application/pdf'),
  byte_size integer not null check (byte_size between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  etag text,
  validation_status public.file_validation_status not null default 'valid',
  created_at timestamptz not null default now(),
  unique (import_id)
);
alter table public.admin_proposal_imports
  add constraint admin_proposal_imports_current_file_fk foreign key (current_file_id)
  references public.admin_proposal_files(id) on delete set null;

create table public.contributor_blogs (
  id uuid primary key default gen_random_uuid(),
  project_contributor_id uuid not null references public.project_contributors(id) on delete cascade,
  title text check (title is null or char_length(title) between 1 and 100),
  url text not null check (url ~* '^https?://[^[:space:]]+$' and char_length(url) <= 2048),
  is_published boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_contributor_id, url)
);
create index contributor_blogs_published_idx on public.contributor_blogs(is_published, created_at desc);

alter table private.moderation_events drop constraint moderation_events_entity_type_check;
alter table private.moderation_events add constraint moderation_events_entity_type_check
  check (entity_type in ('proposal','claim','role','profile','admin_proposal_import','contributor_blog'));

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
  pr.license_code,
  'contributor'::text as submission_source
from public.proposals pr
join public.contributor_claims cc on cc.id = pr.claim_id and cc.status = 'verified'
join public.project_contributors pc on pc.id = cc.project_contributor_id
join public.projects p on p.id = pc.project_id
join public.organizations o on o.id = p.organization_id
join public.profiles prof on prof.user_id = pr.user_id and prof.status = 'active'
join public.proposal_files pf on pf.id = pr.current_file_id and pf.validation_status = 'valid'
where pr.status = 'approved'
union all
select
  api.id,
  api.public_slug::text,
  p.year,
  p.external_id,
  p.title,
  p.abstract_short,
  o.slug::text,
  o.name,
  pc.archived_name,
  apf.byte_size,
  apf.sha256,
  api.display_name,
  null::text,
  null::text,
  '[]'::jsonb,
  api.published_at,
  api.license_code,
  'admin_curated'::text
from public.admin_proposal_imports api
join public.project_contributors pc on pc.id = api.project_contributor_id
join public.projects p on p.id = pc.project_id
join public.organizations o on o.id = p.organization_id
join public.admin_proposal_files apf on apf.id = api.current_file_id and apf.validation_status = 'valid'
where api.status = 'published' and api.published_at is not null;

comment on view public.approved_proposals is
  'Public projection of contributor-submitted and administrator-curated proposals. Private permission evidence, actor identities, and account data are excluded.';

create or replace view public.published_contributor_blogs
with (security_barrier = true) as
select
  cb.id,
  cb.title,
  cb.url,
  cb.created_at,
  pc.id as project_contributor_id,
  pc.archived_name as contributor_name,
  p.external_id as project_external_id,
  p.title as project_title,
  p.year,
  p.project_url,
  p.code_url,
  o.slug::text as organization_slug,
  o.name as organization_name
from public.contributor_blogs cb
join public.project_contributors pc on pc.id = cb.project_contributor_id
join public.projects p on p.id = pc.project_id
join public.organizations o on o.id = p.organization_id
where cb.is_published;

comment on view public.published_contributor_blogs is
  'Curated public contributor blog links with archived project context; administrator identities are excluded.';

create or replace function public.create_admin_proposal_import(
  target_admin_id uuid,
  contributor_slot_id uuid,
  contributor_display_name text,
  permission_basis text,
  private_permission_note text,
  private_source_url text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid := gen_random_uuid(); existing_id uuid; generated_slug text;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (
    select 1 from private.user_roles ur
    join public.profiles prof on prof.user_id = ur.user_id and prof.status = 'active'
    where ur.user_id = target_admin_id and ur.role = 'admin'
  ) then raise exception 'Admin access required'; end if;
  select id into existing_id from public.admin_proposal_imports where project_contributor_id = contributor_slot_id for update;
  if existing_id is not null then
    if not exists (select 1 from public.admin_proposal_imports where id = existing_id and status = 'draft' and imported_by = target_admin_id) then
      raise exception 'A proposal import already exists for this contributor';
    end if;
    update public.admin_proposal_imports set
      display_name = trim(contributor_display_name), rights_basis = permission_basis,
      permission_note = trim(private_permission_note), source_url = nullif(trim(private_source_url), ''), updated_at = now()
    where id = existing_id;
    insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
    values (target_admin_id, 'update_admin_import', 'admin_proposal_import', existing_id, jsonb_build_object('status', 'draft'));
    return existing_id;
  end if;
  select lower(regexp_replace(format('%s-%s-%s-%s', p.year, o.slug, p.external_id, left(replace(new_id::text, '-', ''), 8)), '[^a-zA-Z0-9]+', '-', 'g'))
    into generated_slug
  from public.project_contributors pc
  join public.projects p on p.id = pc.project_id
  join public.organizations o on o.id = p.organization_id
  where pc.id = contributor_slot_id;
  if generated_slug is null then raise exception 'Contributor slot not found'; end if;
  insert into public.admin_proposal_imports(id, project_contributor_id, public_slug, display_name, rights_basis, permission_note, source_url, imported_by)
  values (new_id, contributor_slot_id, generated_slug, trim(contributor_display_name), permission_basis, trim(private_permission_note), nullif(trim(private_source_url), ''), target_admin_id);
  insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
  values (target_admin_id, 'create_admin_import', 'admin_proposal_import', new_id,
    jsonb_build_object('status', 'draft', 'project_contributor_id', contributor_slot_id));
  return new_id;
end;
$$;

create or replace function public.create_contributor_blog(
  target_admin_id uuid,
  contributor_slot_id uuid,
  blog_title text,
  blog_url text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (
    select 1 from private.user_roles ur
    join public.profiles prof on prof.user_id = ur.user_id and prof.status = 'active'
    where ur.user_id = target_admin_id and ur.role = 'admin'
  ) then raise exception 'Admin access required'; end if;
  insert into public.contributor_blogs(project_contributor_id, title, url, created_by)
  values (contributor_slot_id, nullif(trim(blog_title), ''), trim(blog_url), target_admin_id)
  on conflict (project_contributor_id, url) do update set
    title = excluded.title, is_published = true, updated_at = now()
  returning id into new_id;
  insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
  values (target_admin_id, 'publish_contributor_blog', 'contributor_blog', new_id,
    jsonb_build_object('project_contributor_id', contributor_slot_id, 'published', true));
  return new_id;
end;
$$;

create or replace function public.unpublish_contributor_blog(target_admin_id uuid, target_blog_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (
    select 1 from private.user_roles ur
    join public.profiles prof on prof.user_id = ur.user_id and prof.status = 'active'
    where ur.user_id = target_admin_id and ur.role = 'admin'
  ) then raise exception 'Admin access required'; end if;
  update public.contributor_blogs set is_published = false, updated_at = now()
  where id = target_blog_id and is_published;
  if not found then raise exception 'Published blog not found'; end if;
  insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
  values (target_admin_id, 'unpublish_contributor_blog', 'contributor_blog', target_blog_id,
    jsonb_build_object('published', false));
end;
$$;

create or replace function public.publish_admin_proposal_import(
  target_admin_id uuid,
  target_import_id uuid,
  new_file_id uuid,
  new_r2_key text,
  new_original_filename text,
  new_byte_size integer,
  new_sha256 text,
  new_etag text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare import_row public.admin_proposal_imports;
begin
  if (select auth.role()) <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (
    select 1 from private.user_roles ur
    join public.profiles prof on prof.user_id = ur.user_id and prof.status = 'active'
    where ur.user_id = target_admin_id and ur.role = 'admin'
  ) then raise exception 'Admin access required'; end if;
  select * into import_row from public.admin_proposal_imports where id = target_import_id for update;
  if import_row.id is null or import_row.status <> 'draft' then raise exception 'Import is not editable'; end if;
  if import_row.imported_by <> target_admin_id then raise exception 'Import owner mismatch'; end if;
  if new_byte_size < 1 or new_byte_size > 10485760 or new_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'Invalid PDF metadata'; end if;
  insert into public.admin_proposal_files(id, import_id, r2_key, original_filename, mime_type, byte_size, sha256, etag)
  values (new_file_id, target_import_id, new_r2_key, new_original_filename, 'application/pdf', new_byte_size, new_sha256, new_etag);
  update public.admin_proposal_imports
    set current_file_id = new_file_id, status = 'published', published_at = now(), updated_at = now()
    where id = target_import_id;
  insert into private.moderation_events(actor_id, action, entity_type, entity_id, new_value)
  values (target_admin_id, 'publish_admin_import', 'admin_proposal_import', target_import_id,
    jsonb_build_object('status', 'published', 'file_id', new_file_id));
end;
$$;

alter table public.admin_proposal_imports enable row level security;
alter table public.admin_proposal_files enable row level security;
alter table public.contributor_blogs enable row level security;

grant select on public.approved_proposals, public.published_contributor_blogs to anon, authenticated;
revoke all on public.admin_proposal_imports, public.admin_proposal_files, public.contributor_blogs from anon, authenticated;
revoke execute on function public.create_admin_proposal_import(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.create_contributor_blog(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.unpublish_contributor_blog(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.publish_admin_proposal_import(uuid, uuid, uuid, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_admin_proposal_import(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.create_contributor_blog(uuid, uuid, text, text) to service_role;
grant execute on function public.unpublish_contributor_blog(uuid, uuid) to service_role;
grant execute on function public.publish_admin_proposal_import(uuid, uuid, uuid, text, text, integer, text, text) to service_role;

commit;
