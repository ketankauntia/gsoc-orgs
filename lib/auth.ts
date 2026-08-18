import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "moderator" | "admin";

export async function getUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const user = await getUser();
  if (!user || user.id !== userId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_roles");
  if (error) throw error;
  return (data ?? []) as AppRole[];
}

export async function consumeRateLimit(action: "upload_url" | "upload_complete" | "submit_proposal" | "refresh_avatar" | "moderate_proposal") {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", { requested_action: action });
  if (error) throw error;
  return data === true;
}

export async function requireModerator() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  if (!roles.some((role) => role === "moderator" || role === "admin")) redirect("/account");
  return { user, roles };
}

export async function requireAdmin() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  if (!roles.includes("admin")) redirect("/account");
  return { user, roles };
}
