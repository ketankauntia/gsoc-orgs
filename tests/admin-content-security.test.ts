import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CHANGELOG_ENTRIES } from "../lib/changelog-data";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/202608180001_admin_imports_and_contributor_blogs.sql"), "utf8");
const mutationRoutes = [
  "app/api/v2/admin/proposal-imports/route.ts",
  "app/api/v2/admin/proposal-imports/[id]/upload-url/route.ts",
  "app/api/v2/admin/proposal-imports/[id]/upload-complete/route.ts",
  "app/api/v2/admin/contributor-blogs/route.ts",
  "app/api/v2/admin/contributor-blogs/[id]/route.ts",
].map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const adminApi = fs.readFileSync(path.join(root, "lib/admin-api.ts"), "utf8");

describe("administrator-curated content boundary", () => {
  it("re-checks admin authorization on every mutation route", () => {
    for (const route of mutationRoutes) {
      expect(route).toContain("authorizeAdminMutationApi(request)");
    }
    expect(adminApi).toContain("isTrustedMutationRequest(request)");
    expect(adminApi).toContain('roles.includes("admin")');
    expect(adminApi).toContain('consumeRateLimit("moderate_proposal")');
  });

  it("keeps raw curator tables deny-by-default and exports narrow public views", () => {
    for (const table of ["admin_proposal_imports", "admin_proposal_files", "contributor_blogs"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    expect(migration).toContain("revoke all on public.admin_proposal_imports, public.admin_proposal_files, public.contributor_blogs from anon, authenticated");
    expect(migration).toContain("grant select on public.approved_proposals, public.published_contributor_blogs to anon, authenticated");
    const publicProposalView = migration.slice(migration.indexOf("create or replace view public.approved_proposals"), migration.indexOf("comment on view public.approved_proposals"));
    expect(publicProposalView).not.toContain("permission_note");
    expect(publicProposalView).not.toContain("imported_by");
    const publicBlogView = migration.slice(migration.indexOf("create or replace view public.published_contributor_blogs"), migration.indexOf("comment on view public.published_contributor_blogs"));
    expect(publicBlogView).not.toContain("created_by");
  });

  it("requires service role plus an active admin for privileged database functions", () => {
    for (const functionName of ["create_admin_proposal_import", "create_contributor_blog", "unpublish_contributor_blog", "publish_admin_proposal_import"]) {
      const start = migration.indexOf(`function public.${functionName}`);
      expect(start).toBeGreaterThan(-1);
      const body = migration.slice(start, migration.indexOf("$$;", start));
      expect(body).toContain("auth.role()) <> 'service_role'");
      expect(body).toContain("ur.role = 'admin'");
      expect(body).toContain("prof.status = 'active'");
    }
  });
});

describe("release order", () => {
  it("shows the current release first and preserves descending release dates", () => {
    expect(CHANGELOG_ENTRIES.slice(0, 2).map((entry) => entry.version)).toEqual(["v1.5.3", "v1.5.2"]);
    expect(CHANGELOG_ENTRIES.every((entry, index) => index === 0 || CHANGELOG_ENTRIES[index - 1].timeStamp >= entry.timeStamp)).toBe(true);
  });
});
