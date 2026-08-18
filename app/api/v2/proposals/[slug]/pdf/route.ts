import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createPdfDownloadUrl } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: id } = await params;
    const admin = createAdminClient();
    const { data: proposal, error } = await admin.from("proposals").select("id,status,current_file_id,public_slug").eq("id", id).eq("status", "approved").maybeSingle();
    if (error) throw error;
    let file: { r2_key: string; original_filename: string; validation_status: string } | null = null;
    if (proposal?.current_file_id) {
      const result = await admin.from("proposal_files").select("r2_key,original_filename,validation_status").eq("id", proposal.current_file_id).eq("validation_status", "valid").maybeSingle();
      if (result.error) throw result.error;
      file = result.data;
    } else {
      const { data: imported, error: importedError } = await admin.from("admin_proposal_imports").select("current_file_id").eq("id", id).eq("status", "published").maybeSingle();
      if (importedError) throw importedError;
      if (imported?.current_file_id) {
        const result = await admin.from("admin_proposal_files").select("r2_key,original_filename,validation_status").eq("id", imported.current_file_id).eq("validation_status", "valid").maybeSingle();
        if (result.error) throw result.error;
        file = result.data;
      }
    }
    if (!file) return apiError("NOT_FOUND", "Approved PDF not found", 404);
    const signedUrl = await createPdfDownloadUrl(file.r2_key, file.original_filename);
    return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("[api/v2/proposals/:id/pdf]", error);
    return apiError("PDF_UNAVAILABLE", "The proposal PDF is temporarily unavailable", 503);
  }
}
