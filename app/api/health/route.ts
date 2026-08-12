import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const started = Date.now();
  try {
    const { error } = await createAdminClient().from("organizations").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "supabase-postgres", response_time_ms: Date.now() - started, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json({ status: "error", database: "unavailable", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
