import { describe, expect, it } from "vitest";
import { organizationV1, projectV1 } from "../lib/supabase/legacy-shapes";

describe("v1 compatibility transformers", () => {
  it("preserves legacy organization fields while applying normalized values", () => {
    const result = organizationV1({ source_payload: { technologies: ["Rust"], years: { year_2025: { num_projects: 2 } } }, id: "uuid", legacy_id: "mongo", canonical_id: "org-1", slug: "example", name: "Example", category: "Science", description: "Description", website: "https://example.com", active_years: [2025] });
    expect(result).toMatchObject({ id: "mongo", id_: "org-1", slug: "example", technologies: ["Rust"] });
  });

  it("sorts mentors and emits the archived contributor", () => {
    const result = projectV1({ source_payload: {}, id: "uuid", external_id: "p-1", title: "Project", year: 2025, project_contributors: [{ archived_name: "Ada" }], project_mentors: [{ name: "Second", ordinal: 2 }, { name: "First", ordinal: 1 }], organizations: { name: "Org", slug: "org" } });
    expect(result).toMatchObject({ project_id: "p-1", contributor: "Ada", mentors: ["First", "Second"], org_slug: "org" });
  });
});
