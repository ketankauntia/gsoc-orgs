/**
 * Centralized slug alias map for known org rebrands / renames.
 *
 * Maps the current GSoC API slug to the canonical slug used
 * in our local dataset (new-api-details/organizations/).
 * Shared by both transform-year-organizations.ts and process-org-images.ts.
 */
export const SLUG_ALIASES: Record<string, string> = {
    "ceph": "ceph-foundation",
    "openms-inc": "openms",
};
