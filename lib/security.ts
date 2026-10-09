const DEFAULT_JSON_LIMIT = 32 * 1024;
const UNSAFE_PATH_CHARACTERS = /[\\\u0000-\u001f\u007f]/;

/** The first value of a search param that may be repeated (?next=a&next=b). */
export function firstParam(value: string | string[] | null | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? undefined;
}

function isSameSitePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !UNSAFE_PATH_CHARACTERS.test(value);
}

/**
 * A same-site path to send the visitor to, or `fallback`. The check runs again
 * after URL normalization, which turns paths like `/.//evil.com` into the
 * protocol-relative `//evil.com`.
 */
export function safeRelativePath(value: string | string[] | null | undefined, fallback = "/account") {
  const input = firstParam(value);
  if (typeof input !== "string" || !isSameSitePath(input)) return fallback;
  try {
    const parsed = new URL(input, "https://local.invalid");
    if (parsed.origin !== "https://local.invalid") return fallback;
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return isSameSitePath(path) ? path : fallback;
  } catch {
    return fallback;
  }
}

export function trustedRedirectOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV !== "development" && configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return requestOrigin;
    }
  }
  return requestOrigin;
}

export function isTrustedMutationRequest(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    } catch {
      // Invalid configuration is ignored; the request's own origin remains valid.
    }
  }
  try {
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export async function readJsonBody(request: Request, maxBytes = DEFAULT_JSON_LIMIT): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new Error("UNSUPPORTED_CONTENT_TYPE");
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("BODY_TOO_LARGE");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new Error("BODY_TOO_LARGE");
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function publicDatabaseMessage(message: string, fallback: string) {
  const known = [
    "A contributor can hold at most two active GSoC claims",
    "Contributor slot is not available for claims",
    "A claim already exists for this selection year",
    "Claim rate limit exceeded",
    "Proposal is locked",
    "A valid PDF is required",
    "A complete profile is required",
    "Approval prerequisites are not satisfied",
    "Claim cannot be verified",
    "Claim cannot be rejected",
    "Claim capacity is no longer available",
  ];
  return known.find((entry) => message.includes(entry)) ?? fallback;
}
