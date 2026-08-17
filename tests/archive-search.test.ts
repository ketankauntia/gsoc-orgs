import { describe, expect, it } from "vitest";
import {
  archivePageRange,
  filterArchiveOrganizationsByYear,
  normalizeArchiveQuery,
} from "../lib/proposals/archive-search-core";
import { groupTechnologies } from "../lib/vocabulary/technology";

describe("proposal archive search", () => {
  it("normalizes unsafe and empty filter input", () => {
    expect(normalizeArchiveQuery({ q: "  100%_ coverage  ", organization: "  apache  ", page: -4 })).toEqual({
      page: 1,
      year: undefined,
      q: "100 coverage",
      organization: "apache",
      technology: undefined,
    });
  });

  it("calculates stable inclusive pagination ranges", () => {
    expect(archivePageRange(1)).toEqual({ from: 0, to: 19 });
    expect(archivePageRange(3)).toEqual({ from: 40, to: 59 });
  });

  it("caps extreme page input before building a database range", () => {
    expect(normalizeArchiveQuery({ page: Number.MAX_SAFE_INTEGER }).page).toBe(10_000);
  });

  it("filters organizations to the selected archive year and preserves empty results", () => {
    const organizations = [
      { slug: "one", name: "One", projectCount: 2, years: [2024, 2025] },
      { slug: "two", name: "Two", projectCount: 1, years: [2023] },
    ];
    expect(filterArchiveOrganizationsByYear(organizations, 2025).map((org) => org.slug)).toEqual(["one"]);
    expect(filterArchiveOrganizationsByYear(organizations, 2016)).toEqual([]);
    expect(filterArchiveOrganizationsByYear(organizations)).toEqual(organizations);
  });

  it("folds technology aliases into one searchable group", () => {
    const groups = groupTechnologies([
      { slug: "vue-js", name: "Vue.js", orgCount: 2 },
      { slug: "vuejs", name: "VueJS", orgCount: 3 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].orgCount).toBe(5);
    expect(groups[0].slugs).toEqual(expect.arrayContaining(["vue-js", "vuejs"]));
  });
});
