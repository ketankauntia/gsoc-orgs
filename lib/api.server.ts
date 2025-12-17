import "server-only";

import { headers } from "next/headers";

/**
 * Server-only API fetch helper for calling this app's own `/api/*` routes.
 *
 * Why: On Vercel deployments with Authentication/Deployment Protection enabled,
 * internal server-to-server fetches must forward the request cookies; otherwise
 * Vercel returns 401 Unauthorized.
 */
export async function apiFetchServer<T = any>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    throw new Error("apiFetchServer: missing Host header");
  }

  const url = `${proto}://${host}${path}`;

  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      // Forward cookies so protected deployments authorize the request
      cookie: h.get("cookie") ?? "",
      ...(opts?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData?.error || errorMessage;
    } catch {
      // ignore
    }
    const error: any = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }

  return res.json();
}


