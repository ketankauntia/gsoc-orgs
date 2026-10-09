import "server-only";

import { db } from "@/lib/db";
import { getOwnedProposal, getProposalForAdmin } from "@/lib/hub/queries";
import { scanForPii } from "@/lib/pii";
import {
  createPdfUploadUrl, deleteR2Object, extractPdfText, isQuarantineKeyFor, isRefusedWrite, newQuarantineKey, proposalFileKey,
  storedObjectSha256, storeProposalPdf, validateQuarantinedPdf, type ValidatedPdf,
} from "@/lib/r2";

// Upload pipeline shared by owners and the admin:
//   1. start_*_upload reserves the proposal; the browser PUTs the PDF to a
//      quarantine key through the signed R2 gateway.
//   2. completeProposalUpload checks the caller may still store a file on the
//      proposal, then validates the upload, extracts text and scans it for
//      personal data.
//   3. stage_proposal_file records the file as pending and takes the proposal
//      out of public view; the PDF is copied over proposals/<id>.pdf; then
//      finish_proposal_upload makes it the current file. When the copy fails,
//      revert_proposal_upload drops it again. One file per proposal, always,
//      and one stored file per reservation.
// Every failure after step 1 ends the caller's reservation and deletes the
// quarantined upload.

const MAX_TEXT_CHARS = 400_000;

/** The upload or the request cannot be accepted (422). */
export class UploadRejected extends Error {}
/** No such proposal, or not the caller's (404). */
export class UploadNotFound extends Error {}
/** Storing the file failed after the proposal left public view. */
export class UploadFailed extends Error {
  constructor(message: string, readonly status = 503) {
    super(message);
  }
}

type Actor = { actorId: string; isAdmin: boolean; proposalId: string };

export async function uploadTarget(proposalId: string) {
  const key = newQuarantineKey(proposalId);
  return { proposalId, key, uploadUrl: await createPdfUploadUrl(key) };
}

