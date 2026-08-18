import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isTaxonomyIndexEligible } from "../lib/search-index-policy";
import { sitemapIndexXml, sitemapUrlSetXml } from "../lib/sitemap-xml";

describe("sitemap policy", () => {
  it("indexes taxonomy pages only after the documented evidence threshold", () => {
    expect(isTaxonomyIndexEligible(3, 0)).toBe(true);
    expect(isTaxonomyIndexEligible(0, 10)).toBe(true);
    expect(isTaxonomyIndexEligible(2, 9)).toBe(false);
  });

  it("escapes XML values and omits unknown last-modified dates", () => {
    const urlSet = sitemapUrlSetXml([{ url: "https://example.com/a?x=1&y=2" }]);
    const index = sitemapIndexXml(["https://example.com/sitemaps/a&b.xml"]);
    expect(urlSet).toContain("https://example.com/a?x=1&amp;y=2");
    expect(urlSet).not.toContain("<lastmod>");
    expect(index).toContain("a&amp;b.xml");
  });

  it("keeps every generated project linked to a canonical organization", () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "new-api-details", "organizations", "index.json"), "utf8"),
    ) as { organizations: Array<{ slug: string }> };
    const organizations = new Set(index.organizations.map((organization) => organization.slug));
    const invalid: string[] = [];
    for (const file of fs.readdirSync(path.join(process.cwd(), "new-api-details", "projects"))) {
      if (!/^\d{4}\.json$/.test(file)) continue;
      const document = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "new-api-details", "projects", file), "utf8"),
      ) as { projects: Array<{ project_id: string; org_slug: string }> };
      for (const project of document.projects) {
        if (!organizations.has(project.org_slug)) invalid.push(`${file}:${project.project_id}`);
      }
    }
    expect(invalid).toEqual([]);
  });
});
