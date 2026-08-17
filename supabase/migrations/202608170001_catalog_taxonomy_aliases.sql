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

alter table public.technology_aliases enable row level security;
alter table public.topic_aliases enable row level security;

create policy "catalog technology aliases public read"
  on public.technology_aliases for select to anon, authenticated using (review_status = 'approved');
create policy "catalog topic aliases public read"
  on public.topic_aliases for select to anon, authenticated using (review_status = 'approved');

grant select on public.technology_aliases, public.topic_aliases to anon, authenticated;

create or replace function public.consolidate_catalog_technologies(p_groups jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

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

  create temp table vocabulary_sources (
    source_id uuid primary key,
    target_slug text not null references vocabulary_groups(slug),
    preferred boolean not null
  ) on commit drop;

  insert into vocabulary_sources(source_id, target_slug, preferred)
  select technology.id, vocabulary_groups.slug,
    technology.slug::text = vocabulary_groups.slug or technology.name = vocabulary_groups.name
  from public.technologies as technology
  join vocabulary_groups on exists (
    select 1
    from jsonb_array_elements_text(vocabulary_groups.aliases) as raw_alias(value)
    where lower(regexp_replace(btrim(raw_alias.value), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(technology.name), '\s+', ' ', 'g'))
  );

  if exists (
    select source_id from vocabulary_sources group by source_id having count(*) > 1
  ) then
    raise exception 'A technology matches multiple canonical groups';
  end if;

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

create or replace function public.consolidate_catalog_topics(p_groups jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

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

  create temp table vocabulary_sources (
    source_id uuid primary key,
    target_slug text not null references vocabulary_groups(slug),
    preferred boolean not null
  ) on commit drop;

  insert into vocabulary_sources(source_id, target_slug, preferred)
  select topic.id, vocabulary_groups.slug,
    topic.slug::text = vocabulary_groups.slug or topic.name = vocabulary_groups.name
  from public.topics as topic
  join vocabulary_groups on exists (
    select 1
    from jsonb_array_elements_text(vocabulary_groups.aliases) as raw_alias(value)
    where lower(regexp_replace(btrim(raw_alias.value), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(topic.name), '\s+', ' ', 'g'))
  );

  if exists (
    select source_id from vocabulary_sources group by source_id having count(*) > 1
  ) then
    raise exception 'A topic matches multiple canonical groups';
  end if;

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

revoke execute on function public.consolidate_catalog_technologies(jsonb) from public, anon, authenticated;
revoke execute on function public.consolidate_catalog_topics(jsonb) from public, anon, authenticated;
grant execute on function public.consolidate_catalog_technologies(jsonb) to service_role;
grant execute on function public.consolidate_catalog_topics(jsonb) to service_role;
