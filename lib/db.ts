import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Server-only Postgres access over Neon's HTTP driver. It works in Node and in
// Cloudflare Workers, and every call is a single atomic statement, which is
// why multi-step rules live in SQL functions (db/migrations).

let client: NeonQueryFunction<false, false> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.NEON_DATABASE_URL);
}

export function db() {
  if (!client) {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) throw new Error("NEON_DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

function databaseErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : undefined;
}

/** Messages raised with `raise exception` in our SQL functions are written for users. Nothing else is. */
export function userFacingDatabaseError(error: unknown): string | null {
  if (databaseErrorCode(error) !== "P0001") return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}

/** A unique violation: another request wrote the same row first. */
export function isDatabaseConflict(error: unknown) {
  return databaseErrorCode(error) === "23505";
}
