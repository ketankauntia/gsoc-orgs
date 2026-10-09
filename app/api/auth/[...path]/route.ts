import { isAuthConfigured, neonAuth } from "@/lib/neon-auth/server";

// Proxies the browser's auth calls (sign-in, session, sign-out) to Neon Auth.

type Context = { params: Promise<{ path: string[] }> };

function unavailable() {
  return Response.json({ error: "Sign-in is not available right now" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

let handlers: ReturnType<ReturnType<typeof neonAuth>["handler"]> | null = null;
function routeHandlers() {
  handlers ??= neonAuth().handler();
  return handlers;
}

export async function GET(request: Request, context: Context) {
  return isAuthConfigured() ? routeHandlers().GET(request, context) : unavailable();
}

export async function POST(request: Request, context: Context) {
  return isAuthConfigured() ? routeHandlers().POST(request, context) : unavailable();
}
