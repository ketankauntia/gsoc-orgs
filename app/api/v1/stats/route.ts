import { NextResponse } from "next/server";
import { CacheHeaders } from "@/lib/cache";
import { jsonObject, jsonStringArray, type Json } from "@/lib/catalog/legacy-shapes";
import { db } from "@/lib/db";
import { canonicalTechnology } from "@/lib/vocabulary/catalog";

export async function GET() {
  try {
    const sql = db();
    const [[counts], orgRows] = await Promise.all([
      sql`select
        (select count(*) from public.organizations)::int as total,
        (select count(*) from public.organizations where is_currently_active)::int as active,
        (select count(*) from public.projects)::int as projects,
        (select count(*) from public.technologies)::int as technologies,
        (select count(*) from public.topics)::int as topics`,
      sql`select category, active_years, source_payload from public.organizations`,
    ]);
    const { total, active, projects, technologies, topics } = counts as Record<string, number>;
    const orgs = orgRows as Array<{ category: string; active_years: number[] | null; source_payload: Json }>;

    const years = (orgs ?? []).flatMap((org) => org.active_years ?? []);
    const categories = new Map<string, number>();
    const techCounts = new Map<string, number>();
    for (const org of orgs ?? []) {
      categories.set(org.category, (categories.get(org.category) ?? 0) + 1);
      const organizationTechnologies = new Map(jsonStringArray(jsonObject(org.source_payload).technologies).map((raw) => {
        const canonical = canonicalTechnology(raw);
        return [canonical.slug, canonical] as const;
      }));
      organizationTechnologies.forEach((technology) => {
        techCounts.set(technology.name, (techCounts.get(technology.name) ?? 0) + 1);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_organizations: total ?? 0,
          active_organizations: active ?? 0,
          inactive_organizations: (total ?? 0) - (active ?? 0),
          total_projects: projects ?? 0,
          total_technologies: technologies ?? 0,
          total_topics: topics ?? 0,
          total_categories: categories.size,
        },
        years: {
          first: Math.min(...years),
          last: Math.max(...years),
          total: new Set(years).size,
          range: Math.max(...years) - Math.min(...years) + 1,
        },
        top_categories: [...categories].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
        top_technologies: [...techCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 20),
      },
      meta: { timestamp: new Date().toISOString(), version: "v1", cached: true, cache_ttl: "7 days" },
    }, { headers: { "Cache-Control": CacheHeaders.MEDIUM } });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch statistics", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
