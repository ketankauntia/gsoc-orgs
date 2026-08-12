# API v2 and Proposal API

API v2 responses are either `{ "data": ..., "meta": ... }` or `{ "error": { "code": "...", "message": "...", "fields": ... } }`. Lists default to 20 records and cap requests at 100.

Public catalog routes: `/api/v2/organizations`, `/organizations/:slug`, `/projects`, `/projects/:externalId`, `/years`, `/years/:year/stats`, `/technologies`, and `/topics`.

Public proposal routes: `/api/v2/proposals`, `/proposals/:slug`, and `/proposals/:id/pdf`. Only approved, verified records appear. The PDF route redirects to a short-lived R2 URL.

Authenticated contributor routes live below `/api/v2/me`: profile GET/PATCH, avatar refresh, claims POST, proposal list/create/update/delete, upload URL/completion, submit, and authorized PDF reads.

Moderator routes live below `/api/v2/admin/proposals`. Decisions are `verify_claim`, `reject_claim`, `request_changes`, `approve`, `reject`, or `reopen`. Role reads and grant/revoke operations live at `/api/v2/admin/roles` and require an admin.

All `/api/v1` and unversioned public routes remain compatibility interfaces backed by Supabase. They have no Sunset header.
