import { safeRelativePath } from "@/lib/security";

// Google returns here after sign-in. proxy.ts has already exchanged Neon Auth's
// one-time session verifier for the session cookie, so this only forwards the
// visitor to where they were going. The Location stays relative, so it can
// only point at this site.
export function GET(request: Request) {
  const next = safeRelativePath(new URL(request.url).searchParams.get("next"));
  return new Response(null, { status: 303, headers: { Location: next, "Cache-Control": "private, no-store" } });
}
