import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { apiViewer } from "@/lib/api-auth";
import { getOwnedProposal } from "@/lib/hub/queries";
import { createPdfDownloadUrl } from "@/lib/r2";

/** The owner's private preview of their current file, published or not. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiViewer();
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const proposal = await getOwnedProposal(gate.viewer.user.id, id);
  if (!proposal?.file_key) return apiError("NOT_FOUND", "No file uploaded yet", 404);
  const url = await createPdfDownloadUrl(proposal.file_key, `${proposal.slug}.pdf`);
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
