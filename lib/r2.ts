import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PDFDocument } from "pdf-lib";
import { isAllowedGoogleAvatarUrl, matchesImageSignature } from "@/lib/storage-validation";

export const MAX_PROPOSAL_PDF_BYTES = 10 * 1024 * 1024;
export const PROPOSAL_PDF_MIME = "application/pdf";

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Cloudflare R2 environment variables are not configured");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function r2() {
  const { accountId, accessKeyId, secretAccessKey } = config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function newQuarantineKey(userId: string) {
  return `quarantine/${userId}/${randomUUID()}.pdf`;
}

export async function createPdfUploadUrl(key: string) {
  const { bucket } = config();
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: PROPOSAL_PDF_MIME }),
    { expiresIn: 600 },
  );
}

export async function createPdfDownloadUrl(key: string, filename: string) {
  const { bucket } = config();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "gsoc-proposal.pdf";
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: PROPOSAL_PDF_MIME,
      ResponseContentDisposition: `inline; filename="${safeName}"`,
    }),
    { expiresIn: 300 },
  );
}

export type ValidatedPdf = {
  bytes: Uint8Array;
  byteSize: number;
  sha256: string;
  etag?: string;
  pageCount: number;
};

export async function validateQuarantinedPdf(key: string): Promise<ValidatedPdf> {
  const { bucket } = config();
  const client = r2();
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (head.ContentType !== PROPOSAL_PDF_MIME) throw new Error("Uploaded file is not an application/pdf object");
  if (!head.ContentLength || head.ContentLength > MAX_PROPOSAL_PDF_BYTES) throw new Error("PDF must be between 1 byte and 10 MiB");

  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) throw new Error("Uploaded PDF could not be read");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength;
    if (total > MAX_PROPOSAL_PDF_BYTES) throw new Error("PDF must be no larger than 10 MiB");
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total));
  if (bytes.byteLength !== head.ContentLength) throw new Error("PDF changed while it was being validated");
  if (new TextDecoder("ascii").decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("File does not have a valid PDF signature");
  const document = await PDFDocument.load(bytes, { ignoreEncryption: false, throwOnInvalidObject: true });
  if (document.getPageCount() < 1) throw new Error("PDF must contain at least one page");
  return {
    bytes,
    byteSize: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    etag: head.ETag?.replaceAll('"', ""),
    pageCount: document.getPageCount(),
  };
}

export async function promotePdf(quarantineKey: string, proposalId: string, fileId: string) {
  const { bucket } = config();
  const destinationKey = `proposals/${proposalId}/${fileId}.pdf`;
  const client = r2();
  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    Key: destinationKey,
    CopySource: `${bucket}/${quarantineKey}`,
    ContentType: PROPOSAL_PDF_MIME,
    MetadataDirective: "REPLACE",
  }));
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: quarantineKey }));
  return destinationKey;
}

export async function deleteR2Object(key: string) {
  const { bucket } = config();
  await r2().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
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
  const { bucket } = config();
  await r2().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: mimeType, CacheControl: "private, max-age=86400" }));
  return key;
}

export async function createObjectDownloadUrl(key: string, expiresIn = 300) {
  const { bucket } = config();
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
