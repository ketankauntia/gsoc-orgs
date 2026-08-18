import { describe, expect, it } from "vitest";
import { adminProposalImportSchema, contributorBlogSchema, moderationDecisionSchema, profileUpdateSchema, uploadRequestSchema } from "../lib/proposals/schemas";

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

  it("requires a rights basis and private permission record for admin imports", () => {
    const valid = { contributorSlotId: "11111111-1111-4111-8111-111111111111", displayName: "Contributor", rightsBasis: "author_consent", permissionNote: "Consent received by email." };
    expect(adminProposalImportSchema.safeParse(valid).success).toBe(true);
    expect(adminProposalImportSchema.safeParse({ ...valid, permissionNote: "" }).success).toBe(false);
    expect(adminProposalImportSchema.safeParse({ ...valid, rightsBasis: "found_online" }).success).toBe(false);
    expect(adminProposalImportSchema.safeParse({ ...valid, sourceUrl: "file:///private/message" }).success).toBe(false);
  });

  it("accepts only bounded HTTP(S) contributor blog links", () => {
    const contributorSlotId = "11111111-1111-4111-8111-111111111111";
    expect(contributorBlogSchema.safeParse({ contributorSlotId, title: "Weekly updates", url: "https://example.org/gsoc" }).success).toBe(true);
    expect(contributorBlogSchema.safeParse({ contributorSlotId, url: "javascript:alert(1)" }).success).toBe(false);
    expect(contributorBlogSchema.safeParse({ contributorSlotId, title: "x".repeat(101), url: "https://example.org" }).success).toBe(false);
  });
});
