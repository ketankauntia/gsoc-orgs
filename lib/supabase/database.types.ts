/**
 * Supabase database contract for application code and tooling.
 * Regenerate from a linked project with `npm run supabase:types` after migrations.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type JsonObject = { [key: string]: Json | undefined };
type OrganizationSourcePayload = JsonObject & {
  technologies?: string[];
  topics?: string[];
  years?: Record<string, JsonObject>;
  stats?: JsonObject & {
    projects_by_year?: Record<string, number>;
    students_by_year?: Record<string, number>;
  };
};

type Relationship<Name extends string, Columns extends string[], Relation extends string, Referenced extends string[], OneToOne extends boolean = false> = {
  foreignKeyName: Name;
  columns: Columns;
  isOneToOne: OneToOne;
  referencedRelation: Relation;
  referencedColumns: Referenced;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>, Relationships extends readonly unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: [Update] extends [never] ? Partial<Insert> : Update;
  Relationships: Relationships;
};

type CatalogBase = { id: string; created_at?: string; updated_at?: string };
type ProposalStatus = "draft" | "pending" | "changes_requested" | "approved" | "rejected" | "withdrawn";
type ClaimStatus = "pending" | "verified" | "rejected";

export type Database = {
  public: {
    Tables: {
      organizations: Table<CatalogBase & { legacy_id: string | null; canonical_id: string | null; slug: string; name: string; category: string; description: string; website: string | null; contact: JsonObject; socials: JsonObject; image_url: string | null; image_background_color: string | null; logo_r2_url: string | null; active_years: number[]; first_year: number | null; last_year: number | null; first_time: boolean; is_currently_active: boolean; total_projects: number; source_payload: OrganizationSourcePayload }>;
      organization_years: Table<{ organization_id: string; year: number; project_count: number; archive_url: string | null; source_payload: JsonObject }, Partial<{ organization_id: string; year: number; project_count: number; archive_url: string | null; source_payload: JsonObject }>, never, [Relationship<"organization_years_organization_id_fkey", ["organization_id"], "organizations", ["id"]>]>;
      projects: Table<CatalogBase & { external_id: string; legacy_id: string | null; organization_id: string; year: number; title: string; abstract_short: string | null; info_html: string | null; project_url: string | null; code_url: string | null; source_payload: JsonObject; source_created_at: string | null; source_updated_at: string | null }, Partial<CatalogBase & { external_id: string; legacy_id: string | null; organization_id: string; year: number; title: string; abstract_short: string | null; info_html: string | null; project_url: string | null; code_url: string | null; source_payload: JsonObject; source_created_at: string | null; source_updated_at: string | null }>, never, [Relationship<"projects_organization_id_fkey", ["organization_id"], "organizations", ["id"]>]>;
      project_contributors: Table<{ id: string; project_id: string; archived_name: string; archived_profile_url: string | null; ordinal: number; created_at: string }, Partial<{ id: string; project_id: string; archived_name: string; archived_profile_url: string | null; ordinal: number; created_at: string }>, never, [Relationship<"project_contributors_project_id_fkey", ["project_id"], "projects", ["id"]>]>;
      project_mentors: Table<{ project_id: string; name: string; ordinal: number }, Partial<{ project_id: string; name: string; ordinal: number }>, never, [Relationship<"project_mentors_project_id_fkey", ["project_id"], "projects", ["id"]>]>;
      technologies: Table<{ id: string; slug: string; name: string }>;
      topics: Table<{ id: string; slug: string; name: string }>;
      organization_technologies: Table<{ organization_id: string; technology_id: string }, Partial<{ organization_id: string; technology_id: string }>, never, [Relationship<"organization_technologies_organization_id_fkey", ["organization_id"], "organizations", ["id"]>, Relationship<"organization_technologies_technology_id_fkey", ["technology_id"], "technologies", ["id"]>]>;
      organization_topics: Table<{ organization_id: string; topic_id: string }, Partial<{ organization_id: string; topic_id: string }>, never, [Relationship<"organization_topics_organization_id_fkey", ["organization_id"], "organizations", ["id"]>, Relationship<"organization_topics_topic_id_fkey", ["topic_id"], "topics", ["id"]>]>;
      project_technologies: Table<{ project_id: string; technology_id: string }, Partial<{ project_id: string; technology_id: string }>, never, [Relationship<"project_technologies_project_id_fkey", ["project_id"], "projects", ["id"]>, Relationship<"project_technologies_technology_id_fkey", ["technology_id"], "technologies", ["id"]>]>;
      waitlist_entries: Table<{ id: string; email: string; interests: string[]; source: string; created_at: string; invited_at: string | null; converted_at: string | null }>;
      import_runs: Table<{ id: string; source: string; source_checksum: string | null; status: "running" | "completed" | "failed"; counts: Json; errors: Json; started_at: string; completed_at: string | null }>;
      profiles: Table<{ user_id: string; display_name: string; bio: string | null; google_avatar_url: string | null; avatar_r2_key: string | null; avatar_public: boolean; bio_public: boolean; status: "active" | "suspended" | "deleted"; created_at: string; updated_at: string }>;
      profile_links: Table<{ id: string; user_id: string; platform: string; label: string | null; url: string; is_public: boolean; position: number; created_at: string }, Partial<{ id: string; user_id: string; platform: string; label: string | null; url: string; is_public: boolean; position: number; created_at: string }>, never, [Relationship<"profile_links_user_id_fkey", ["user_id"], "profiles", ["user_id"]>]>;
      contributor_claims: Table<{ id: string; user_id: string; project_contributor_id: string; year: number; status: ClaimStatus; claimant_note: string | null; evidence_urls: string[]; verified_by: string | null; verified_at: string | null; rejection_reason: string | null; created_at: string; updated_at: string }, Partial<{ id: string; user_id: string; project_contributor_id: string; year: number; status: ClaimStatus; claimant_note: string | null; evidence_urls: string[]; verified_by: string | null; verified_at: string | null; rejection_reason: string | null; created_at: string; updated_at: string }>, never, [Relationship<"contributor_claims_project_contributor_id_fkey", ["project_contributor_id"], "project_contributors", ["id"]>]>;
      proposals: Table<{ id: string; claim_id: string; user_id: string; public_slug: string; status: ProposalStatus; current_file_id: string | null; license_code: "CC-BY-4.0" | null; license_version: string | null; license_accepted_at: string | null; submitted_at: string | null; reviewed_at: string | null; reviewed_by: string | null; moderator_reason: string | null; created_at: string; updated_at: string }, Partial<{ id: string; claim_id: string; user_id: string; public_slug: string; status: ProposalStatus; current_file_id: string | null; license_code: "CC-BY-4.0" | null; license_version: string | null; license_accepted_at: string | null; submitted_at: string | null; reviewed_at: string | null; reviewed_by: string | null; moderator_reason: string | null; created_at: string; updated_at: string }>, never, [Relationship<"proposals_claim_id_fkey", ["claim_id"], "contributor_claims", ["id"], true>, Relationship<"proposals_user_profile_fk", ["user_id"], "profiles", ["user_id"]>]>;
      proposal_files: Table<{ id: string; proposal_id: string; version: number; r2_key: string; original_filename: string; mime_type: "application/pdf"; byte_size: number; sha256: string; etag: string | null; validation_status: "quarantined" | "valid" | "invalid" | "superseded"; validation_error: string | null; created_at: string }, Partial<{ id: string; proposal_id: string; version: number; r2_key: string; original_filename: string; mime_type: "application/pdf"; byte_size: number; sha256: string; etag: string | null; validation_status: "quarantined" | "valid" | "invalid" | "superseded"; validation_error: string | null; created_at: string }>, never, [Relationship<"proposal_files_proposal_id_fkey", ["proposal_id"], "proposals", ["id"]>]>;
    };
    Views: {
      approved_proposals: { Row: { id: string; public_slug: string; year: number; project_external_id: string; project_title: string; abstract_short: string | null; organization_slug: string; organization_name: string; archived_contributor_name: string; pdf_byte_size: number; pdf_sha256: string; display_name: string; avatar_r2_key: string | null; bio: string | null; profile_links: Json; approved_at: string; license_code: "CC-BY-4.0" }; Relationships: [] };
      year_stats: { Row: { year: number; organizations: number; projects: number; contributors: number }; Relationships: [] };
    };
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      account_status: "active" | "suspended" | "deleted";
      claim_status: ClaimStatus;
      proposal_status: ProposalStatus;
      file_validation_status: "quarantined" | "valid" | "invalid" | "superseded";
    };
    CompositeTypes: Record<never, never>;
  };
};
