import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, neonAuth } from "@/lib/neon-auth/server";

// Neon Auth's middleware refreshes the session, completes Google sign-in (it
// exchanges the one-time verifier on /auth/complete) and sends signed-out
// visitors of /account and /admin to /login. It keeps only the query string,
// so the redirect is rebuilt here with ?next=<the page they asked for>.

let middleware: ((request: NextRequest) => Promise<NextResponse>) | null = null;

export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) return;
  middleware ??= neonAuth().middleware({ loginUrl: "/login" });
  const response = await middleware(request);

  const location = response.headers.get("location");
  if (!location) return response;
  const target = new URL(location, request.url);
  if (target.origin !== request.nextUrl.origin || target.pathname !== "/login") return response;

  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const redirect = NextResponse.redirect(login);
  for (const cookie of response.headers.getSetCookie()) redirect.headers.append("set-cookie", cookie);
  return redirect;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/complete"],
};
