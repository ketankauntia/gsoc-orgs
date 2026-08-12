import { NextResponse } from "next/server";
import { CacheHeaders } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { organizationV1 } from "@/lib/supabase/legacy-shapes";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) { try { const { slug } = await params; const { data, error } = await createAdminClient().from("organizations").select("*").eq("slug", slug).maybeSingle(); if (error) throw error; if (!data) return NextResponse.json({ success: false, error: { message: "Organization not found", code: "NOT_FOUND" } }, { status: 404 }); return NextResponse.json({ success: true, data: organizationV1(data), meta: { timestamp: new Date().toISOString(), version: "v1", cached: true, cache_ttl: "30 days" } }, { headers: { "Cache-Control": CacheHeaders.LONG } }); } catch (error) { console.error("Organization detail API error:", error); return NextResponse.json({ success: false, error: { message: "Failed to fetch organization", code: "FETCH_ERROR" } }, { status: 500 }); } }

