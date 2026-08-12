import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();
const validInterests = new Set(["ai-features", "gsoc-tools"]);

function limited(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) { attempts.set(ip, { count: 1, resetAt: now + 60_000 }); return false; }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (limited(ip)) return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const interests = Array.isArray(body.interests) ? body.interests.filter((item: unknown): item is string => typeof item === "string" && validInterests.has(item)).slice(0, 2) : [];
  try {
    const { error } = await createAdminClient().from("waitlist_entries").upsert({ email, interests, source: "website" }, { onConflict: "email" });
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[waitlist]", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

function methodNotAllowed() { return NextResponse.json({ success: false, error: "Method not allowed." }, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } }); }
export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH = methodNotAllowed;
