import { apiError, pagination, privateApiData } from "@/lib/api-response";
import { getUser, getUserRoles } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const roles = await getUserRoles(user.id);
  if (!roles.some((role) => role === "moderator" || role === "admin")) return apiError("FORBIDDEN", "Moderator access is required", 403);
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = pagination(url.searchParams);
    const status = url.searchParams.get("status");
    let query = createAdminClient()
      .from("proposals")
      .select("id,user_id,public_slug,status,moderator_reason,submitted_at,reviewed_at,created_at,current_file_id,profiles!inner(display_name),contributor_claims!inner(id,status,year,claimant_note,evidence_urls,project_contributors!inner(id,archived_name,archived_profile_url,projects!inner(external_id,title,project_url,code_url,organizations!inner(slug,name)))),proposal_files(id,version,original_filename,byte_size,sha256,validation_status,created_at)", { count: "exact" })
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    const validStatuses = ["draft", "pending", "changes_requested", "approved", "rejected", "withdrawn"] as const;
    if (status && validStatuses.some((value) => value === status)) query = query.eq("status", status as typeof validStatuses[number]);
    const { data, error, count } = await query;
    if (error) throw error;
    return privateApiData(data ?? [], { page, limit, total: count ?? 0 });
  } catch (error) {
    console.error("[api/v2/admin/proposals]", error);
    return apiError("MODERATION_UNAVAILABLE", "The moderation queue is temporarily unavailable", 503);
  }
}
