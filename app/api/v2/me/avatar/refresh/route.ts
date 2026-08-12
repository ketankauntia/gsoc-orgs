import { apiError, privateApiData } from "@/lib/api-response";
import { consumeRateLimit, getUser } from "@/lib/auth";
import { deleteR2Object, importGoogleAvatar } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutationRequest } from "@/lib/security";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const googleIdentity = user.identities?.find((identity) => identity.provider === "google");
  const source = googleIdentity?.identity_data?.avatar_url ?? googleIdentity?.identity_data?.picture;
  if (typeof source !== "string") return apiError("AVATAR_UNAVAILABLE", "Google did not provide a profile image", 422);
  const admin = createAdminClient();
  try {
    if (!(await consumeRateLimit("refresh_avatar"))) return apiError("RATE_LIMITED", "Try refreshing your avatar again later", 429);
    const { data: profile } = await admin.from("profiles").select("avatar_r2_key,status").eq("user_id", user.id).single();
    if (!profile || profile.status !== "active") return apiError("ACCOUNT_INACTIVE", "This account cannot be changed", 403);
    const key = await importGoogleAvatar(user.id, source);
    const { error } = await admin.from("profiles").update({ avatar_r2_key: key, google_avatar_url: source }).eq("user_id", user.id).eq("status", "active");
    if (error) {
      await deleteR2Object(key).catch(() => undefined);
      throw error;
    }
    if (profile?.avatar_r2_key && profile.avatar_r2_key !== key) await deleteR2Object(profile.avatar_r2_key).catch(() => undefined);
    return privateApiData({ refreshed: true });
  } catch (error) {
    console.error("[api/v2/me/avatar/refresh]", error);
    return apiError("AVATAR_IMPORT_FAILED", "Your Google profile image could not be imported", 500);
  }
}
