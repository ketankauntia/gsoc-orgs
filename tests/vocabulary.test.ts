import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { filterOrganizations, type OrganizationsIndexData } from "../lib/organizations-page-types";
import { getTechIcon } from "../lib/tech-icons";
import {
  assertNoVocabularySlugCollisions,
  buildVocabularyGroups,
  canonicalSlugForPath,
  canonicalTechnology,
  canonicalTopic,
  technologyHref,
  topicHref,
} from "../lib/vocabulary/catalog";

describe("catalog vocabulary", () => {
  it("keeps punctuation-sensitive languages distinct", () => {
    expect(canonicalTechnology("c")).toMatchObject({ name: "C", slug: "c" });
    expect(canonicalTechnology("c++")).toMatchObject({ name: "C++", slug: "cpp" });
    expect(canonicalTechnology("c#")).toMatchObject({ name: "C#", slug: "csharp" });
    expect(canonicalTechnology("C\\C++")).toMatchObject({ name: "C/C++", slug: "c-cpp" });
  });

  it("folds reviewed technology and topic spellings", () => {
    expect(canonicalTechnology("VueJS")).toEqual(canonicalTechnology("vue.js"));
    expect(canonicalTechnology("golang")).toEqual(canonicalTechnology("go"));
    expect(canonicalTopic("realtime")).toEqual(canonicalTopic("real-time"));
    expect(canonicalTopic("#functional-programming")).toEqual(canonicalTopic("functional programming"));
  });

  it("includes canonical names in consolidation groups for idempotent reruns", () => {
    expect(buildVocabularyGroups("technology", ["dlang"])).toEqual([
      { name: "D", slug: "d", aliases: ["D", "dlang"] },
    ]);
    expect(buildVocabularyGroups("topic", ["realtime"])[0].aliases).toEqual(["Real-time", "realtime"]);
  });

  it("maps retired page slugs to canonical paths", () => {
    expect(canonicalSlugForPath("technology", "node-js")).toBe("nodejs");
    expect(canonicalSlugForPath("technology", "vuejs")).toBe("vue");
    expect(canonicalSlugForPath("topic", "realtime")).toBe("real-time");
    expect(canonicalSlugForPath("technology", "text%20mining")).toBe("text-mining");
    expect(canonicalSlugForPath("technology", "c%2B%2B")).toBe("cpp");
    expect(canonicalSlugForPath("topic", "bio%2Fneuro-image-processing")).toBe("bio-neuro-image-processing");
  });

  it("builds taxonomy links from canonical slugs rather than display labels", () => {
    expect(technologyHref("VueJS")).toBe("/tech-stack/vue");
    expect(technologyHref("text mining")).toBe("/tech-stack/text-mining");
    expect(technologyHref("c++")).toBe("/tech-stack/cpp");
    expect(topicHref("bio/neuro image processing")).toBe("/topics/bio-neuro-image-processing");
    expect(topicHref("AI/ML")).toBe("/topics/ai-ml");
  });

  it("does not assign icons from incidental substrings", () => {
    expect(getTechIcon("django")).toBe("🎸");
    expect(getTechIcon("mongodb")).toBe("🍃");
    expect(getTechIcon("bootstrap")).toBe("📦");
    expect(getTechIcon("fonts")).toBe("📦");
  });

  it("filters raw organization tags through canonical values", () => {
    const organizations = [
      { name: "Vue one", technologies: ["vue.js"], topics: ["realtime"] },
      { name: "Vue two", technologies: ["VueJS"], topics: ["real-time"] },
      { name: "Other", technologies: ["Rust"], topics: ["systems"] },
    ].map((item, index) => ({
      id: String(index), slug: `org-${index}`, category: "Other", description: "", image_url: "", url: "",
      active_years: [2025], first_year: 2025, last_year: 2025, is_currently_active: true,
      total_projects: 0, first_time: false, ...item,
    })) as OrganizationsIndexData["organizations"];

    expect(filterOrganizations(organizations, { techs: ["Vue"] }).map((org) => org.name)).toEqual(["Vue one", "Vue two"]);
    expect(filterOrganizations(organizations, { topics: ["Real-time"] }).map((org) => org.name)).toEqual(["Vue one", "Vue two"]);
  });

  it("applies AND and OR logic consistently to normalized filters", () => {
    const organizations = [
      { name: "Both", active_years: [2024, 2025], technologies: ["VueJS", "Rust"], topics: ["realtime", "systems"] },
      { name: "Vue only", active_years: [2025], technologies: ["vue.js"], topics: ["real-time"] },
      { name: "Rust only", active_years: [2024], technologies: ["Rust"], topics: ["systems"] },
    ].map((item, index) => ({
      id: String(index), slug: `logic-${index}`, category: index === 2 ? "Science" : "Other", description: "", image_url: "", url: "",
      first_year: 2024, last_year: 2025, is_currently_active: true, total_projects: 0, first_time: false, ...item,
    })) as OrganizationsIndexData["organizations"];

    expect(filterOrganizations(organizations, { techs: ["Vue", "Rust"], techsLogic: "OR" }).map((org) => org.name)).toEqual(["Both", "Vue only", "Rust only"]);
    expect(filterOrganizations(organizations, { techs: ["Vue", "Rust"], techsLogic: "AND" }).map((org) => org.name)).toEqual(["Both"]);
    expect(filterOrganizations(organizations, { topics: ["Real-time", "systems"], topicsLogic: "AND" }).map((org) => org.name)).toEqual(["Both"]);
    expect(filterOrganizations(organizations, { years: [2024, 2025], yearsLogic: "AND" }).map((org) => org.name)).toEqual(["Both"]);
    expect(filterOrganizations(organizations, { categories: ["Other", "Science"], categoriesLogic: "AND" })).toEqual([]);
  });

  it("accepts the checked-in vocabulary without unreviewed slug collisions", () => {
    const directory = path.join(process.cwd(), "new-api-details", "organizations");
    const organizations = fs.readdirSync(directory)
      .filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file))
      .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")) as { technologies?: string[]; topics?: string[] });

    expect(() => assertNoVocabularySlugCollisions("technology", organizations.flatMap((org) => org.technologies ?? []))).not.toThrow();
    expect(() => assertNoVocabularySlugCollisions("topic", organizations.flatMap((org) => org.topics ?? []))).not.toThrow();
  });

  it("resolves every organization taxonomy label to a generated page", () => {
    const organizations = JSON.parse(fs.readFileSync(
      path.join(process.cwd(), "new-api-details", "organizations", "index.json"),
      "utf8",
    )) as { organizations: Array<{ technologies?: string[]; topics?: string[] }> };
    const techDirectory = path.join(process.cwd(), "new-api-details", "tech-stack");
    const topicDirectory = path.join(process.cwd(), "new-api-details", "topics");

    for (const organization of organizations.organizations) {
      for (const technology of organization.technologies ?? []) {
        const slug = technologyHref(technology).slice("/tech-stack/".length);
        expect(fs.existsSync(path.join(techDirectory, `${slug}.json`)), technology).toBe(true);
      }
      for (const topic of organization.topics ?? []) {
        const slug = topicHref(topic).slice("/topics/".length);
        expect(fs.existsSync(path.join(topicDirectory, `${slug}.json`)), topic).toBe(true);
      }
    }
  });

  it("publishes corrected distinct counts and removes retired duplicates", () => {
    const cpp = JSON.parse(fs.readFileSync(path.join(process.cwd(), "new-api-details", "tech-stack", "cpp.json"), "utf8")) as {
      charts: { popularity_by_year: Array<{ year: number; org_count: number }> };
    };
    expect(cpp.charts.popularity_by_year.find((entry) => entry.year === 2025)?.org_count).toBe(79);
    expect(fs.existsSync(path.join(process.cwd(), "new-api-details", "tech-stack", "vue-js.json"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "new-api-details", "topics", "realtime.json"))).toBe(false);
  });
});
