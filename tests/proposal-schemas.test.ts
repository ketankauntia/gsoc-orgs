import { describe, expect, it } from "vitest";
import { moderationDecisionSchema, profileUpdateSchema, uploadRequestSchema } from "../lib/proposals/schemas";

describe("proposal input contracts", () => {
  it("accepts only PDF uploads of at most 10 MiB", () => {
    expect(uploadRequestSchema.safeParse({ filename: "proposal.pdf", byteSize: 10 * 1024 * 1024, mimeType: "application/pdf" }).success).toBe(true);
    expect(uploadRequestSchema.safeParse({ filename: "proposal.docx", byteSize: 100, mimeType: "application/pdf" }).success).toBe(false);
    expect(uploadRequestSchema.safeParse({ filename: "proposal.pdf", byteSize: 10 * 1024 * 1024 + 1, mimeType: "application/pdf" }).success).toBe(false);
  });

  it("limits links and rejects non-HTTP schemes", () => {
    const base = { displayName: "Contributor", bio: "Hello", avatarPublic: true, bioPublic: true };
    expect(profileUpdateSchema.safeParse({ ...base, links: [{ platform: "github", url: "javascript:alert(1)", isPublic: true, position: 0 }] }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ ...base, links: Array.from({ length: 3 }, (_, position) => ({ platform: "custom", url: `https://example.com/${position}`, isPublic: true, position })) }).success).toBe(false);
  });

  it("requires reasons for adverse moderation decisions", () => {
    expect(moderationDecisionSchema.safeParse({ decision: "approve" }).success).toBe(true);
    expect(moderationDecisionSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(moderationDecisionSchema.safeParse({ decision: "reject", reason: "Identity could not be verified" }).success).toBe(true);
  });
});
