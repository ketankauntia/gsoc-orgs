-- Catalog: organizations, projects, the people Google's archive lists on each
-- project, and the technology/topic vocabulary. Imported from new-api-details/
-- by scripts/import-catalog.ts; the app only reads it.
--
-- The app reaches Postgres from the server only, so there is no row-level
-- security here. Functions are SECURITY DEFINER with an empty search_path and
-- are not executable by PUBLIC, so a restricted application role can later be
-- granted exactly what it needs.

create extension if not exists citext;
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  selection_status text not null default 'selected',
  withdrawn_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  primary key (organization_id, year),
  constraint organization_years_selection_status_check check (
    (selection_status = 'selected' and withdrawn_at is null)
    or (selection_status = 'withdrawn' and withdrawn_at is not null)
  )
);
create index organization_years_year_selection_status_idx on public.organization_years(year, selection_status);

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
  -- The contributor's final work product as published in Google's archive.
  work_product_url text,
  work_product_kind text check (work_product_kind in ('report_blog', 'gist', 'repo_pr', 'docs', 'org_site', 'other')),
  source_payload jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_year_idx on public.projects(year);
create index projects_org_year_idx on public.projects(organization_id, year);
create index projects_title_search_idx on public.projects using gin (to_tsvector('simple', title));

-- One row per person Google's archive lists on a project: the contributor
-- (ordinal 1 today) and each mentor. Claims, proposals and posts point at a
-- row here, never at a name.
create table public.project_people (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  role text not null check (role in ('contributor', 'mentor')),
  archived_name text not null check (char_length(archived_name) between 1 and 200),
  archived_profile_url text,
  ordinal smallint not null check (ordinal > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, role, ordinal)
);
create index project_people_name_idx on public.project_people(lower(archived_name));

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
create index organization_technologies_technology_idx on public.organization_technologies(technology_id);
create table public.organization_topics (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (organization_id, topic_id)
);
create index organization_topics_topic_idx on public.organization_topics(topic_id);
create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  primary key (project_id, technology_id)
);
create index project_technologies_technology_idx on public.project_technologies(technology_id);

