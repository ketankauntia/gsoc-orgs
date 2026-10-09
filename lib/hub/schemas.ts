import { z } from "zod";

// Request bodies for /api/v2/me and /api/v2/admin. The SQL functions check
// everything again; these give early, field-level messages.

// Same rule as private.is_http_url: a host, no credentials, no whitespace,
// control, invisible or bidi characters, no backslashes.
const HTTP_URL = /^https?:\/\/[a-z0-9\u00a1-\uffff][a-z0-9._\u00a1-\uffff-]*(:(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[0-9]{1,4}))?([/?#][^\\\s\u0000-\u001f\u007f]*)?$/i;
const INVISIBLE = /[\u0080-\u00a0\u00ad\u061c\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufe00-\ufe0f\ufeff\ufff9-\ufffb]|\udb40[\udc00-\udc7f]/;
const isHttpUrl = (value: string) => HTTP_URL.test(value) && !INVISIBLE.test(value) && new TextEncoder().encode(value).length <= 2048;
const httpUrl = z.string().trim().max(2048).url().refine((value) => /^https?:\/\//i.test(value), "Use a link that starts with http:// or https://")
  .refine(isHttpUrl, "Use a plain link without spaces or a username");
const httpsUrl = z.string().trim().max(300).url().refine((value) => /^https:\/\//i.test(value), "Use a link that starts with https://")
  .refine(isHttpUrl, "Use a plain link without spaces or a username");
// Postgres text cannot hold NUL characters.
const stripNul = (value: string) => value.replace(/\u0000/g, "");
const requiredText = (min: number, minMessage: string, max: number) => z.string().trim().min(min, minMessage).max(max).transform(stripNul);
const optionalText = (max: number) => z.string().trim().max(max).transform(stripNul).optional().nullable();
const emptyToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const stripAt = (value: unknown) => (typeof value === "string" ? (value.trim().replace(/^@/, "") || null) : value);

export const profileSchema = z.object({
  displayName: requiredText(1, "Enter your name", 80),
  handle: z.preprocess(emptyToNull, z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, "3 to 30 lowercase letters, digits or hyphens").nullable()),
  bio: optionalText(500),
  websiteUrl: z.preprocess(emptyToNull, httpsUrl.nullable()),
  githubUsername: z.preprocess(stripAt, z.string().regex(/^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/, "Not a valid GitHub username").nullable()),
  xUsername: z.preprocess(stripAt, z.string().regex(/^[A-Za-z0-9_]{1,15}$/, "Not a valid X username").nullable()),
  mediumUrl: z.preprocess(emptyToNull, httpsUrl.nullable()),
  isPublic: z.boolean(),
}).refine((value) => !value.isPublic || value.handle, { path: ["handle"], message: "Choose a handle to make your profile public" });

export const claimSchema = z.object({
  personId: z.string().uuid(),
  note: optionalText(1000),
  evidenceUrls: z.array(httpUrl).max(3, "Add at most three links").default([]),
});

export const storySchema = z.object({
  v: z.literal(1),
  chose_org_because: optionalText(600).transform((value) => value || undefined),
  prior_contributions: z.number().int().min(0).max(1000).optional().nullable().transform((value) => value ?? undefined),
  first_contribution_month: z.preprocess(emptyToNull, z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/, "Use YYYY-MM").nullable().optional()).transform((value) => value || undefined),
  hours_per_week: z.number().int().min(1).max(80).optional().nullable().transform((value) => value ?? undefined),
  proposal_tip: optionalText(600).transform((value) => value || undefined),
  advice: optionalText(1000).transform((value) => value || undefined),
});

export const participationSchema = z.object({
  note: optionalText(1000),
  evidenceUrls: z.array(httpUrl).max(3, "Add at most three links").default([]),
  story: storySchema.nullable(),
  storyPublic: z.boolean().default(false),
});

export const startUploadSchema = z.object({ personId: z.string().uuid() });
export const completeUploadSchema = z.object({ key: z.string().min(1).max(200) });
export const confirmSchema = z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const finalizeSchema = z.object({ acceptLicence: z.literal(true, "Accept CC BY 4.0 to publish"), confirmOwnWork: z.literal(true, "Confirm this is your accepted proposal") });
export const reasonSchema = z.object({ reason: requiredText(3, "Tell us briefly why", 1000) });

const postKind = z.enum(["weekly_update", "midterm", "final_report", "talk_video", "other"]);
const postDate = z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable());
export const postSchema = z.object({
  personId: z.string().uuid(),
  url: httpUrl,
  title: optionalText(140),
  kind: postKind,
  publishedOn: postDate,
});
export const postUpdateSchema = postSchema.omit({ personId: true });

export const adminClaimDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify") }),
  z.object({ action: z.literal("reject"), reason: requiredText(3, "Give a reason", 1000) }),
]);
export const adminOverrideSchema = z.object({ email: z.string().trim().email("Enter the account's email"), personId: z.string().uuid(), reason: requiredText(3, "Give a reason", 1000) });
export const adminPostSchema = z.object({
  personId: z.string().uuid(),
  url: httpUrl,
  title: optionalText(140),
  kind: postKind,
  publishedOn: postDate,
});
export const adminPermissionSchema = z.object({
  basis: z.enum(["author_consent", "rights_holder_consent", "already_cc_by_4_0"]),
  note: requiredText(3, "Describe the permission", 2000),
  sourceUrl: z.preprocess(emptyToNull, httpUrl.nullable()),
  givenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});
export const adminHideSchema = z.object({ hidden: z.boolean(), reason: optionalText(1000) });
export const adminProfileStatusSchema = z.object({ status: z.enum(["active", "suspended"]), reason: optionalText(1000) });

export function zodFields(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "request", issue.message]));
}
