import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/202608170001_catalog_taxonomy_aliases.sql"),
  "utf8",
);
const optimizedTopicMigration = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/202608170002_optimize_topic_consolidation.sql"),
  "utf8",
);
const deduplicatedTopicMigration = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/202608170003_deduplicate_topic_alias_inputs.sql"),
  "utf8",
);

describe("taxonomy normalization migration", () => {
  it("stores reviewed aliases with one normalized owner", () => {
    expect(migration).toContain("create table public.technology_aliases");
    expect(migration).toContain("create table public.topic_aliases");
    expect(migration).toContain("normalized_alias citext not null unique");
    expect(migration).toContain("review_status in ('proposed', 'approved', 'rejected')");
  });

  it("consolidates joins before deleting duplicate taxonomy rows", () => {
    const technologyInsert = migration.indexOf("insert into public.organization_technologies");
    const technologyDelete = migration.indexOf("delete from public.technologies");
    const topicInsert = migration.indexOf("insert into public.organization_topics");
    const topicDelete = migration.indexOf("delete from public.topics");
    expect(technologyInsert).toBeGreaterThan(0);
    expect(technologyDelete).toBeGreaterThan(technologyInsert);
    expect(topicInsert).toBeGreaterThan(technologyDelete);
    expect(topicDelete).toBeGreaterThan(topicInsert);
  });

  it("limits consolidation RPCs to the service role", () => {
    expect(migration).toContain("if auth.role() <> 'service_role'");
    expect(migration).toContain("revoke execute on function public.consolidate_catalog_technologies(jsonb) from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.consolidate_catalog_topics(jsonb) to service_role");
  });

  it("uses indexed temporary maps for topic consolidation", () => {
    expect(optimizedTopicMigration).toContain("create temp table vocabulary_aliases");
    expect(optimizedTopicMigration).toContain("normalized_alias text primary key");
    expect(optimizedTopicMigration).toContain("join vocabulary_aliases on vocabulary_aliases.normalized_alias");
  });

  it("deduplicates equivalent canonical and raw topic inputs", () => {
    expect(deduplicatedTopicMigration).toContain("select distinct lower(regexp_replace");
    expect(deduplicatedTopicMigration).toContain("normalized_alias text primary key");
    expect(deduplicatedTopicMigration).toContain("revoke execute on function public.consolidate_catalog_topics(jsonb)");
  });
});
