import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { scriptDb } from "./lib/db";
import {
  buildVocabularyGroups,
  canonicalTechnology,
  canonicalTopic,
  vocabularyAliasKey,
} from "../lib/vocabulary/catalog";

type OrganizationSource = {
  slug: string;
  technologies?: string[];
  topics?: string[];
};

type ProjectSource = { tech_stack?: string[] };

type JoinedOrganization = {
  slug: string;
  source_payload: OrganizationSource;
  technology_slugs: string[];
  topic_slugs: string[];
};

const root = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sorted(values: Iterable<string>) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertSameSet(actual: Iterable<string>, expected: Iterable<string>, label: string) {
  const actualValues = sorted(new Set(actual));
  const expectedValues = sorted(new Set(expected));
  assert(JSON.stringify(actualValues) === JSON.stringify(expectedValues),
    `${label} mismatch\nexpected=${JSON.stringify(expectedValues)}\nactual=${JSON.stringify(actualValues)}`);
}

function loadSources() {
  const organizationDirectory = path.join(root, "new-api-details", "organizations");
  const organizations = fs.readdirSync(organizationDirectory)
    .filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(organizationDirectory, file), "utf8")) as OrganizationSource);
  const projectDirectory = path.join(root, "new-api-details", "projects");
  const projects = fs.readdirSync(projectDirectory)
    .filter((file) => /^(201[6-9]|202[0-5])\.json$/.test(file))
    .sort()
    .flatMap((file) => (JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")) as { projects?: ProjectSource[] }).projects ?? []);
  return { organizations, projects };
}

async function verify() {
  const sql = scriptDb();
  const { organizations: sources, projects } = loadSources();
  const rawTechnologies = [...sources.flatMap((org) => org.technologies ?? []), ...projects.flatMap((project) => project.tech_stack ?? [])];
  const rawTopics = sources.flatMap((org) => org.topics ?? []);
  const technologyGroups = buildVocabularyGroups("technology", rawTechnologies);
  const topicGroups = buildVocabularyGroups("topic", rawTopics);

  const [technologies, topics, technologyAliases, topicAliases, databaseOrganizations, latestRuns] = await Promise.all([
    sql`select id, slug::text as slug, name from public.technologies`,
    sql`select id, slug::text as slug, name from public.topics`,
    sql`select a.alias, a.normalized_alias::text as normalized_alias, t.slug::text as slug from public.technology_aliases a join public.technologies t on t.id = a.technology_id`,
    sql`select a.alias, a.normalized_alias::text as normalized_alias, t.slug::text as slug from public.topic_aliases a join public.topics t on t.id = a.topic_id`,
    sql`select o.slug::text as slug, o.source_payload,
          coalesce((select array_agg(t.slug::text) from public.organization_technologies ot join public.technologies t on t.id = ot.technology_id where ot.organization_id = o.id), '{}') as technology_slugs,
          coalesce((select array_agg(t.slug::text) from public.organization_topics ot join public.topics t on t.id = ot.topic_id where ot.organization_id = o.id), '{}') as topic_slugs
        from public.organizations o`,
    sql`select id, status, completed_at from public.import_runs where source = 'checked-in-json' order by started_at desc limit 5`,
  ]);

  assertSameSet(technologies.map((row) => `${row.slug}:${row.name}`), technologyGroups.map((group) => `${group.slug}:${group.name}`), "technology catalog");
  assertSameSet(topics.map((row) => `${row.slug}:${row.name}`), topicGroups.map((group) => `${group.slug}:${group.name}`), "topic catalog");

  const expectedTechAliases = new Set(rawTechnologies.map(vocabularyAliasKey));
  const expectedTopicAliases = new Set(rawTopics.map(vocabularyAliasKey));
  assertSameSet(technologyAliases.map((row) => row.normalized_alias), expectedTechAliases, "technology aliases");
  assertSameSet(topicAliases.map((row) => row.normalized_alias), expectedTopicAliases, "topic aliases");
  for (const row of technologyAliases) {
    assert(row.slug === canonicalTechnology(row.alias).slug, `technology alias ${row.alias} points to ${row.slug}`);
  }
  for (const row of topicAliases) {
    assert(row.slug === canonicalTopic(row.alias).slug, `topic alias ${row.alias} points to ${row.slug}`);
  }

  assertSameSet(databaseOrganizations.map((row) => row.slug), sources.map((row) => row.slug), "organizations");
  const sourceBySlug = new Map(sources.map((source) => [source.slug, source]));
  for (const databaseOrganization of databaseOrganizations as unknown as JoinedOrganization[]) {
    const source = sourceBySlug.get(databaseOrganization.slug);
    assert(source, `missing checked-in organization ${databaseOrganization.slug}`);
    assertSameSet(
      databaseOrganization.technology_slugs,
      (source.technologies ?? []).map((value) => canonicalTechnology(value).slug),
      `${source.slug} technologies`,
    );
    assertSameSet(
      databaseOrganization.topic_slugs,
      (source.topics ?? []).map((value) => canonicalTopic(value).slug),
      `${source.slug} topics`,
    );
    const payload = databaseOrganization.source_payload;
    assertSameSet(payload.technologies ?? [], source.technologies ?? [], `${source.slug} raw technology payload`);
    assertSameSet(payload.topics ?? [], source.topics ?? [], `${source.slug} raw topic payload`);
  }

  assert(latestRuns[0]?.status === "completed", "latest checked-in JSON import did not complete");
  assert(canonicalTechnology("C").slug !== canonicalTechnology("C++").slug, "C and C++ were merged");
  assert(canonicalTechnology("C++").slug !== canonicalTechnology("C#").slug, "C++ and C# were merged");
  assert(canonicalTechnology("VueJS").slug === canonicalTechnology("vue.js").slug, "Vue aliases diverged");
  assert(canonicalTopic("realtime").slug === canonicalTopic("real-time").slug, "real-time aliases diverged");

  console.log(JSON.stringify({
    verified: true,
    organizations: databaseOrganizations.length,
    technologies: technologies.length,
    technologyAliases: technologyAliases.length,
    topics: topics.length,
    topicAliases: topicAliases.length,
    latestImport: latestRuns[0],
  }, null, 2));
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
