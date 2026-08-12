import { apiError, privateApiData } from "@/lib/api-response";
import { getUser, getUserRoles } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const roles = await getUserRoles(user.id);
  if (!roles.some((role) => role === "moderator" || role === "admin")) return apiError("FORBIDDEN", "Moderator access is required", 403);
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("proposals")
    .select("id,claim_id,user_id,public_slug,status,current_file_id,license_code,license_version,license_accepted_at,submitted_at,reviewed_at,reviewed_by,moderator_reason,created_at,updated_at,profiles!inner(display_name,bio,google_avatar_url,avatar_r2_key,avatar_public,bio_public,status),contributor_claims!inner(id,user_id,project_contributor_id,year,status,claimant_note,evidence_urls,verified_by,verified_at,rejection_reason,created_at,updated_at,project_contributors!inner(id,archived_name,archived_profile_url,ordinal,projects!inner(id,external_id,title,year,abstract_short,project_url,code_url,organizations!inner(id,slug,name,website)))),proposal_files(id,version,original_filename,mime_type,byte_size,sha256,etag,validation_status,validation_error,created_at)")
    .eq("id", id).maybeSingle();
  if (error) return apiError("MODERATION_UNAVAILABLE", "Proposal could not be loaded", 503);
  if (!data) return apiError("NOT_FOUND", "Proposal not found", 404);
  const supabase = await createClient();
  const { data: events } = await supabase.rpc("get_moderation_events", { target_entity_id: id });
  const claimId = (data.contributor_claims as { id?: string } | null)?.id;
  const { data: claimEvents } = claimId ? await supabase.rpc("get_moderation_events", { target_entity_id: claimId }) : { data: [] };
  const proposalEvents = Array.isArray(events) ? events : [];
  const relatedClaimEvents = Array.isArray(claimEvents) ? claimEvents : [];
  return privateApiData({ ...data, moderationEvents: [...proposalEvents, ...relatedClaimEvents].sort((a, b) => String((b as Record<string, unknown>).created_at).localeCompare(String((a as Record<string, unknown>).created_at))) });
}
