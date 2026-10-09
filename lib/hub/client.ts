// Browser-side helper for the /api/v2/me and /api/v2/admin routes.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; fields?: Record<string, string> };

export async function callApi<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const json = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: (json?.data ?? null) as T };
    return { ok: false, message: json?.error?.message ?? "Something went wrong. Try again.", fields: json?.error?.fields };
  } catch {
    return { ok: false, message: "You seem to be offline. Try again." };
  }
}

/** PUTs a PDF to a signed R2 upload URL. */
export async function putPdf(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
  return response.ok;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
