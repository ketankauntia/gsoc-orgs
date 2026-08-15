import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { isAllowedGoogleAvatarUrl, matchesImageSignature } from "@/lib/storage-validation";

export const MAX_PROPOSAL_PDF_BYTES = 10 * 1024 * 1024;
export const PROPOSAL_PDF_MIME = "application/pdf";

function config() {
  const gatewayUrl = process.env.R2_GATEWAY_URL;
  const signingSecret = process.env.R2_SIGNING_SECRET;
  if (!gatewayUrl || !signingSecret) throw new Error("Cloudflare R2 gateway environment variables are not configured");
  return { gatewayUrl: gatewayUrl.replace(/\/$/, ""), signingSecret };
}

function objectPath(key: string) {
  return `/objects/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function signedObjectUrl(method: "PUT" | "GET" | "HEAD" | "DELETE", key: string, options: { contentType?: string; disposition?: string; expiresIn?: number } = {}) {
  const { gatewayUrl, signingSecret } = config();
  const url = new URL(`${gatewayUrl}${objectPath(key)}`);
  const expires = String(Math.floor(Date.now() / 1000) + (options.expiresIn ?? 300));
  const contentType = options.contentType ?? "";
  const disposition = options.disposition ?? "";
  url.searchParams.set("expires", expires);
  if (contentType) url.searchParams.set("contentType", contentType);
  if (disposition) url.searchParams.set("disposition", disposition);
  const input = `${method}\n${url.pathname}\n${expires}\n${contentType}\n${disposition}`;
  url.searchParams.set("signature", createHmac("sha256", signingSecret).update(input).digest("hex"));
  return url.toString();
}

async function gatewayRequest(method: "PUT" | "GET" | "HEAD" | "DELETE", key: string, options: { body?: BodyInit; contentType?: string; disposition?: string; expiresIn?: number } = {}) {
  const response = await fetch(signedObjectUrl(method, key, options), {
    method,
    body: options.body,
    headers: options.contentType ? { "Content-Type": options.contentType } : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`R2 gateway ${method} failed with status ${response.status}`);
  return response;
}

export function newQuarantineKey(userId: string) {
  return `quarantine/${userId}/${randomUUID()}.pdf`;
}

export async function createPdfUploadUrl(key: string) {
  return signedObjectUrl("PUT", key, { contentType: PROPOSAL_PDF_MIME, expiresIn: 600 });
}

export async function createPdfDownloadUrl(key: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "gsoc-proposal.pdf";
  return signedObjectUrl("GET", key, { disposition: `inline; filename="${safeName}"`, expiresIn: 300 });
}

export type ValidatedPdf = {
  bytes: Uint8Array;
  byteSize: number;
  sha256: string;
  etag?: string;
  pageCount: number;
};

export async function validateQuarantinedPdf(key: string): Promise<ValidatedPdf> {
  const head = await gatewayRequest("HEAD", key);
  if (head.headers.get("content-type") !== PROPOSAL_PDF_MIME) throw new Error("Uploaded file is not an application/pdf object");
  const contentLength = Number(head.headers.get("content-length"));
  if (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > MAX_PROPOSAL_PDF_BYTES) throw new Error("PDF must be between 1 byte and 10 MiB");
  const object = await gatewayRequest("GET", key);
  const bytes = new Uint8Array(await object.arrayBuffer());
  if (bytes.byteLength > MAX_PROPOSAL_PDF_BYTES) throw new Error("PDF must be no larger than 10 MiB");
  if (bytes.byteLength !== contentLength) throw new Error("PDF changed while it was being validated");
  if (new TextDecoder("ascii").decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("File does not have a valid PDF signature");
  const document = await PDFDocument.load(bytes, { ignoreEncryption: false, throwOnInvalidObject: true });
  if (document.getPageCount() < 1) throw new Error("PDF must contain at least one page");
  return {
    bytes,
    byteSize: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    etag: head.headers.get("etag")?.replaceAll('"', ""),
    pageCount: document.getPageCount(),
  };
}

export async function promotePdf(quarantineKey: string, proposalId: string, fileId: string, bytes: Uint8Array) {
  const destinationKey = `proposals/${proposalId}/${fileId}.pdf`;
  await gatewayRequest("PUT", destinationKey, { body: Uint8Array.from(bytes).buffer, contentType: PROPOSAL_PDF_MIME });
  await gatewayRequest("DELETE", quarantineKey);
  return destinationKey;
}

export async function deleteR2Object(key: string) {
  await gatewayRequest("DELETE", key);
}

export async function importGoogleAvatar(userId: string, sourceUrl: string) {
  if (!isAllowedGoogleAvatarUrl(sourceUrl)) throw new Error("Google avatar URL is not trusted");
  let url = new URL(sourceUrl);
  let response: Response | undefined;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("Google avatar redirect is invalid");
    const redirected = new URL(location, url);
    if (!isAllowedGoogleAvatarUrl(redirected.toString())) throw new Error("Google avatar redirect is not trusted");
    url = redirected;
    response = undefined;
  }
  if (!response) throw new Error("Google avatar redirected too many times");
  if (!response.ok) throw new Error("Google avatar could not be downloaded");
  const mimeType = response.headers.get("content-type")?.split(";")[0];
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  if (!mimeType || !extensions[mimeType]) throw new Error("Google avatar has an unsupported image format");
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > 2 * 1024 * 1024) throw new Error("Google avatar must be no larger than 2 MiB");
  if (!response.body) throw new Error("Google avatar could not be read");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 2 * 1024 * 1024) {
      await reader.cancel();
      throw new Error("Google avatar must be no larger than 2 MiB");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total));
  if (bytes.byteLength < 1 || bytes.byteLength > 2 * 1024 * 1024) throw new Error("Google avatar must be no larger than 2 MiB");
  if (!matchesImageSignature(bytes, mimeType)) throw new Error("Google avatar content does not match its image type");
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const key = `avatars/${userId}/google-${digest}.${extensions[mimeType]}`;
  await gatewayRequest("PUT", key, { body: Uint8Array.from(bytes).buffer, contentType: mimeType });
  return key;
}

export async function createObjectDownloadUrl(key: string, expiresIn = 300) {
  return signedObjectUrl("GET", key, { expiresIn });
}
