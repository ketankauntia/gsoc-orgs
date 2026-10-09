// Shapes returned by the contributor hub queries. Timestamps are ISO strings
// because the queries build JSON in SQL.

import type { PiiFinding } from "@/lib/pii";

export type Role = "contributor" | "mentor";
export type Verification = "unverified" | "verified" | "rejected";
export type ProposalStatus = "draft" | "published" | "removed";
export type PostKind = "weekly_update" | "midterm" | "final_report" | "talk_video" | "other";

export const POST_KINDS: Array<{ value: PostKind; label: string }> = [
  { value: "weekly_update", label: "Weekly update" },
  { value: "midterm", label: "Midterm report" },
  { value: "final_report", label: "Final report" },
  { value: "talk_video", label: "Talk or video" },
  { value: "other", label: "Other" },
];

export const TERMS_VERSION = "2026-10";

export type Profile = {
  user_id: string;
  display_name: string;
  handle: string | null;
  bio: string | null;
  avatar_key: string | null;
  website_url: string | null;
  github_username: string | null;
  x_username: string | null;
  medium_url: string | null;
  is_public: boolean;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
};

export type Story = {
  v: 1;
  chose_org_because?: string;
  prior_contributions?: number;
  first_contribution_month?: string;
  hours_per_week?: number;
  proposal_tip?: string;
  advice?: string;
};

export type MyProposal = {
  id: string;
  slug: string;
  status: ProposalStatus;
  locked_at: string | null;
  file_version: number;
  file_pages: number | null;
  file_bytes: number | null;
  file_sha256: string | null;
  file_uploaded_at: string | null;
  uploaded_by_admin: boolean;
  extraction_status: "pending" | "ok" | "failed";
  pii_findings: PiiFinding[] | null;
  pii_confirmed: boolean;
  needs_confirmation: boolean;
  licence_accepted_at: string | null;
  published_at: string | null;
  removal_requested_at: string | null;
  removed_at: string | null;
  removed_reason: string | null;
  upload_in_progress: boolean;
};

export type MyPost = {
  id: string;
  url: string;
  title: string | null;
  kind: PostKind;
  published_on: string | null;
  hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
};

export type MyParticipation = {
  id: string;
  person_id: string;
  role: Role;
  archived_name: string;
  year: number;
  project_external_id: string;
  project_title: string;
  organization_slug: string;
  organization_name: string;
  work_product_url: string | null;
  verification: Verification;
  reviewed_at: string | null;
  rejection_reason: string | null;
  note: string | null;
  evidence_urls: string[];
  story: Story | null;
  story_public: boolean;
  created_at: string;
  proposal: MyProposal | null;
  posts: MyPost[];
};

export type SlotPerson = { person_id: string; role: Role; archived_name: string; ordinal: number; verified: boolean };
export type SlotProject = { external_id: string; title: string; people: SlotPerson[] };
export type SlotOrganization = { slug: string; name: string; projects: number };
