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

/** Messages raised with `raise exception` in our SQL functions are written for users. */
export function userFacingDatabaseError(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P0001") {
    return (error as { message?: string }).message ?? null;
  }
  return null;
}
