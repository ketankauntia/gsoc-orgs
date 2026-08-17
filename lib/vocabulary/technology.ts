/**
 * Display grouping used by proposal search. Canonical taxonomy decisions live
 * in catalog.ts so this chooser cannot drift from generated pages or imports.
 */
import { canonicalTechnology } from "./catalog";

export function canonicalTechnologyName(rawName: string): string {
  return canonicalTechnology(rawName).name;
}

export function technologyGroupKey(rawName: string): string {
  return canonicalTechnology(rawName).slug;
}

export type TechnologyGroup = {
  name: string;
  key: string;
  slugs: string[];
  aliases: string[];
  orgCount: number;
};

export function groupTechnologies(
  rows: Array<{ slug: string; name: string; orgCount?: number }>,
): TechnologyGroup[] {
  const groups = new Map<string, TechnologyGroup>();
  for (const row of rows) {
    const canonical = canonicalTechnology(row.name);
    const existing = groups.get(canonical.slug);
    if (existing) {
      if (!existing.slugs.includes(row.slug)) existing.slugs.push(row.slug);
      if (!existing.aliases.includes(row.name)) existing.aliases.push(row.name);
      existing.orgCount += row.orgCount ?? 0;
      continue;
    }
    groups.set(canonical.slug, {
      name: canonical.name,
      key: canonical.slug,
      slugs: [row.slug],
      aliases: [row.name],
      orgCount: row.orgCount ?? 0,
    });
  }
  return [...groups.values()].sort((a, b) => b.orgCount - a.orgCount || a.name.localeCompare(b.name));
}
