interface Env {
  PROPOSALS: R2Bucket;
  ALLOWED_ORIGINS: string;
  SIGNING_SECRET: string;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_SIGNATURE_LIFETIME_SECONDS = 15 * 60;
const OBJECT_PREFIX = "/objects/";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const ALLOWED_KEY = new RegExp(
  `^(?:quarantine/${UUID}/${UUID}\\.pdf|proposals/${UUID}/${UUID}\\.pdf|avatars/${UUID}/google-[0-9a-f]{16}\\.(?:jpg|png|webp))$`,
  "i",
);

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  const allowed = new Set(env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean));
  const headers = new Headers({ Vary: "Origin" });
  if (origin && allowed.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function response(request: Request, env: Env, body: BodyInit | null, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [name, value] of corsHeaders(request, env)) headers.set(name, value);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { ...init, headers });
}

function errorResponse(request: Request, env: Env, status: number, message: string) {
  return response(request, env, JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hexBytes(value: string) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (part) => Number.parseInt(part, 16));
}

function signatureInput(method: string, pathname: string, expires: string, contentType: string, disposition: string) {
  return `${method}\n${pathname}\n${expires}\n${contentType}\n${disposition}`;
}

async function hasValidSignature(request: Request, env: Env, url: URL) {
  const expires = url.searchParams.get("expires") ?? "";
  const signature = hexBytes(url.searchParams.get("signature") ?? "");
  const expiresAt = Number(expires);
  const now = Math.floor(Date.now() / 1000);
  if (!signature || !Number.isInteger(expiresAt) || expiresAt < now || expiresAt > now + MAX_SIGNATURE_LIFETIME_SECONDS) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const input = signatureInput(
    request.method,
    url.pathname,
    expires,
    url.searchParams.get("contentType") ?? "",
    url.searchParams.get("disposition") ?? "",
  );
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(input));
}

function objectKey(url: URL) {
  if (!url.pathname.startsWith(OBJECT_PREFIX)) return null;
  try {
    const key = url.pathname.slice(OBJECT_PREFIX.length).split("/").map(decodeURIComponent).join("/");
    return ALLOWED_KEY.test(key) ? key : null;
  } catch {
    return null;
  }
}

function expectedUpload(key: string) {
  if (key.endsWith(".pdf")) return { contentTypes: ["application/pdf"], maxBytes: MAX_PDF_BYTES };
  return { contentTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: MAX_AVATAR_BYTES };
}

async function readLimitedBody(request: Request, maxBytes: number) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  if (total < 1) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function putObject(request: Request, env: Env, url: URL, key: string) {
  const expected = expectedUpload(key);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].toLowerCase() ?? "";
  const signedContentType = url.searchParams.get("contentType") ?? "";
  if (contentType !== signedContentType || !expected.contentTypes.includes(contentType)) {
    return errorResponse(request, env, 415, "Unsupported object content type");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && (declaredLength < 1 || declaredLength > expected.maxBytes)) {
    return errorResponse(request, env, 413, "Object size is outside the allowed range");
  }
  const bytes = await readLimitedBody(request, expected.maxBytes);
  if (!bytes) {
    return errorResponse(request, env, 413, "Object size is outside the allowed range");
  }
  const object = await env.PROPOSALS.put(key, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: key.startsWith("avatars/") ? "private, max-age=86400" : "private, no-store",
    },
  });
  return response(request, env, null, { status: 201, headers: { ETag: object.httpEtag } });
}

async function readObject(request: Request, env: Env, url: URL, key: string) {
  const object = request.method === "HEAD" ? await env.PROPOSALS.head(key) : await env.PROPOSALS.get(key);
  if (!object) return errorResponse(request, env, 404, "Object not found");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  const disposition = url.searchParams.get("disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  const body = request.method === "HEAD" ? null : (object as R2ObjectBody).body;
  return response(request, env, body, { headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return response(request, env, JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (request.method === "OPTIONS") {
      const headers = corsHeaders(request, env);
      headers.set("Access-Control-Allow-Methods", "PUT, GET, HEAD, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Expose-Headers", "ETag, Content-Length, Content-Type, Content-Disposition");
      headers.set("Access-Control-Max-Age", "3600");
      return new Response(null, { status: 204, headers });
    }
    if (!["PUT", "GET", "HEAD", "DELETE"].includes(request.method)) return errorResponse(request, env, 405, "Method not allowed");
    const key = objectKey(url);
    if (!key) return errorResponse(request, env, 404, "Object path not found");
    if (!(await hasValidSignature(request, env, url))) return errorResponse(request, env, 403, "Invalid or expired signature");
    if (request.method === "PUT") return putObject(request, env, url, key);
    if (request.method === "GET" || request.method === "HEAD") return readObject(request, env, url, key);
    await env.PROPOSALS.delete(key);
    return response(request, env, null, { status: 204 });
  },
} satisfies ExportedHandler<Env>;
