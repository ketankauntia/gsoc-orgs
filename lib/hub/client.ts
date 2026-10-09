// Browser-side helper for the /api/v2/me and /api/v2/admin routes.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; fields?: Record<string, string> };

/** rel for links people submit themselves (posts, profile and evidence links). */
export const USER_LINK_REL = "nofollow ugc noopener noreferrer";

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

/** PUTs a PDF to a signed R2 upload URL. A network error counts as a failed upload. */
export async function putPdf(uploadUrl: string, file: File) {
  try {
    const response = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Reserves the proposal, PUTs the PDF and asks the server to check and store
 * it. When the PUT fails the reservation is released, so the next try can
 * start at once instead of waiting for it to expire.
 */
export async function uploadProposalPdf(api: "/api/v2/me/proposals" | "/api/v2/admin/proposals", personId: string, file: File): Promise<ApiResult<unknown>> {
  const start = await callApi<{ proposalId: string; key: string; uploadUrl: string }>(api, { body: { personId } });
  if (!start.ok) return start;
  const { proposalId, key, uploadUrl } = start.data;
  if (!(await putPdf(uploadUrl, file))) {
    const released = await callApi(`${api}/${proposalId}/abandon`, { body: { key } });
    return { ok: false, message: `The upload did not finish. Check your connection and try again${released.ok ? "" : " in a few minutes"}.` };
  }
  return callApi(`${api}/${proposalId}/complete`, { body: { key } });
}

/**
 * Per-row errors for a list field. The API numbers `key.N` over the non-empty
 * values that were sent, so blank rows are skipped when mapping back.
 */
export function listFieldErrors(fields: Record<string, string>, key: string, values: string[]) {
  let sent = 0;
  return values.map((value) => (value.trim() ? fields[`${key}.${sent++}`] : undefined));
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Dates in UTC so the server render and the browser agree, and plain dates (YYYY-MM-DD) keep their day. */
export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
