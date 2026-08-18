import { apiError, privateApiData } from "@/lib/api-response";
import { authorizeAdminApi, authorizeAdminMutationApi } from "@/lib/admin-api";
import { adminProposalImportSchema, zodFields } from "@/lib/proposals/schemas";
import { readJsonBody } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await authorizeAdminApi();
  if ("response" in auth) return auth.response;
  const { data, error } = await createAdminClient()
    .from("admin_proposal_imports")
    .select("id,public_slug,display_name,rights_basis,status,published_at,created_at,project_contributors!inner(archived_name,projects!inner(title,year,organizations!inner(name)))")
    .order("created_at", { ascending: false });
  if (error) return apiError("IMPORTS_UNAVAILABLE", "Proposal imports could not be loaded", 503);
  return privateApiData(data ?? []);
}

export async function POST(request: Request) {
  const auth = await authorizeAdminMutationApi(request);
  if ("response" in auth) return auth.response;
  const parsed = adminProposalImportSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Proposal import details are invalid", 422, zodFields(parsed.error));
  const { data, error } = await createAdminClient().rpc("create_admin_proposal_import", {
    target_admin_id: auth.user.id,
    contributor_slot_id: parsed.data.contributorSlotId,
    contributor_display_name: parsed.data.displayName,
    permission_basis: parsed.data.rightsBasis,
    private_permission_note: parsed.data.permissionNote,
    private_source_url: parsed.data.sourceUrl ?? undefined,
  });
  if (error) {
    console.error("[admin proposal import:create]", error);
    return apiError("IMPORT_CREATE_FAILED", "The proposal import could not be created", 409);
  }
  return privateApiData({ id: data }, undefined, { status: 201 });
}
