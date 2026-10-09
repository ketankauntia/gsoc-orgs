import { NextResponse } from "next/server";
import { organizationV1 } from "@/lib/catalog/legacy-shapes";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; year: string }> }) {
  const { slug, year } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear)) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  try {
    const rows = await db()`select * from public.organizations where slug = ${slug.slice(0, 120)}::citext and ${numericYear}::int = any(active_years)`;
    if (!rows[0]) return NextResponse.json({ error: "Organization year not found" }, { status: 404 });
    const org = organizationV1(rows[0]);
    return NextResponse.json({ organization: { slug: org.slug, name: org.name }, year: numericYear, data: org.years?.[String(numericYear)] ?? org.years?.[`year_${numericYear}`] ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch organization year" }, { status: 500 });
  }
}
