export function isTaxonomyIndexEligible(organizationCount: number, projectCount: number): boolean {
  return organizationCount >= 3 || projectCount >= 10;
}
