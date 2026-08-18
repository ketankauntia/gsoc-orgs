import "server-only";

import { apiError } from "@/lib/api-response";
import { consumeRateLimit, getUser, getUserRoles } from "@/lib/auth";
import { isTrustedMutationRequest } from "@/lib/security";

export async function authorizeAdminApi() {
  const user = await getUser();
  if (!user) return { response: apiError("UNAUTHENTICATED", "Sign in is required", 401) } as const;
  const roles = await getUserRoles(user.id);
  if (!roles.includes("admin")) return { response: apiError("FORBIDDEN", "Administrator access is required", 403) } as const;
  return { user } as const;
}

export async function authorizeAdminMutationApi(request: Request) {
  if (!isTrustedMutationRequest(request)) return { response: apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403) } as const;
  const auth = await authorizeAdminApi();
  if ("response" in auth) return auth;
  try {
    if (!(await consumeRateLimit("moderate_proposal"))) return { response: apiError("RATE_LIMITED", "Too many administrator actions; try again later", 429) } as const;
  } catch (error) {
    console.error("[admin content:rate-limit]", error);
    return { response: apiError("ADMIN_UNAVAILABLE", "Administrator actions are temporarily unavailable", 503) } as const;
  }
  return auth;
}
