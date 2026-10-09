import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { createObjectDownloadUrl } from "@/lib/r2";

/** Avatar of a public profile. */
export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!/^[a-z0-9-]{3,30}$/.test(handle)) return apiError("NOT_FOUND", "Avatar not found", 404);
  const rows = await db()`select avatar_key from public.public_profiles where handle = ${handle}`;
  const key = rows[0]?.avatar_key as string | null | undefined;
  if (!key) return apiError("NOT_FOUND", "Avatar not found", 404);
  return NextResponse.redirect(await createObjectDownloadUrl(key, 600), {
    headers: { "Cache-Control": "public, max-age=300", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" },
  });
}
