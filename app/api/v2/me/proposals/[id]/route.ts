import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { contributorWorkPaths, revalidatePaths } from "@/lib/hub/revalidate";
import { deleteR2Object } from "@/lib/r2";

type Context = { params: Promise<{ id: string }> };

/** Deletes an unlocked proposal and its file. */
export async function DELETE(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  try {
    const paths = await contributorWorkPaths({ proposalId: id });
    const rows = await db()`select public.delete_my_proposal(${gate.viewer.user.id}::uuid, ${id}::uuid) as key`;
    const key = rows[0]?.key as string | null;
    if (key) await deleteR2Object(key).catch((error) => console.error("[me/proposals:delete-object]", error));
    revalidatePaths(paths);
    return privateApiData({ deleted: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/proposals/[id]:delete");
  }
}
