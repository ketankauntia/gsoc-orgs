import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const started = Date.now();
  try {
    await db()`select 1 from public.organizations limit 1`;
    return NextResponse.json({ status: "ok", database: "neon-postgres", response_time_ms: Date.now() - started, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json({ status: "error", database: "unavailable", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
