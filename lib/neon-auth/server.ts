import "server-only";
import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

// One Neon Auth (managed Better Auth) instance per server process. Created on
// first use so builds and pages without auth configured still work.

let instance: NeonAuth | null = null;

export function isAuthConfigured() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && (process.env.NEON_AUTH_COOKIE_SECRET?.length ?? 0) >= 32);
}

export function neonAuth(): NeonAuth {
  if (!instance) {
    if (!isAuthConfigured()) throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET (32+ characters) are required");
    instance = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
      logLevel: process.env.NODE_ENV === "production" ? "error" : "warn",
    });
  }
  return instance;
}
