import { apiError, privateApiData } from "@/lib/api-response";
import { authorizeAdminApi, authorizeAdminMutationApi } from "@/lib/admin-api";
import { contributorBlogSchema, zodFields } from "@/lib/proposals/schemas";
import { readJsonBody } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await authorizeAdminApi();
  if ("response" in auth) return auth.response;
  const { data, error } = await createAdminClient()
    .from("contributor_blogs")
    .select("id,title,url,is_published,created_at,project_contributors!inner(archived_name,projects!inner(title,year,organizations!inner(name)))")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) return apiError("BLOGS_UNAVAILABLE", "Contributor blogs could not be loaded", 503);
  return privateApiData(data ?? []);
}

export async function POST(request: Request) {
  const auth = await authorizeAdminMutationApi(request);
  if ("response" in auth) return auth.response;
  const parsed = contributorBlogSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Contributor blog details are invalid", 422, zodFields(parsed.error));
  const { data, error } = await createAdminClient().rpc("create_contributor_blog", {
    target_admin_id: auth.user.id,
    contributor_slot_id: parsed.data.contributorSlotId,
    blog_title: parsed.data.title ?? "",
    blog_url: parsed.data.url,
  });
  if (error) {
    console.error("[contributor blog:create]", error);
    return apiError("BLOG_CREATE_FAILED", "The contributor blog could not be published", 409);
  }
  return privateApiData({ id: data }, undefined, { status: 201 });
}
