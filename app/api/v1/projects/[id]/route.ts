import { NextResponse } from "next/server";
import { projectV1 } from "@/lib/catalog/legacy-shapes";
import { PROJECT_WITH_PEOPLE } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db().query(
      `select p.*, ${PROJECT_WITH_PEOPLE} from public.projects p join public.organizations o on o.id = p.organization_id where p.external_id = $1`,
      [id.slice(0, 200)],
    );
    if (!rows[0]) return NextResponse.json({ success: false, error: { message: "Project not found", code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json(
      { success: true, data: projectV1(rows[0]), meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Project detail API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch project", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
