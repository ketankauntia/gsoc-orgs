import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRelativePath, trustedRedirectOrigin } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRelativePath(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${trustedRedirectOrigin(request)}${next}`);
    }
  }
  return NextResponse.redirect(`${trustedRedirectOrigin(request)}/login?error=oauth`);
}
