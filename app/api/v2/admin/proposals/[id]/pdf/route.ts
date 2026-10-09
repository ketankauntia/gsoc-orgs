import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { apiAdmin } from "@/lib/api-auth";
import { getProposalForAdmin } from "@/lib/hub/queries";
import { createPdfDownloadUrl } from "@/lib/r2";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiAdmin();
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const proposal = await getProposalForAdmin(id);
  if (!proposal?.file_key) return apiError("NOT_FOUND", "No file", 404);
  const url = await createPdfDownloadUrl(proposal.file_key, `${proposal.slug}.pdf`);
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
