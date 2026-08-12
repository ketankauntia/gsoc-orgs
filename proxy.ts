import type { NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return;
  return updateSession(request);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/v2/me/:path*", "/api/v2/admin/:path*", "/auth/:path*"],
};
