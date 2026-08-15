import "./load-env";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";

function requiredEnv(name: "R2_GATEWAY_URL" | "R2_SIGNING_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const gateway = requiredEnv("R2_GATEWAY_URL").replace(/\/$/, "");
const secret = requiredEnv("R2_SIGNING_SECRET");

function signedUrl(method: string, key: string, contentType = "") {
  const pathname = `/objects/${key.split("/").map(encodeURIComponent).join("/")}`;
  const url = new URL(`${gateway}${pathname}`);
  const expires = String(Math.floor(Date.now() / 1000) + 300);
  url.searchParams.set("expires", expires);
  if (contentType) url.searchParams.set("contentType", contentType);
  const input = `${method}\n${pathname}\n${expires}\n${contentType}\n`;
  url.searchParams.set("signature", createHmac("sha256", secret).update(input).digest("hex"));
  return url;
}

async function expectStatus(response: Response, status: number, label: string) {
  if (response.status !== status) throw new Error(`${label}: expected ${status}, received ${response.status}`);
}

const userId = randomUUID();
const proposalId = randomUUID();
const fileId = randomUUID();
const quarantineKey = `quarantine/${userId}/${randomUUID()}.pdf`;
const proposalKey = `proposals/${proposalId}/${fileId}.pdf`;
const cleanup = async (key: string) => fetch(signedUrl("DELETE", key), { method: "DELETE" }).catch(() => undefined);

async function main() {
try {
  const health = await fetch(`${gateway}/health`);
  await expectStatus(health, 200, "health");

  const preflight = await fetch(`${gateway}/objects/test`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:3000", "Access-Control-Request-Method": "PUT" },
  });
  await expectStatus(preflight, 204, "CORS preflight");
  if (preflight.headers.get("access-control-allow-origin") !== "http://localhost:3000") throw new Error("CORS origin was not returned");

  const invalid = signedUrl("GET", quarantineKey);
  invalid.searchParams.set("signature", "0".repeat(64));
  await expectStatus(await fetch(invalid), 403, "invalid signature");

  const document = await PDFDocument.create();
  document.addPage([612, 792]);
  const bytes = await document.save();
  const body = Uint8Array.from(bytes).buffer;
  const digest = createHash("sha256").update(bytes).digest("hex");

  await expectStatus(await fetch(signedUrl("PUT", quarantineKey, "application/pdf"), {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body,
  }), 201, "quarantine upload");

  const head = await fetch(signedUrl("HEAD", quarantineKey), { method: "HEAD" });
  await expectStatus(head, 200, "quarantine metadata");
  if (head.headers.get("content-type") !== "application/pdf") throw new Error("Stored PDF content type is incorrect");
  if (Number(head.headers.get("content-length")) !== bytes.byteLength) throw new Error("Stored PDF size is incorrect");

  const quarantined = await fetch(signedUrl("GET", quarantineKey));
  await expectStatus(quarantined, 200, "quarantine download");
  const downloaded = new Uint8Array(await quarantined.arrayBuffer());
  if (createHash("sha256").update(downloaded).digest("hex") !== digest) throw new Error("Quarantine download checksum mismatch");

  await expectStatus(await fetch(signedUrl("PUT", proposalKey, "application/pdf"), {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body,
  }), 201, "proposal promotion upload");
  await expectStatus(await fetch(signedUrl("DELETE", quarantineKey), { method: "DELETE" }), 204, "quarantine cleanup");

  const promoted = await fetch(signedUrl("GET", proposalKey));
  await expectStatus(promoted, 200, "promoted proposal download");
  if (createHash("sha256").update(new Uint8Array(await promoted.arrayBuffer())).digest("hex") !== digest) throw new Error("Promoted PDF checksum mismatch");
  await expectStatus(await fetch(signedUrl("DELETE", proposalKey), { method: "DELETE" }), 204, "proposal cleanup");

  console.log("R2 gateway verification passed: signing, CORS, PDF upload, metadata, download, promotion, and cleanup");
} finally {
  await Promise.all([cleanup(quarantineKey), cleanup(proposalKey)]);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
