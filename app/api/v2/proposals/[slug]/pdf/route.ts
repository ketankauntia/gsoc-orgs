import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getPublicProposalFile } from "@/lib/proposals/queries";
import { createPdfDownloadUrl } from "@/lib/r2";

// The segment is the proposal id. Visibility is checked on every request, so a
// removed, withdrawn or suspended proposal stops resolving at once; ?v=<version>
// on the link keeps caches from serving an older file.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
    const file = await getPublicProposalFile(id);
    if (!file?.file_key) return apiError("NOT_FOUND", "Proposal not found", 404);
    const signedUrl = await createPdfDownloadUrl(file.file_key, `${file.slug}.pdf`);
    return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("[api/v2/proposals/:id/pdf]", error);
    return apiError("PDF_UNAVAILABLE", "The proposal PDF is temporarily unavailable", 503);
  }
}
