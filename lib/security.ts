const DEFAULT_JSON_LIMIT = 32 * 1024;

export function safeRelativePath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, "https://local.invalid");
    if (parsed.origin !== "https://local.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
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
