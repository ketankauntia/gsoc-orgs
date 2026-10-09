import { NextResponse } from "next/server";
import { safeRelativePath } from "@/lib/security";

// Google returns here after sign-in. proxy.ts has already exchanged Neon Auth's
// one-time session verifier for the session cookie, so this only forwards the
// visitor to where they were going.
export function GET(request: Request) {
  const next = safeRelativePath(new URL(request.url).searchParams.get("next"));
  return NextResponse.redirect(new URL(next, request.url), { status: 303, headers: { "Cache-Control": "private, no-store" } });
}
