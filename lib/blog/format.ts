/**
 * Shared date formatting so cards, bylines, and metadata stay consistent.
 * Accepts both `YYYY-MM-DD` and a full ISO timestamp with offset — the latter is
 * rendered in the publishing timezone so the displayed day matches the frontmatter.
 */
export function formatDate(iso: string): string {
  const hasTime = iso.length > 10;
  return new Date(hasTime ? iso : iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: hasTime ? PUBLISHING_TIMEZONE : "UTC",
  });
}

/** Timezone the editorial calendar publishes in. */
export const PUBLISHING_TIMEZONE = "Asia/Kolkata";

/** Calendar day of an ISO date or timestamp — safe for string comparison. */
export function isoDay(iso: string): string {
  return iso.slice(0, 10);
}
