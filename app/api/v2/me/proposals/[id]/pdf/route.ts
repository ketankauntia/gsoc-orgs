import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { createPdfDownloadUrl } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const { id } = await params;
  const admin = createAdminClient();
  const { data: proposal } = await admin.from("proposals").select("current_file_id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!proposal?.current_file_id) return apiError("NOT_FOUND", "Proposal PDF not found", 404);
  const { data: file } = await admin.from("proposal_files").select("r2_key,original_filename").eq("id", proposal.current_file_id).maybeSingle();
  if (!file) return apiError("NOT_FOUND", "Proposal PDF not found", 404);
  return NextResponse.redirect(await createPdfDownloadUrl(file.r2_key, file.original_filename), { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}
