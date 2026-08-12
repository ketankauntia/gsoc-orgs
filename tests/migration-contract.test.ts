import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/202608120001_proposal_library.sql"), "utf8");

describe("proposal database security contract", () => {
  it("serializes claim creation and enforces the official claim cap", () => {
    const rateLimit = migration.slice(migration.indexOf("create or replace function public.consume_rate_limit"), migration.indexOf("create or replace function public.create_contributor_claim"));
    const claim = migration.slice(migration.indexOf("create or replace function public.create_contributor_claim"), migration.indexOf("create or replace view public.approved_proposals"));
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("if active_claims >= 2");
    expect(migration).toContain("unique index contributor_claims_user_year_active_idx");
    expect(migration).toContain("p.year <= 2025");
    expect(claim).toContain("public.consume_rate_limit('create_claim')");
    expect(rateLimit).not.toContain("public.consume_rate_limit('create_claim')");
  });

  it("exposes approved proposals through an email-free projection", () => {
    const view = migration.slice(migration.indexOf("create or replace view public.approved_proposals"), migration.indexOf("comment on view public.approved_proposals"));
    expect(view).not.toMatch(/\bemail\b/i);
    expect(view).toContain("where pr.status = 'approved'");
    expect(view).toContain("cc.status = 'verified'");
  });

  it("enables RLS on every user-facing proposal table", () => {
    for (const table of ["profiles", "profile_links", "contributor_claims", "proposals", "proposal_files"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps file metadata and license acceptance behind service-role RPCs", () => {
    const attach = migration.slice(migration.indexOf("create or replace function public.attach_proposal_file"), migration.indexOf("create or replace function public.submit_my_proposal"));
    const submit = migration.slice(migration.indexOf("create or replace function public.submit_my_proposal"), migration.indexOf("create or replace function public.delete_my_draft"));
    expect(attach).toContain("auth.role() <> 'service_role'");
    expect(attach).toContain("proposal_row.user_id <> target_user_id");
    expect(submit).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain("grant execute on function public.attach_proposal_file(uuid, uuid, uuid, text, text, integer, text, text) to service_role");
    expect(migration).not.toContain("grant execute on function public.attach_proposal_file(uuid, uuid, uuid, text, text, integer, text, text) to authenticated");
    expect(migration).toContain("grant execute on function public.submit_my_proposal(uuid, uuid) to service_role");
  });

  it("makes profile replacement atomic and moderation auditable", () => {
    const profile = migration.slice(migration.indexOf("create or replace function public.update_my_profile"), migration.indexOf("create or replace function public.attach_proposal_file"));
    expect(profile).toContain("delete from public.profile_links");
    expect(profile).toContain("jsonb_to_recordset");
    expect(migration).toContain("Moderators cannot moderate their own proposal");
    expect(migration).toContain("insert into private.moderation_events");
    expect(migration).toContain("revoke all on all functions in schema private from public");
    expect(migration).toContain("grant select on public.profile_links to authenticated");
    expect(migration).not.toContain("grant select, insert, update, delete on public.profile_links to authenticated");
  });
});
