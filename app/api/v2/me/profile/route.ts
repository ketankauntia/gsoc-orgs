import { apiError, privateApiData } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { profileUpdateSchema, zodFields } from "@/lib/proposals/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

export async function GET() {
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  try {
    const admin = createAdminClient();
    const [{ data: profile, error }, { data: links, error: linkError }] = await Promise.all([
      admin.from("profiles").select("display_name,bio,google_avatar_url,avatar_r2_key,avatar_public,bio_public,status,created_at,updated_at").eq("user_id", user.id).single(),
      admin.from("profile_links").select("id,platform,label,url,is_public,position").eq("user_id", user.id).order("position"),
    ]);
    if (error || linkError) throw error ?? linkError;
    return privateApiData({ ...profile, links: links ?? [], email: user.email });
  } catch (error) {
    console.error("[api/v2/me/profile:get]", error);
    return apiError("PROFILE_UNAVAILABLE", "Your profile is temporarily unavailable", 503);
  }
}

export async function PATCH(request: Request) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const body = await readJsonBody(request).catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check your profile fields", 422, zodFields(parsed.error));
  const input = parsed.data;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("update_my_profile", {
      new_display_name: input.displayName,
      new_bio: input.bio || null,
      new_avatar_public: input.avatarPublic,
      new_bio_public: input.bioPublic,
      new_links: input.links.map((link) => ({
        platform: link.platform,
        label: link.label || null,
        url: link.url,
        is_public: link.isPublic,
        position: link.position,
      })),
    });
    if (error) throw error;
    return privateApiData({ updated: true });
  } catch (error) {
    console.error("[api/v2/me/profile:patch]", error);
    return apiError("PROFILE_UPDATE_FAILED", "Your profile could not be saved", 500);
  }
}
