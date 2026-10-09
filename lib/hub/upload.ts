import "server-only";

import { db } from "@/lib/db";
import { scanForPii } from "@/lib/pii";
import { createPdfUploadUrl, deleteR2Object, extractPdfText, isQuarantineKeyFor, newQuarantineKey, promoteProposalPdf, validateQuarantinedPdf } from "@/lib/r2";

// Upload pipeline shared by owners and the admin:
//   1. start_*_upload reserves the proposal; the browser PUTs the PDF to a
//      quarantine key through the signed R2 gateway.
//   2. completeProposalUpload validates it, extracts text, scans for personal
//      data, records the file (which takes the proposal out of public view),
//      then copies it over proposals/<id>.pdf. One file per proposal, always.

const MAX_TEXT_CHARS = 400_000;

export class UploadRejected extends Error {}

export async function uploadTarget(proposalId: string) {
  const key = newQuarantineKey(proposalId);
  return { proposalId, key, uploadUrl: await createPdfUploadUrl(key) };
}

export async function completeProposalUpload({ actorId, isAdmin, proposalId, key }: { actorId: string; isAdmin: boolean; proposalId: string; key: string }) {
  if (!isQuarantineKeyFor(key, proposalId)) throw new UploadRejected("This upload does not belong to the proposal");

  let validated: Awaited<ReturnType<typeof validateQuarantinedPdf>>;
  try {
    validated = await validateQuarantinedPdf(key);
  } catch (error) {
    console.warn("[proposal upload:validate]", error instanceof Error ? error.message : error);
    await deleteR2Object(key).catch(() => undefined);
    await db()`select public.abandon_proposal_upload(${proposalId}::uuid)`;
    throw new UploadRejected("Upload a readable PDF of 10 MB or less");
  }

  const text = await extractPdfText(validated.bytes);
  const findings = text.status === "ok" ? scanForPii(text.pages) : [];
  const rows = await db()`
    select public.attach_proposal_file(
      ${actorId}::uuid, ${isAdmin}, ${proposalId}::uuid,
      ${validated.sha256}, ${validated.byteSize}, ${validated.pageCount},
      ${text.status}, ${text.pages.join("\f").slice(0, MAX_TEXT_CHARS) || null}, ${JSON.stringify(findings)}::jsonb
    ) as result`;
  const result = rows[0]?.result as { file_key: string; file_version: number };

  await promoteProposalPdf(key, proposalId, validated.bytes);
  return {
    fileVersion: result.file_version,
    sha256: validated.sha256,
    pages: validated.pageCount,
    bytes: validated.byteSize,
    extractionStatus: text.status,
    piiFindings: findings,
  };
}
