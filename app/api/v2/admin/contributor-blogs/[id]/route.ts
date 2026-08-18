import { apiError, privateApiData } from "@/lib/api-response";
import { authorizeAdminMutationApi } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminMutationApi(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const { error } = await createAdminClient().rpc("unpublish_contributor_blog", { target_admin_id: auth.user.id, target_blog_id: id });
  if (error) return apiError("BLOG_UNPUBLISH_FAILED", "The contributor blog could not be unpublished", 409);
  return privateApiData({ id, published: false });
}
