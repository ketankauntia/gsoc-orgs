# GSoC Editorial System

This directory is the source of truth for researching, planning, writing, reviewing, and maintaining GSoC editorial content. Read this file, then follow the document route that matches the task.

Last research review: **2026-08-12**

## Quick navigation

| Task | Read |
|---|---|
| Understand the editorial strategy and safeguards | [`research/seo-content-playbook.md`](research/seo-content-playbook.md) |
| Verify a GSoC fact or find the primary source | [`research/gsoc-source-map.md`](research/gsoc-source-map.md) |
| Understand demonstrated query demand and its limitations | [`research/search-demand-map.md`](research/search-demand-map.md) |
| Select or scope a future article | [`strategy/150-post-roadmap.md`](strategy/150-post-roadmap.md) |
| Work on the current production batch | [`production/batch-01-briefs.md`](production/batch-01-briefs.md) |
| Plan, generate, store, and review editorial images | [`images/README.md`](images/README.md) |
| Apply image SEO, accessibility, brand, and performance rules | [`images/image-seo-playbook.md`](images/image-seo-playbook.md) |
| Format a Markdown post for this repository | [`../blog/content-format.md`](../blog/content-format.md) |

## Required workflow

```text
research demand
  -> assign one distinct user intent
  -> inspect existing canonical pages
  -> prepare source and claim ledger
  -> define information gain
  -> outline the reader's decisions
  -> draft and edit
  -> validate facts, links, parser, SEO and build
  -> publish
  -> measure in Search Console
  -> refresh, merge or retire when evidence changes
```

Do not reverse this workflow by drafting from a keyword list before intent, sources, and information gain are defined.

## Publication gate

An article is publishable only when every answer below is **yes**:

- Does it solve a distinct user job instead of restating an existing article?
- Is the primary query assigned to exactly one canonical URL?
- Does it add an original dataset result, method, framework, template, calculation, comparison, or first-party interpretation?
- Are all program rules, dates, payment figures, and statistics verified against current primary sources?
- Are annually changing facts labeled with a year and verification date?
- Does the opening answer the central question directly?
- Are the title, description, H1, headings, and body aligned without keyword stuffing?
- Are internal links useful, descriptive, and reciprocal within the topic cluster?
- Does the article comply with `docs/blog/content-format.md` and parse successfully?
- Are unsupported selection odds, guarantees, fake experience, invented quotes, and unverified superlatives absent?
- Has the draft been edited for repetition, factual ambiguity, and padding?

If any answer is no, merge the idea into a stronger page, keep it as a research brief, or leave it unpublished.

## Important strategic constraint

The 150-topic roadmap is a **research and prioritization backlog**, not an instruction to generate 150 pages. Google explicitly warns against making a separate page for every possible query variation. Synonyms such as “GSoC orgs,” “GSoC organizations,” and “GSoC organization list” generally belong to one canonical intent unless the reader task is materially different.

The project uses a 1,500-word minimum for the current long-form production batch because the owner requested it. Google does not prescribe a preferred word count. Never pad an article; broaden it with useful evidence or merge it when the subject cannot support a substantive treatment.

## Ownership and maintenance

- `AGENTS.md` provides repository-wide orientation and links here.
- This directory owns editorial policy, research notes, topic planning, and production briefs.
- `content/posts/` contains the published article source.
- Official Google GSoC pages outrank local derived data for program rules and current-year facts.
- Local snapshots may support original analysis only when the window, normalization, missing data, and calculation are stated.
- Update `updatedAt` only after a meaningful factual or structural revision.
