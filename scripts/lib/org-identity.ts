import { SLUG_ALIASES, normalizeOrgName } from "./org-slug-aliases";

export type OrganizationIdentity = { slug: string; name: string };

/** Resolve Google's unstable slugs against the canonical organization index. */
export function createOrganizationIdentityResolver(index: OrganizationIdentity[]) {
  const knownSlugs = new Set(index.map((organization) => organization.slug));
  const byName = new Map<string, string[]>();
  for (const organization of index) {
    const key = normalizeOrgName(organization.name);
    byName.set(key, [...(byName.get(key) ?? []), organization.slug]);
  }

  return (organization: OrganizationIdentity): string => {
    const alias = SLUG_ALIASES[organization.slug];
    if (alias) return alias;
    if (knownSlugs.has(organization.slug)) return organization.slug;

    const nameMatches = byName.get(normalizeOrgName(organization.name)) ?? [];
    if (nameMatches.length === 1) return nameMatches[0];
    if (nameMatches.length > 1) {
      throw new Error(`Organization name "${organization.name}" is ambiguous; add an explicit slug alias`);
    }
    return organization.slug;
  };
}

export function canonicalizeOrganizationSnapshot(
  organizations: OrganizationIdentity[],
  resolve: (organization: OrganizationIdentity) => string,
) {
  const canonical = new Map<string, OrganizationIdentity>();
  for (const organization of organizations) {
    const slug = resolve(organization);
    const existing = canonical.get(slug);
    if (existing) {
      throw new Error(`Multiple Google organizations resolve to canonical slug "${slug}"`);
    }
    canonical.set(slug, organization);
  }
  return canonical;
}
