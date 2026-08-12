import { z } from "zod";

const httpUrl = z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL");

export const profileLinkSchema = z.object({
  platform: z.enum(["github", "gitlab", "linkedin", "x", "mastodon", "bluesky", "youtube", "reddit", "stackoverflow", "medium", "portfolio", "custom"]),
  label: z.string().trim().max(50).optional().nullable(),
  url: httpUrl.max(2048),
  isPublic: z.boolean().default(true),
  position: z.number().int().min(0).max(99),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(500).optional().nullable(),
  avatarPublic: z.boolean(),
  bioPublic: z.boolean(),
  links: z.array(profileLinkSchema).max(12).refine((links) => links.filter((link) => link.platform === "custom").length <= 2, "At most two custom links are allowed"),
});

export const createClaimSchema = z.object({
  contributorSlotId: z.string().uuid(),
  claimantNote: z.string().trim().max(1000).optional().nullable(),
  evidenceUrls: z.array(httpUrl.max(2048)).max(2).default([]),
});

export const proposalPatchSchema = z.object({
  claimantNote: z.string().trim().max(1000).optional().nullable(),
  evidenceUrls: z.array(httpUrl.max(2048)).max(2).optional(),
});

export const uploadRequestSchema = z.object({
  filename: z.string().trim().min(1).max(150).refine((name) => name.toLowerCase().endsWith(".pdf"), "Only PDF files are accepted"),
  byteSize: z.number().int().min(1).max(10 * 1024 * 1024),
  mimeType: z.literal("application/pdf"),
});

export const uploadCompleteSchema = z.object({
  key: z.string().min(1).max(500),
  filename: z.string().trim().min(1).max(150).refine((name) => name.toLowerCase().endsWith(".pdf")),
});

export const moderationDecisionSchema = z.object({
  decision: z.enum(["verify_claim", "reject_claim", "request_changes", "approve", "reject", "reopen"]),
  reason: z.string().trim().max(2000).optional().nullable(),
}).superRefine((value, context) => {
  if (["reject_claim", "request_changes", "reject", "reopen"].includes(value.decision) && (!value.reason || value.reason.length < 3)) {
    context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required" });
  }
});

export const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["moderator", "admin"]),
  enabled: z.boolean(),
});

export function zodFields(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "request", issue.message]));
}
