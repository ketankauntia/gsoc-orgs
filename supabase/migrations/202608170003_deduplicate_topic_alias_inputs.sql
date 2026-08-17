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

revoke execute on function public.consolidate_catalog_topics(jsonb) from public, anon, authenticated;
grant execute on function public.consolidate_catalog_topics(jsonb) to service_role;
