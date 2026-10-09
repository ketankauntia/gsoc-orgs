import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Profile } from "@/lib/hub/types";
import { hasAuthCookie, isAuthConfigured, neonAuth } from "@/lib/neon-auth/server";
import { importGoogleAvatar } from "@/lib/r2";

export type SessionUser = { id: string; email: string; emailVerified: boolean; name: string; image: string | null };
export type Viewer = { user: SessionUser; profile: Profile; isAdmin: boolean };

/** Admins are listed by Neon Auth user id in ADMIN_USER_IDS (comma or space separated). */
export function isAdminUserId(userId: string) {
  const ids = (process.env.ADMIN_USER_IDS ?? "").split(/[\s,]+/).map((id) => id.trim().toLowerCase()).filter(Boolean);
  return ids.includes(userId.toLowerCase());
}

/**
 * The signed-in user, or null. Sessions whose email is not verified count as
 * signed out, and so does a session lookup that fails.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isAuthConfigured()) return null;
  if (!hasAuthCookie((await headers()).get("cookie"))) return null;
  try {
    const { data, error } = await neonAuth().getSession();
    if (error) console.error("[auth:session]", JSON.stringify({ status: error.status ?? null, code: error.code ?? null }));
    const user = data?.user;
    if (!user?.id || !user.emailVerified) return null;
    return { id: user.id, email: user.email, emailVerified: true, name: user.name ?? "", image: user.image ?? null };
  } catch (error) {
    console.error("[auth:session]", error);
    return null;
  }
});

/**
 * The signed-in user with their profile, created on first sign-in. A failed
 * profile lookup throws a generic error (the error page) rather than passing
 * for signed out or for another account.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user || !isDatabaseConfigured()) return null;
  let profile: Profile | undefined;
  try {
    // The verified email lets an account from before the Neon move reclaim its migrated profile.
    const rows = await db()`select to_jsonb(p) as profile from public.ensure_profile(${user.id}::uuid, ${user.name}, ${user.email}) p`;
    profile = rows[0]?.profile as Profile | undefined;
  } catch (error) {
    console.error("[auth:viewer]", error);
    throw new Error("Your account could not be loaded");
  }
  if (!profile?.user_id || profile.user_id.toLowerCase() !== user.id.toLowerCase()) {
    console.error("[auth:viewer] profile does not match the session user");
    throw new Error("Your account could not be loaded");
  }
  if (!profile.avatar_key && user.image) {
    const image = user.image;
    after(() => importAvatar(user.id, image));
  }
  return { user, profile, isAdmin: isAdminUserId(user.id) };
});

async function importAvatar(userId: string, image: string) {
  try {
    const key = await importGoogleAvatar(userId, image);
    await db()`select public.set_my_avatar(${userId}::uuid, ${key})`;
  } catch (error) {
    console.warn("[auth:avatar]", error instanceof Error ? error.message : error);
  }
}

export async function requireViewer(next = "/account") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.profile.status !== "active") redirect("/login?error=suspended");
  return viewer;
}

export async function requireAdmin(next = "/admin") {
  const viewer = await requireViewer(next);
  if (!viewer.isAdmin) redirect("/account");
  return viewer;
}
