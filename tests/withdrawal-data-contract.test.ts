import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("checked-in 2026 withdrawal contract", () => {
  const ledger = JSON.parse(fs.readFileSync(path.join(root, "new-api-details", "withdrawals.json"), "utf-8"));
  const yearly = JSON.parse(fs.readFileSync(path.join(root, "new-api-details", "yearly", "google-summer-of-code-2026.json"), "utf-8"));
  const raw = JSON.parse(fs.readFileSync(path.join(root, "new-api-details", "yearly", "google-summer-of-code-2026-organizations-raw.json"), "utf-8"));

  it("records exactly the two known withdrawals", () => {
    const withdrawn = ledger.events
      .filter((event: { year: number; event: string }) => event.year === 2026 && event.event === "withdrawn")
      .map((event: { slug: string }) => event.slug)
      .sort();
    expect(withdrawn).toEqual(["aflplusplus", "measurement-lab"]);
  });

  it("keeps announced, participating, and withdrawn counts internally consistent", () => {
    expect(yearly.counts).toEqual({ announced: 185, participating: 183, withdrawn: 2 });
    expect(yearly.counts.announced).toBe(yearly.counts.participating + yearly.counts.withdrawn);
    expect(yearly.metrics.total_organizations).toBe(yearly.counts.participating);
    expect(yearly.organizations).toHaveLength(yearly.counts.announced);
  });

  it("marks only the missing organizations withdrawn and sorts them last", () => {
    const withdrawn = yearly.organizations.filter((organization: { status: string }) => organization.status === "withdrawn");
    expect(withdrawn.map((organization: { slug: string }) => organization.slug).sort()).toEqual(["aflplusplus", "measurement-lab"]);
    expect(yearly.organizations.slice(-2).every((organization: { status: string }) => organization.status === "withdrawn")).toBe(true);
    const liveSlugs = new Set(raw.map((organization: { slug: string }) => organization.slug));
    expect(withdrawn.every((organization: { slug: string }) => !liveSlugs.has(organization.slug))).toBe(true);
  });

  it.each(["aflplusplus", "measurement-lab"])("stores per-year status for %s", (slug) => {
    const organization = JSON.parse(fs.readFileSync(path.join(root, "new-api-details", "organizations", `${slug}.json`), "utf-8"));
    expect(organization.withdrawn_years).toEqual([2026]);
    expect(organization.years.year_2026).toMatchObject({
      status: "withdrawn",
      withdrawn_at: "2026-08-16T15:13:59.937Z",
    });
  });

  it("defines a checked database status and timestamp contract", () => {
    const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "202608170004_organization_year_selection_status.sql"), "utf-8");
    expect(migration).toContain("selection_status text not null default 'selected'");
    expect(migration).toContain("selection_status = 'withdrawn' and withdrawn_at is not null");
  });
});
