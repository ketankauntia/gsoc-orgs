import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { adminPostSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Adds a progress post on a contributor's behalf (link only; the post stays on their site). */
export async function POST(request: Request) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const parsed = adminPostSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the post details", 422, zodFields(parsed.error));
  const { personId, url, title, kind, publishedOn } = parsed.data;
  try {
    const rows = await db()`select public.admin_add_post(${gate.viewer.user.id}::uuid, ${personId}::uuid, ${url}, ${title ?? null}, ${kind}, ${publishedOn}::date) as id`;
    await revalidateContributorWork({ personId });
    return privateApiData({ id: rows[0].id as string }, undefined, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/posts");
  }
}
