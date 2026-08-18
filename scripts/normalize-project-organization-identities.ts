import fs from "node:fs";
import path from "node:path";
import { SLUG_ALIASES } from "./lib/org-slug-aliases";

type OrganizationIndexEntry = { slug: string; name: string };
type ProjectEntry = { org_slug?: string; org_name?: string };
type ProjectDocument = { projects?: ProjectEntry[] };

const root = process.cwd();
const dataRoot = path.join(root, "new-api-details");
const organizationsDirectory = path.join(dataRoot, "organizations");
const write = process.argv.includes("--write");

const index = JSON.parse(
  fs.readFileSync(path.join(organizationsDirectory, "index.json"), "utf8"),
) as { organizations: OrganizationIndexEntry[] };

const canonicalBySlug = new Map(
  index.organizations.map((organization) => [organization.slug, organization]),
);
const canonicalByArchiveSlug = new Map<string, OrganizationIndexEntry>();

for (const organization of index.organizations) {
  const detail = JSON.parse(
    fs.readFileSync(path.join(organizationsDirectory, `${organization.slug}.json`), "utf8"),
  ) as { years?: Record<string, { projects_url?: string } | null> };

  for (const year of Object.values(detail.years ?? {})) {
    const archiveSlug = year?.projects_url?.match(/\/organizations\/([^/]+)\/?$/)?.[1];
    if (archiveSlug) canonicalByArchiveSlug.set(archiveSlug, organization);
  }
}

for (const [alias, canonicalSlug] of Object.entries(SLUG_ALIASES)) {
  const organization = canonicalBySlug.get(canonicalSlug);
  if (!organization) throw new Error(`Unknown canonical organization slug: ${canonicalSlug}`);
  canonicalByArchiveSlug.set(alias, organization);
}

const documents = [
  ...fs.readdirSync(path.join(dataRoot, "projects"))
    .filter((file) => /^\d{4}\.json$/.test(file))
    .map((file) => path.join(dataRoot, "projects", file)),
  ...fs.readdirSync(path.join(dataRoot, "yearly"))
    .filter((file) => /^google-summer-of-code-\d{4}\.json$/.test(file))
    .map((file) => path.join(dataRoot, "yearly", file)),
];

let changedProjects = 0;
const unresolved = new Set<string>();

for (const documentPath of documents) {
  const document = JSON.parse(fs.readFileSync(documentPath, "utf8")) as ProjectDocument;
  const includesOrganizationNames = path.dirname(documentPath) === path.join(dataRoot, "projects");
  let changed = false;

  for (const project of document.projects ?? []) {
    const sourceSlug = project.org_slug ?? "";
    const organization = canonicalBySlug.get(sourceSlug) ?? canonicalByArchiveSlug.get(sourceSlug);
    if (!organization) {
      unresolved.add(sourceSlug || "<empty>");
      continue;
    }

    if (project.org_slug !== organization.slug || (includesOrganizationNames && project.org_name !== organization.name)) {
      project.org_slug = organization.slug;
      if (includesOrganizationNames) project.org_name = organization.name;
      changed = true;
      changedProjects += 1;
    }
    if (!includesOrganizationNames && "org_name" in project) {
      delete project.org_name;
      changed = true;
    }
  }

  if (changed && write) {
    fs.writeFileSync(documentPath, JSON.stringify(document, null, 2));
  }
}

if (unresolved.size) {
  throw new Error(`Unresolved project organization identities: ${[...unresolved].join(", ")}`);
}

console.log(`${write ? "Normalized" : "Would normalize"} ${changedProjects} project records across ${documents.length} documents.`);
