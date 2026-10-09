import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { confirmSchema, finalizeSchema, reasonSchema, zodFields } from "@/lib/hub/schemas";
import { TERMS_VERSION } from "@/lib/hub/types";
import { readJsonBody } from "@/lib/security";

type Context = { params: Promise<{ id: string; action: string }> };

/**
 * confirm  – the author checked this exact file for personal details
 * finalize – publish under CC BY 4.0; afterwards only the admin can change it
 * removal  – after finalizing, ask the admin to take it down
 */
export async function POST(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id, action } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const body = await readJsonBody(request).catch(() => null);
  const userId = gate.viewer.user.id;
  try {
    if (action === "confirm") {
      const parsed = confirmSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Reload and check the file again", 422, zodFields(parsed.error));
      await db()`select public.confirm_proposal_redaction(${userId}::uuid, false, ${id}::uuid, ${parsed.data.sha256})`;
      return privateApiData({ confirmed: true });
    }
    if (action === "finalize") {
      const parsed = finalizeSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Accept the terms to publish", 422, zodFields(parsed.error));
      await db()`select public.finalize_my_proposal(${userId}::uuid, ${id}::uuid, ${TERMS_VERSION})`;
      await revalidateContributorWork({ proposalId: id });
      return privateApiData({ published: true });
    }
    if (action === "removal") {
      const parsed = reasonSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Tell us why", 422, zodFields(parsed.error));
      await db()`select public.request_proposal_removal(${userId}::uuid, ${id}::uuid, ${parsed.data.reason})`;
      return privateApiData({ requested: true });
    }
    return apiError("NOT_FOUND", "Unknown action", 404);
  } catch (error) {
    return databaseErrorResponse(error, `api/v2/me/proposals/[id]/${action}`);
  }
}
