import { hasAuthCookie, isAuthConfigured, neonAuth } from "@/lib/neon-auth/server";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

// Proxies the browser's auth calls to Neon Auth. Only the calls this site
// makes are forwarded: the session read (nav), Google sign-in and sign-out.
// Google returns to Neon Auth's own callback, and proxy.ts exchanges the
// one-time verifier on /auth/complete straight with Neon Auth.

type Context = { params: Promise<{ path: string[] }> };

const ALLOWED = new Set(["GET get-session", "POST sign-in/social", "POST sign-out"]);
const SESSION_VERIFIER_PARAM = "neon_auth_session_verifier";
const NO_STORE = { "Cache-Control": "no-store" };

function unavailable() {
  return Response.json({ error: "Sign-in is not available right now" }, { status: 503, headers: NO_STORE });
}

function rejected(status: 400 | 403 | 404) {
  return Response.json({ error: status === 404 ? "Not found" : "Request rejected" }, { status, headers: NO_STORE });
}

let handlers: ReturnType<ReturnType<typeof neonAuth>["handler"]> | null = null;
function routeHandlers() {
  handlers ??= neonAuth().handler();
  return handlers;
}

/** Google is the only sign-in method; ID-token sign-in is not used. */
async function googleSignInRequest(request: Request) {
  const body = await readJsonBody(request, 8 * 1024).catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if ((body as { provider?: unknown }).provider !== "google" || "idToken" in body) return null;
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(request.url, { method: "POST", headers, body: JSON.stringify(body) });
}

async function forward(request: Request, context: Context) {
  const path = (await context.params).path.join("/");
  if (!ALLOWED.has(`${request.method} ${path}`)) return rejected(404);
  if (!isAuthConfigured()) return unavailable();

  if (request.method === "GET") {
    // Visitors who never signed in have no Neon Auth cookie: answer like Neon Auth does, without the round trip.
    const anonymous = !hasAuthCookie(request.headers.get("cookie")) && !new URL(request.url).searchParams.has(SESSION_VERIFIER_PARAM);
    if (anonymous) return Response.json(null, { headers: NO_STORE });
    return routeHandlers().GET(request, context);
  }

  if (!isTrustedMutationRequest(request)) return rejected(403);
  if (path === "sign-in/social") {
    const signIn = await googleSignInRequest(request);
    return signIn ? routeHandlers().POST(signIn, context) : rejected(400);
  }
  return routeHandlers().POST(request, context);
}

export const GET = forward;
export const POST = forward;