// Postgres text cannot hold NUL, and unpaired surrogates do not survive UTF-8.
function postgresText(value: string) {
  return value.replace(/\u0000/g, "").toWellFormed();
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function releaseReservation({ actorId, isAdmin, proposalId }: Actor) {
  const release = isAdmin
    ? db()`select public.admin_abandon_proposal_upload(${actorId}::uuid, ${proposalId}::uuid)`
    : db()`select public.abandon_my_proposal_upload(${actorId}::uuid, ${proposalId}::uuid)`;
  await release.catch((error) => console.warn("[proposal upload:release]", describe(error)));
}

async function deleteQuarantined(key: string) {
  await deleteR2Object(key).catch((error) => console.warn("[proposal upload:delete-quarantine]", describe(error)));
}

/**
 * Copies the staged file over proposals/<id>.pdf. When the request fails, the
 * stored object is read back: it may hold the new file after all (carry on).
 * Only when the gateway refused the write and still holds the file on record
 * is the pending file dropped; after a timeout or a dropped connection the
 * write may still land, so the file stays pending and nobody can confirm or
 * publish what is stored.
 */
async function storeStagedFile({ actorId, proposalId }: Actor, file: ValidatedPdf, previousSha256: string | null) {
  let refused = false;
  try {
    await storeProposalPdf(proposalId, file.bytes);
    return;
  } catch (error) {
    refused = isRefusedWrite(error);
    console.error("[proposal upload:store]", describe(error));
  }
  const stored = await storedObjectSha256(proposalFileKey(proposalId)).catch((error) => {
    console.error("[proposal upload:read-back]", describe(error));
    return undefined;
  });
  if (stored === file.sha256) return;
  const intact = refused && stored !== undefined && stored === previousSha256;
  await db()`select public.revert_proposal_upload(${actorId}::uuid, ${proposalId}::uuid, ${file.sha256}, ${intact})`
    .catch((error) => console.error("[proposal upload:revert]", describe(error)));
  throw new UploadFailed("We could not save your file. Upload it again.");
}

export async function completeProposalUpload({ actorId, isAdmin, proposalId, key }: Actor & { key: string }) {
  const actor = { actorId, isAdmin, proposalId };
  if (!isQuarantineKeyFor(key, proposalId)) throw new UploadRejected("This upload does not belong to the proposal");
  // Someone else's proposal: stop before reading the upload or touching the reservation.
  const owned = isAdmin ? await getProposalForAdmin(proposalId) : await getOwnedProposal(actorId, proposalId);
  if (!owned) throw new UploadNotFound("Proposal not found");

  let validated: ValidatedPdf;
  let extractionStatus: "ok" | "failed";
  let findings: ReturnType<typeof scanForPii>;
  let previousSha256: string | null;
  try {
    await db()`select public.check_proposal_upload(${actorId}::uuid, ${isAdmin}, ${proposalId}::uuid)`;
    try {
      validated = await validateQuarantinedPdf(key);
    } catch (error) {
      console.warn("[proposal upload:validate]", describe(error));
      throw new UploadRejected("Upload a readable PDF of 10 MB or less");
    }
    const extracted = await extractPdfText(validated.bytes);
    const pages = extracted.pages.map(postgresText);
    extractionStatus = extracted.status;
    findings = extracted.status === "ok" ? scanForPii(pages) : [];
    const text = postgresText(pages.join("\f").slice(0, MAX_TEXT_CHARS)) || null;
    const rows = await db()`
      select public.stage_proposal_file(
        ${actorId}::uuid, ${isAdmin}, ${proposalId}::uuid,
        ${validated.sha256}, ${validated.byteSize}, ${validated.pageCount},
        ${extractionStatus}, ${text}, ${JSON.stringify(findings)}::jsonb
      ) as staged`;
    previousSha256 = (rows[0]?.staged as { previous_sha256: string | null } | undefined)?.previous_sha256 ?? null;
  } catch (error) {
    await deleteQuarantined(key);
    await releaseReservation(actor);
    throw error;
  }

  // Staged: the proposal is out of public view until the file is stored and published again.
  try {
    await storeStagedFile(actor, validated, previousSha256);
    let finished: { state: "ready" | "gone" | "superseded" | "refused"; file_version?: number; delete_object?: boolean };
    try {
      const rows = await db()`select public.finish_proposal_upload(${actorId}::uuid, ${proposalId}::uuid, ${validated.sha256}) as result`;
      finished = rows[0]?.result as typeof finished;
    } catch (error) {
      console.error("[proposal upload:finish]", describe(error));
      // Stored but not recorded: keep it pending (publishing stays blocked) and end the reservation.
      await db()`select public.revert_proposal_upload(${actorId}::uuid, ${proposalId}::uuid, ${validated.sha256}, false)`
        .catch((revertError) => console.error("[proposal upload:revert]", describe(revertError)));
      throw new UploadFailed("We could not save your file. Upload it again.");
    }
    if (finished?.state === "gone" || (finished?.state === "refused" && finished.delete_object)) {
      await deleteR2Object(proposalFileKey(proposalId)).catch((error) => console.error("[proposal upload:delete-orphan]", describe(error)));
    }
    if (finished?.state === "gone") throw new UploadFailed("This proposal was removed while your file was uploading", 409);
    // The claim was rejected or the account suspended while the file was uploading.
    if (finished?.state === "refused") throw new UploadFailed("You can no longer upload to this proposal", 403);
    if (finished?.state !== "ready") throw new UploadFailed("A newer upload replaced this one. Reload to see it.", 409);
    return {
      fileVersion: finished.file_version as number,
      sha256: validated.sha256,
      pages: validated.pageCount,
      bytes: validated.byteSize,
      extractionStatus,
      piiFindings: findings,
    };
  } finally {
    await deleteQuarantined(key);
  }
}
