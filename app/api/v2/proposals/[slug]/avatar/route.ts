import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { createObjectDownloadUrl } from "@/lib/r2";

/** Avatar of a proposal's verified owner, only when their profile is public. The segment is the proposal id. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Avatar not found", 404);
  const rows = await db()`select owner_avatar_key from public.public_proposals where id = ${id}::uuid`;
  const key = rows[0]?.owner_avatar_key as string | null | undefined;
  if (!key) return apiError("NOT_FOUND", "Avatar not found", 404);
  // The storage gateway accepts signatures of at most 15 minutes.
  return NextResponse.redirect(await createObjectDownloadUrl(key, 600), {
    headers: { "Cache-Control": "public, max-age=300", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" },
  });
}
