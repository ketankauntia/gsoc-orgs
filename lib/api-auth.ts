import "server-only";

import { apiError } from "@/lib/api-response";
import { getViewer, type Viewer } from "@/lib/auth";
import { userFacingDatabaseError } from "@/lib/db";
import { isTrustedMutationRequest } from "@/lib/security";

type Gate = { viewer: Viewer; response?: undefined } | { viewer?: undefined; response: Response };

/** Signed-in, active user. Mutations must also come from this site. */
export async function apiViewer(request?: Request): Promise<Gate> {
  if (request && request.method !== "GET" && !isTrustedMutationRequest(request)) {
    return { response: apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403) };
  }
  const viewer = await getViewer();
  if (!viewer) return { response: apiError("UNAUTHENTICATED", "Sign in first", 401) };
  if (viewer.profile.status !== "active") return { response: apiError("SUSPENDED", "Your account is not active", 403) };
  return { viewer };
}

/** Signed-in user whose id is in ADMIN_USER_IDS. */
export async function apiAdmin(request?: Request): Promise<Gate> {
  const gate = await apiViewer(request);
  if (gate.response) return gate;
  if (!gate.viewer.isAdmin) return { response: apiError("FORBIDDEN", "Admin access is required", 403) };
  return gate;
}

/** Messages our SQL functions raise for users pass through; anything else is logged. */
export function databaseErrorResponse(error: unknown, context: string) {
  const message = userFacingDatabaseError(error);
  if (message) return apiError("REJECTED", message, 400);
  console.error(`[${context}]`, error);
  return apiError("SERVER_ERROR", "Something went wrong. Try again.", 500);
}
