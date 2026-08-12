import { NextResponse } from "next/server";

export function apiData<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(meta ? { data, meta } : { data }, init);
}

export function privateApiData<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Cookie");
  return NextResponse.json(meta ? { data, meta } : { data }, { ...init, headers });
}

export function apiError(code: string, message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function pagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}
