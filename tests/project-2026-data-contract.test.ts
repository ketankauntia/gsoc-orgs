import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const projectPayload = JSON.parse(
  fs.readFileSync(path.join(root, "new-api-details", "projects", "2026.json"), "utf8"),
);
const yearlyPayload = JSON.parse(
  fs.readFileSync(path.join(root, "new-api-details", "yearly", "google-summer-of-code-2026.json"), "utf8"),
);

describe("GSoC 2026 project data", () => {
  it("publishes every recovered project and contributor", () => {
    expect(projectPayload.projects).toHaveLength(1140);
    expect(new Set(projectPayload.projects.map((project: { project_id: string }) => project.project_id)).size).toBe(1140);
    expect(new Set(projectPayload.projects.map((project: { contributor: string }) => project.contributor)).size).toBe(1140);
    expect(projectPayload.projects.every((project: { project_title?: string }) => Boolean(project.project_title))).toBe(true);
    expect(projectPayload.projects.every((project: { project_abstract_short?: string }) => Boolean(project.project_abstract_short))).toBe(true);
    expect(projectPayload.projects.every((project: { project_description?: string }) => Boolean(project.project_description))).toBe(true);
    expect(projectPayload.projects.every((project: { project_url?: string }) => project.project_url?.startsWith("https://summerofcode.withgoogle.com/programs/2026/projects/"))).toBe(true);
  });

  it("keeps yearly and per-organization counts consistent", () => {
    expect(yearlyPayload.projects).toHaveLength(1140);
    expect(yearlyPayload.metrics.total_projects).toBe(1140);
    expect(yearlyPayload.metrics.total_participants).toBe(1140);
    expect(yearlyPayload.organizations.reduce((sum: number, organization: { project_count: number }) => sum + organization.project_count, 0)).toBe(1140);
  });

  it("marks unavailable mentor fields instead of reporting a false zero", () => {
    expect(projectPayload.data_completeness.mentors).toBe(false);
    expect(yearlyPayload.data_completeness.mentors).toBe(false);
    expect(yearlyPayload.metrics.total_mentors).toBeNull();
    expect(yearlyPayload.metrics.avg_mentors_per_org).toBeNull();
    expect(yearlyPayload.mentors.total).toBeNull();
  });
});
