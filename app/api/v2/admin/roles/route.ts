import { apiError, privateApiData } from "@/lib/api-response";
import { getUser, getUserRoles } from "@/lib/auth";
import { roleChangeSchema, zodFields } from "@/lib/proposals/schemas";
import { createClient } from "@/lib/supabase/server";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

async function requireApiAdmin() {
  const user = await getUser();
  if (!user) return { error: apiError("UNAUTHENTICATED", "Sign in is required", 401) };
  if (!(await getUserRoles(user.id)).includes("admin")) return { error: apiError("FORBIDDEN", "Admin access is required", 403) };
  return { user };
}

export async function GET() {
  const access = await requireApiAdmin();
  if (access.error) return access.error;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) return apiError("ROLES_UNAVAILABLE", "Users and roles could not be loaded", 503);
  return privateApiData(data ?? []);
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const access = await requireApiAdmin();
  if (access.error) return access.error;
  const parsed = roleChangeSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Role change is invalid", 422, zodFields(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { target_user_id: parsed.data.userId, target_role: parsed.data.role, enabled: parsed.data.enabled });
  if (error) return apiError("ROLE_CHANGE_REJECTED", "The requested role change is not allowed", 409);
  return privateApiData({ updated: true });
}
