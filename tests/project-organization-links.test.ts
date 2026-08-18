import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("project organization links", () => {
  it("uses canonical organization slugs in every generated project document", () => {
    const dataRoot = path.join(process.cwd(), "new-api-details");
    const index = JSON.parse(
      fs.readFileSync(path.join(dataRoot, "organizations", "index.json"), "utf8"),
    ) as { organizations: Array<{ slug: string; name: string }> };
    const canonical = new Map(index.organizations.map((organization) => [organization.slug, organization.name]));
    const files = [
      ...fs.readdirSync(path.join(dataRoot, "projects"))
        .filter((file) => /^\d{4}\.json$/.test(file))
        .map((file) => path.join(dataRoot, "projects", file)),
      ...fs.readdirSync(path.join(dataRoot, "yearly"))
        .filter((file) => /^google-summer-of-code-\d{4}\.json$/.test(file))
        .map((file) => path.join(dataRoot, "yearly", file)),
    ];

    const invalid: string[] = [];
    for (const file of files) {
      const document = JSON.parse(fs.readFileSync(file, "utf8")) as {
        projects?: Array<{ project_id: string; org_slug: string; org_name?: string }>;
      };
      for (const project of document.projects ?? []) {
        const expectedName = canonical.get(project.org_slug);
        if (!expectedName || (project.org_name && project.org_name !== expectedName)) {
          invalid.push(`${path.basename(file)}:${project.project_id}:${project.org_slug}`);
        }
      }
    }

    expect(invalid).toEqual([]);
  });
});
