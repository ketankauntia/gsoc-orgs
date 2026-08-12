# Public Repository Instructions

This is the public application repository. Keep implementation, tests, public-facing community files, and shipped product content here. Store all internal documentation and project context in the private sibling repository `../pvt-gsoc-orgs/`.

## Documentation boundary

- Do not create internal plans, architecture notes, database designs, audits, research, competitor analysis, roadmaps, handoffs, task logs, or project-context files in this repository.
- Read and update `../pvt-gsoc-orgs/PROJECT_CONTEXT.md` during a task whenever status, decisions, assumptions, risks, or next steps change, and update it again before completing the task.
- If context becomes large, create focused files under `../pvt-gsoc-orgs/docs/context/` and add a one-line purpose link to the private main context index.
- Public exceptions are `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, required community/governance files, shipped website content, and documentation deliberately released through the publication gate below.

## Publication gate

Publish documentation here only after the related major feature is implemented, verified, and ready for users or contributors. Before publication:

1. confirm the feature's code, migrations, tests, security controls, deployment, and rollback path are complete;
2. include only the minimum user-facing or contributor-facing instructions needed for the shipped feature;
3. perform a repository-boundary diff and privacy/security review; and
4. remove all internal strategy, unpublished roadmap details, private infrastructure information, research trails, local paths, credentials, vulnerability details, and personal or sensitive data.

Never publish proposal contents that are not approved for publication, private moderation or account information, contributor behavioral profiles, identity-linked analytics, private communications, or anything that could enable or imply surveillance of contributors. Analytics must be necessary, disclosed, privacy-minimized, and aggregated wherever possible.

## Commit hygiene

- Use ordinary project commit messages with a concise subject and bullet-point description when useful.
- Do not add Codex, Claude, AI-assisted, generated-by, co-author, or similar attribution/signature text.
- Stage only files belonging to the task and preserve unrelated work.

