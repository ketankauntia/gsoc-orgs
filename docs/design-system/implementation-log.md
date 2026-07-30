# Implementation Log

## 2026-07-29 — kickoff

### Safety

- Original branch: `feat/v3-01` at `d0c3181`.
- Unknown staged, unstaged, and untracked work was preserved in
  `stash@{2026-07-29}: pre-cloudflare-revamp-2026-07-29`.
- Redesign branch: `feat/cloudflare-product-revamp`.
- The stash contains substantial blog/editor, avatar, content, accessibility,
  and asset work. Reconcile it deliberately after the redesign; do not drop it.

### Baseline

- Desktop homepage screenshot:
  `.scratch/gsoc-before-home.png` (workspace artifact, not committed)
- Mobile homepage screenshot:
  `.scratch/gsoc-before-home-mobile.png` (workspace artifact, not committed)
- Desktop organization explorer screenshot:
  `.scratch/gsoc-before-organizations.png` (workspace artifact, not committed)

Observed:

- The homepage hero loses its rotating word during capture and can render a
  clipped headline on mobile.
- The mobile homepage has horizontal overflow.
- The landing page uses large empty areas and passive screenshots before proving
  the dataset's value.
- Organization cards expose too many years and technologies for fast scanning.
- Several remote logos fail locally without a polished fallback.
- The public product and blog use separate shells and visual vocabularies.

### Data and trust findings

- Homepage snapshot: 522 organizations, 185 active organizations, 11,040 projects.
- Snapshot generated: 2026-02-19.
- Existing landing/about copy contains lower, stale hard-coded totals.
- AI is described in metadata as if it is live, but the current product only has
  a waitlist and external “ask AI” links.
- Hard-coded testimonials and “acceptance rate” language are not supported by the
  available data and must not be used as proof.
- “First-time” needs a visible definition tied to the recorded dataset.

### Reference decisions

Keep from Cloudflare:

- orange as a landmark;
- dark editorial shell plus light product surfaces;
- page rails and compact bordered modules;
- evidence immediately after the promise;
- mono data labels and restrained functional motion;
- responsive recomposition rather than desktop shrinking.

Do not copy:

- logos, wordmarks, proprietary fonts, icons, illustrations, copy;
- network globe, cloud, sunburst, or Connect spray graphics;
- Cloudflare token names or an affiliation-implying visual identity.

Original concept: an open-source atlas made from organization nodes, technology
tags, contribution paths, program-year coordinates, and commit-like metadata.

### Confirmed product issues to address

- Organization category links sometimes use `category`, while static filtering
  evaluates `categories`.
- Raw lowercased technology names can produce noncanonical detail URLs such as
  `c++` and `node.js`.
- The organization detail footer exposes a Search action with no behavior.
- `/projects` can advertise a year with no generated project dataset.
- The project-detail route contains mock data and nonfunctional actions.
- Homepage article cards are hard-coded and all point to `/blog`.
- Organization language “usage” can be a positional weighting presented with
  more precision than the source supports.
- `llms.txt` advertises markdown URLs whose documented rewrite is absent.

This file is append-only during the redesign. Add decisions, failed approaches,
verification results, and unresolved risks as work progresses.
