import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { contributorWorkPaths, revalidateContributorWork } from "@/lib/hub/revalidate";
import { profileSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

export async function PATCH(request: Request) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const parsed = profileSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check your profile details", 422, zodFields(parsed.error));
  const value = parsed.data;
  try {
    // Includes the current handle, whose page changes or disappears when the handle does.
    const before = await contributorWorkPaths({ userId: gate.viewer.user.id });
    await db()`select public.update_my_profile(
      ${gate.viewer.user.id}::uuid, ${value.displayName}, ${value.handle}, ${value.bio ?? null},
      ${value.websiteUrl}, ${value.githubUsername}, ${value.xUsername}, ${value.mediumUrl}, ${value.isPublic}
    )`;
    await revalidateContributorWork({ userId: gate.viewer.user.id }, before);
    return privateApiData({ saved: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/profile");
  }
}
