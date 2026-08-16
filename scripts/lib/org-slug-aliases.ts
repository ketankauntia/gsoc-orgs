/**
 * Google's organization slugs are not stable across years.
 *
 * Two distinct problems show up:
 *   1. Random suffixes -- the same org appears as `jenkins-wp`,
 *      `django-software-foundation-8o`, `wikimedia-foundation-nd`. These are
 *      resolved automatically by matching on normalized name.
 *   2. Rebrands / renames -- the name changes too, so name matching cannot help
 *      and an explicit mapping is required. That is what this file is for.
 *
 * Maps a Google API slug -> the canonical slug already used in our dataset.
 * Shared by transform-year-organizations.ts and verify-year-import.ts so the
 * two can never disagree about which org is which.
 */
export const SLUG_ALIASES: Record<string, string> = {
  ceph: "ceph-foundation",
  "openms-inc": "openms",
};

/** Normalized-name key used for suffix-tolerant matching. */
export const normalizeOrgName = (name: string): string => name.toLowerCase().trim();
