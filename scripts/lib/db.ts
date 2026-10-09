import { neon } from "@neondatabase/serverless";

/** Neon client for operational scripts (reads .env.local through ../load-env). */
export function scriptDb() {
  const url = process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("Set NEON_DATABASE_URL_UNPOOLED (or NEON_DATABASE_URL) in .env.local");
  return neon(url);
}
