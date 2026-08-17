import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
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
  organization_technologies: Array<{ technologies: { slug: string } | null }>;
  organization_topics: Array<{ topics: { slug: string } | null }>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase service-role environment variables are required");

const client = createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } });
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

async function selectAll<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
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

async function verify(client: SupabaseClient<Database>) {
  const { organizations: sources, projects } = loadSources();
  const rawTechnologies = [...sources.flatMap((org) => org.technologies ?? []), ...projects.flatMap((project) => project.tech_stack ?? [])];
  const rawTopics = sources.flatMap((org) => org.topics ?? []);
  const technologyGroups = buildVocabularyGroups("technology", rawTechnologies);
  const topicGroups = buildVocabularyGroups("topic", rawTopics);

  const [technologies, topics, technologyAliases, topicAliases, databaseOrganizations, latestRuns] = await Promise.all([
    selectAll((from, to) => client.from("technologies").select("id,slug,name").order("id").range(from, to)),
    selectAll((from, to) => client.from("topics").select("id,slug,name").order("id").range(from, to)),
    selectAll((from, to) => client.from("technology_aliases").select("alias,normalized_alias,technologies(slug)").order("id").range(from, to)),
    selectAll((from, to) => client.from("topic_aliases").select("alias,normalized_alias,topics(slug)").order("id").range(from, to)),
    selectAll((from, to) => client.from("organizations")
      .select("slug,source_payload,organization_technologies(technologies(slug)),organization_topics(topics(slug))")
      .order("id").range(from, to)),
    client.from("import_runs").select("id,status,completed_at").eq("source", "checked-in-json").order("started_at", { ascending: false }).limit(5),
  ]);

  assertSameSet(technologies.map((row) => `${row.slug}:${row.name}`), technologyGroups.map((group) => `${group.slug}:${group.name}`), "technology catalog");
  assertSameSet(topics.map((row) => `${row.slug}:${row.name}`), topicGroups.map((group) => `${group.slug}:${group.name}`), "topic catalog");

  const expectedTechAliases = new Set(rawTechnologies.map(vocabularyAliasKey));
  const expectedTopicAliases = new Set(rawTopics.map(vocabularyAliasKey));
  assertSameSet(technologyAliases.map((row) => row.normalized_alias), expectedTechAliases, "technology aliases");
  assertSameSet(topicAliases.map((row) => row.normalized_alias), expectedTopicAliases, "topic aliases");
  for (const row of technologyAliases) {
    assert(row.technologies?.slug === canonicalTechnology(row.alias).slug, `technology alias ${row.alias} points to ${row.technologies?.slug}`);
  }
  for (const row of topicAliases) {
    assert(row.topics?.slug === canonicalTopic(row.alias).slug, `topic alias ${row.alias} points to ${row.topics?.slug}`);
  }

  assertSameSet(databaseOrganizations.map((row) => row.slug), sources.map((row) => row.slug), "organizations");
  const sourceBySlug = new Map(sources.map((source) => [source.slug, source]));
  for (const databaseOrganization of databaseOrganizations as unknown as JoinedOrganization[]) {
    const source = sourceBySlug.get(databaseOrganization.slug);
    assert(source, `missing checked-in organization ${databaseOrganization.slug}`);
    assertSameSet(
      databaseOrganization.organization_technologies.flatMap((join) => join.technologies?.slug ?? []),
      (source.technologies ?? []).map((value) => canonicalTechnology(value).slug),
      `${source.slug} technologies`,
    );
    assertSameSet(
      databaseOrganization.organization_topics.flatMap((join) => join.topics?.slug ?? []),
      (source.topics ?? []).map((value) => canonicalTopic(value).slug),
      `${source.slug} topics`,
    );
    const payload = databaseOrganization.source_payload;
    assertSameSet(payload.technologies ?? [], source.technologies ?? [], `${source.slug} raw technology payload`);
    assertSameSet(payload.topics ?? [], source.topics ?? [], `${source.slug} raw topic payload`);
  }

  if (latestRuns.error) throw new Error(latestRuns.error.message);
  assert(latestRuns.data?.[0]?.status === "completed", "latest checked-in JSON import did not complete");
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
    latestImport: latestRuns.data?.[0],
  }, null, 2));
}

verify(client).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
