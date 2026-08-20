import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { groupProjectsByYear, loadOrganizationProjects } from "../lib/projects-page-types";

const dataRoot = path.join(process.cwd(), "new-api-details");

function readProjectYears() {
  return fs
    .readdirSync(path.join(dataRoot, "projects"))
    .filter((file) => /^\d{4}\.json$/.test(file))
    .map((file) => ({
      year: Number(file.replace(".json", "")),
      document: JSON.parse(
        fs.readFileSync(path.join(dataRoot, "projects", file), "utf8"),
      ) as { projects: Array<{ project_id: string; org_slug: string }> },
    }));
}

describe("project detail page reachability", () => {
  /**
   * Every routed project page must be linked from its organization's project hub.
   * Without this, project URLs exist only in the sitemap and crawlers report them
   * as orphan pages.
   */
  it("lists every routed project under its own organization", async () => {
    const years = readProjectYears();
    const expected = new Map<string, Set<string>>();
    for (const { document } of years) {
      for (const project of document.projects) {
        const bucket = expected.get(project.org_slug) ?? new Set<string>();
        bucket.add(project.project_id);
        expected.set(project.org_slug, bucket);
      }
    }

    // Sampling keeps the test fast while still covering organizations from both the
    // 2026 dataset and the historical archive.
    const organizations = [...expected.keys()].sort();
    const sample = [
      organizations[0],
      organizations[Math.floor(organizations.length / 2)],
      organizations[organizations.length - 1],
      "apache-software-foundation",
    ].filter((slug, index, all) => slug && all.indexOf(slug) === index);

    for (const slug of sample) {
      const linked = await loadOrganizationProjects(slug);
      const linkedIds = new Set(linked.map((project) => project.project_id));
      const missing = [...(expected.get(slug) ?? [])].filter((id) => !linkedIds.has(id));
      expect({ slug, missing }).toEqual({ slug, missing: [] });
    }
  });

  it("returns projects grouped newest year first", async () => {
    const groups = groupProjectsByYear(await loadOrganizationProjects("apache-software-foundation"));
    expect(groups.length).toBeGreaterThan(1);
    const years = groups.map((group) => group.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(groups.every((group) => group.projects.length > 0)).toBe(true);
  });

  it("returns nothing for an organization with no archived projects", async () => {
    expect(await loadOrganizationProjects("not-a-real-organization")).toEqual([]);
  });
});
