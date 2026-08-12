import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTrustedMutationRequest } from "@/lib/security";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303, headers: { "Cache-Control": "private, no-store" } });
}