create table public.technology_aliases (
  id uuid primary key default gen_random_uuid(),
  technology_id uuid not null references public.technologies(id) on delete cascade,
  alias text not null,
  normalized_alias citext not null unique,
  source text not null check (source in ('google', 'legacy', 'editorial')),
  review_status text not null default 'approved' check (review_status in ('proposed', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index technology_aliases_technology_id_idx on public.technology_aliases(technology_id);

create table public.topic_aliases (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  alias text not null,
  normalized_alias citext not null unique,
  source text not null check (source in ('google', 'legacy', 'editorial')),
  review_status text not null default 'approved' check (review_status in ('proposed', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topic_aliases_topic_id_idx on public.topic_aliases(topic_id);

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

create trigger organizations_touch before update on public.organizations
for each row execute function private.touch_updated_at();
create trigger projects_touch before update on public.projects
for each row execute function private.touch_updated_at();
create trigger project_people_touch before update on public.project_people
for each row execute function private.touch_updated_at();
create trigger technology_aliases_touch before update on public.technology_aliases
for each row execute function private.touch_updated_at();
create trigger topic_aliases_touch before update on public.topic_aliases
for each row execute function private.touch_updated_at();

create view public.year_stats as
select
  p.year,
  count(distinct p.organization_id)::integer as organizations,
  count(distinct p.id)::integer as projects,
  count(pp.id)::integer as contributors
from public.projects p
left join public.project_people pp on pp.project_id = p.id and pp.role = 'contributor'
group by p.year;

-- Merge technologies whose names map to the same canonical vocabulary group.
-- p_groups: [{ slug, name, aliases: [raw names] }, ...]
create or replace function public.consolidate_catalog_technologies(p_groups jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  create temp table vocabulary_groups (
    slug text primary key,
    name text not null,
    aliases jsonb not null,
    keeper_id uuid
  ) on commit drop;

  insert into vocabulary_groups(slug, name, aliases)
  select slug, name, aliases
  from jsonb_to_recordset(p_groups) as item(slug text, name text, aliases jsonb);

  if exists (
    select 1 from vocabulary_groups
    where slug is null or slug = '' or name is null or name = '' or jsonb_typeof(aliases) <> 'array'
  ) then
    raise exception 'Invalid technology consolidation group';
  end if;

  create temp table vocabulary_aliases (
    normalized_alias text primary key,
    target_slug text not null references vocabulary_groups(slug)
  ) on commit drop;

  insert into vocabulary_aliases(normalized_alias, target_slug)
  select distinct lower(regexp_replace(btrim(raw_alias.value), '\s+', ' ', 'g')), vocabulary_groups.slug
  from vocabulary_groups
  cross join lateral jsonb_array_elements_text(vocabulary_groups.aliases) as raw_alias(value);

  create temp table vocabulary_sources (
    source_id uuid primary key,
    target_slug text not null references vocabulary_groups(slug),
    preferred boolean not null
  ) on commit drop;

  insert into vocabulary_sources(source_id, target_slug, preferred)
  select technology.id, vocabulary_aliases.target_slug,
    technology.slug::text = vocabulary_aliases.target_slug or technology.name = vocabulary_groups.name
  from public.technologies as technology
  join vocabulary_aliases on vocabulary_aliases.normalized_alias =
    lower(regexp_replace(btrim(technology.name), '\s+', ' ', 'g'))
  join vocabulary_groups on vocabulary_groups.slug = vocabulary_aliases.target_slug;

  update vocabulary_groups as target
  set keeper_id = chosen.source_id
  from (
    select distinct on (target_slug) target_slug, source_id
    from vocabulary_sources
    order by target_slug, preferred desc, source_id::text
  ) as chosen
  where chosen.target_slug = target.slug;

  update public.technologies as technology
  set slug = ('merge-' || replace(technology.id::text, '-', ''))::public.citext,
      name = '__merge__' || technology.id::text
  from vocabulary_sources as source
  where source.source_id = technology.id;

  insert into public.technologies(slug, name)
  select target.slug, target.name
  from vocabulary_groups as target
  where target.keeper_id is null;

  update vocabulary_groups as target
  set keeper_id = technology.id
  from public.technologies as technology
  where target.keeper_id is null and technology.slug = target.slug;

  insert into public.organization_technologies(organization_id, technology_id)
  select relation.organization_id, target.keeper_id
  from public.organization_technologies as relation
  join vocabulary_sources as source on source.source_id = relation.technology_id
  join vocabulary_groups as target on target.slug = source.target_slug
  on conflict do nothing;

  insert into public.project_technologies(project_id, technology_id)
  select relation.project_id, target.keeper_id
  from public.project_technologies as relation
  join vocabulary_sources as source on source.source_id = relation.technology_id
  join vocabulary_groups as target on target.slug = source.target_slug
  on conflict do nothing;

  delete from public.technologies as technology
  using vocabulary_sources as source, vocabulary_groups as target
  where technology.id = source.source_id
    and target.slug = source.target_slug
    and technology.id <> target.keeper_id;

  update public.technologies as technology
  set slug = target.slug, name = target.name
  from vocabulary_groups as target
  where technology.id = target.keeper_id;
end;
$$;

-- Same as above for topics.
create or replace function public.consolidate_catalog_topics(p_groups jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  create temp table vocabulary_groups (
    slug text primary key,
    name text not null,
    aliases jsonb not null,
    keeper_id uuid
  ) on commit drop;

  insert into vocabulary_groups(slug, name, aliases)
  select slug, name, aliases
  from jsonb_to_recordset(p_groups) as item(slug text, name text, aliases jsonb);

  if exists (
    select 1 from vocabulary_groups
    where slug is null or slug = '' or name is null or name = '' or jsonb_typeof(aliases) <> 'array'
  ) then
    raise exception 'Invalid topic consolidation group';
  end if;

  create temp table vocabulary_aliases (
    normalized_alias text primary key,
    target_slug text not null references vocabulary_groups(slug)
  ) on commit drop;

  insert into vocabulary_aliases(normalized_alias, target_slug)
  select distinct lower(regexp_replace(btrim(raw_alias.value), '\s+', ' ', 'g')), vocabulary_groups.slug
  from vocabulary_groups
  cross join lateral jsonb_array_elements_text(vocabulary_groups.aliases) as raw_alias(value);

  create temp table vocabulary_sources (
    source_id uuid primary key,
    target_slug text not null references vocabulary_groups(slug),
    preferred boolean not null
  ) on commit drop;

  insert into vocabulary_sources(source_id, target_slug, preferred)
  select topic.id, vocabulary_aliases.target_slug,
    topic.slug::text = vocabulary_aliases.target_slug or topic.name = vocabulary_groups.name
  from public.topics as topic
  join vocabulary_aliases on vocabulary_aliases.normalized_alias =
    lower(regexp_replace(btrim(topic.name), '\s+', ' ', 'g'))
  join vocabulary_groups on vocabulary_groups.slug = vocabulary_aliases.target_slug;

  update vocabulary_groups as target
  set keeper_id = chosen.source_id
  from (
    select distinct on (target_slug) target_slug, source_id
    from vocabulary_sources
    order by target_slug, preferred desc, source_id::text
  ) as chosen
  where chosen.target_slug = target.slug;

  update public.topics as topic
  set slug = ('merge-' || replace(topic.id::text, '-', ''))::public.citext,
      name = '__merge__' || topic.id::text
  from vocabulary_sources as source
  where source.source_id = topic.id;

  insert into public.topics(slug, name)
  select target.slug, target.name
  from vocabulary_groups as target
  where target.keeper_id is null;

  update vocabulary_groups as target
  set keeper_id = topic.id
  from public.topics as topic
  where target.keeper_id is null and topic.slug = target.slug;

  insert into public.organization_topics(organization_id, topic_id)
  select relation.organization_id, target.keeper_id
  from public.organization_topics as relation
  join vocabulary_sources as source on source.source_id = relation.topic_id
  join vocabulary_groups as target on target.slug = source.target_slug
  on conflict do nothing;

  delete from public.topics as topic
  using vocabulary_sources as source, vocabulary_groups as target
  where topic.id = source.source_id
    and target.slug = source.target_slug
    and topic.id <> target.keeper_id;

  update public.topics as topic
  set slug = target.slug, name = target.name
  from vocabulary_groups as target
  where topic.id = target.keeper_id;
end;
$$;

revoke execute on function public.consolidate_catalog_technologies(jsonb) from public;
revoke execute on function public.consolidate_catalog_topics(jsonb) from public;
