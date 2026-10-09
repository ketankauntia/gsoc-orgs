import { NextResponse } from "next/server";
import { CacheHeaders } from "@/lib/cache";
import { organizationV1 } from "@/lib/catalog/legacy-shapes";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const rows = await db()`select * from public.organizations where slug = ${slug.slice(0, 120)}::citext`;
    if (!rows[0]) return NextResponse.json({ success: false, error: { message: "Organization not found", code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json(
      { success: true, data: organizationV1(rows[0]), meta: { timestamp: new Date().toISOString(), version: "v1", cached: true, cache_ttl: "30 days" } },
      { headers: { "Cache-Control": CacheHeaders.LONG } },
    );
  } catch (error) {
    console.error("Organization detail API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch organization", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
