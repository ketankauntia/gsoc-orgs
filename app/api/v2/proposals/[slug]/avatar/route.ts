import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createObjectDownloadUrl } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  const { data, error } = await createAdminClient().from("approved_proposals").select("avatar_r2_key").eq("id", id).maybeSingle();
  if (error || !data?.avatar_r2_key) return apiError("NOT_FOUND", "Public avatar not found", 404);
  return NextResponse.redirect(await createObjectDownloadUrl(data.avatar_r2_key, 3600), { headers: { "Cache-Control": "public, max-age=3000", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}
