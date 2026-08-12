# SEO, Keyword Research, and Content Playbook

This playbook converts current Google guidance into an editorial workflow for the GSoC Organizations Guide. It was verified against primary Google documentation on **2026-08-12**.

## What SEO can and cannot do

SEO helps people and search systems discover, understand, and choose useful content. It does not create a right to be crawled, indexed, cited by an AI system, or ranked first. No word count, keyword density, schema type, publishing velocity, or checklist guarantees those outcomes.

Google says its systems prioritize helpful, reliable, people-first content and asks whether a page provides original information, substantial coverage, trustworthy sourcing, and more value than other results. Use SEO to expose that value—not to simulate it. See [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Keyword-research evidence ladder

Use multiple signals and record which ones support an idea.

| Strength | Signal | What it establishes | Limitation |
|---|---|---|---|
| 1 | Search Console queries and landing pages | This site already received impressions or clicks | Omits anonymized queries and truncates rows |
| 2 | Official GSoC FAQ/help headings | A recurring question important enough for the program to document | Does not expose search volume |
| 3 | Current search results, autocomplete, and related questions | Dominant wording and likely result intent | Personalized, volatile, and not volume data |
| 4 | Repeated independent community questions | Real confusion, vocabulary, and missing explanations | Audience bias and anecdotal frequency |
| 5 | Google Trends comparisons | Seasonality, geography, terminology, rising/related interest | Normalized 0–100 interest, not absolute volume |
| 6 | Keyword Planner | Related queries and advertising search estimates | Advertising tool; not an organic-ranking predictor |
| 7 | Repository/product analytics | What users try to filter, compare, or open | Product behavior is not identical to search demand |

Search Console is the best demand evidence after a page begins appearing. Inspect exact queries, pages, CTR, country, device, and equivalent seasonal periods. High-impression, low-CTR pages may need better intent alignment, titles, descriptions, or openings. Use the [Performance report query documentation](https://support.google.com/webmasters/answer/17011259?hl=en) and [common use cases](https://support.google.com/webmasters/answer/17010961?hl=en).

Google Trends can compare `GSoC`, `Google Summer of Code`, year variants, and organization-related terms, but its values are normalized relative interest. Record the geography, date window, search type, and whether the comparison used terms or topics. See [Trends data caveats](https://support.google.com/trends/answer/4365533?hl=en-uk), [comparison rules](https://support.google.com/trends/answer/4359550?hl=en), and [related searches](https://support.google.com/trends/answer/4355000?hl=en).

Do not publish invented monthly volume. If Search Console, Trends, or Keyword Planner exports are unavailable, label prioritization as qualitative and cite the signals used.

## Search-intent analysis

For every candidate query, inspect the task behind the wording:

- **Definition:** “what is GSoC?” needs a plain-language explanation and process map.
- **Rule verification:** “GSoC eligibility” needs current official criteria and edge cases.
- **Current status:** “GSoC 2027 organizations” needs an honest announcement state and official update source.
- **Decision:** “which GSoC organization should I choose?” needs a framework, not a fabricated ranking.
- **How-to:** “how to contact a GSoC mentor” needs examples, channel etiquette, and escalation rules.
- **List/explorer:** “GSoC organizations using Python” is best served by current filters plus a methodology explanation.
- **Calculation/comparison:** “GSoC acceptance rate” needs defined denominators and year-specific data.
- **Template/artifact:** “GSoC proposal timeline” needs a reusable structure with scope and risk checks.

One canonical page should own a cluster of near-identical phrasings. Create a separate page only when the reader must complete a materially different task.

## Information-gain requirement

Every indexable article needs at least one contribution beyond summarizing sources:

- original analysis of local GSoC snapshots;
- a reproducible calculation with inputs and caveats;
- a decision framework or scorecard;
- a fillable template, checklist, or worked example;
- a careful comparison of official rules and practical implications;
- verified organization-specific evidence;
- a maintained historical table with a stated methodology;
- attributable first-hand input from a contributor, mentor, or maintainer.

Google's July 2026 AI-search guidance recommends useful, reliable, **non-commodity** content and warns against making pages for every possible query variation. See [Succeeding in AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Claim and source workflow

Before drafting, prepare a claim ledger:

| Field | Requirement |
|---|---|
| Claim | One falsifiable statement, not a whole paragraph |
| Source URL | Prefer the page that directly establishes it |
| Source owner | Google GSoC, mentoring organization, repository, or other first party |
| Source date | Publication/update date when available |
| Access date | Date the writer verified it |
| Classification | Stable fact, annual fact, calculation, interpretation, or anecdote |
| Display rule | Whether the article must show a year, caveat, or methodology |

Use this source hierarchy:

1. Official Google Summer of Code program pages, rules, timelines, and announcements.
2. Official GSoC contributor/mentor guides.
3. The target organization's current ideas page, contributor guide, repository, and channels.
4. Validated repository snapshots with a documented transformation.
5. Research papers for broader analysis.
6. Community questions only as demand evidence or clearly labeled experience—not program rules.

Never turn a Reddit answer, YouTube claim, old blog, or search snippet into an official rule. Never invent first-hand experience.

## Article design

Each article should normally include:

- a concise answer-first opening;
- a TL;DR that can stand alone;
- three to five useful key takeaways;
- descriptive H2s organized around reader decisions;
- a comparison table, process, example, or checklist when it reduces ambiguity;
- visible citations placed next to the claims they support;
- internal links that help complete adjacent tasks;
- FAQs only for useful questions not already answered clearly in the body;
- a final action checklist or next step.

Use one visible H1 from frontmatter. Body sections begin with `##`. Keep sections independently understandable and split them when they become difficult to scan.

### Length

Google explicitly says it has no preferred word count and no ideal page length. A page should be complete enough to solve the task and no longer. The current 1,500-word threshold is a project requirement for the first production batch, not an SEO fact. If a topic requires padding, merge or reframe it.

### Titles

Write a unique, concise, descriptive title aligned with the visible H1 and the actual page. Avoid boilerplate, keyword lists, repeated synonyms, unsupported dates, and clickbait. Google has no official character limit; the repository's 30–60 target is a preview heuristic. Review [title-link guidance](https://developers.google.com/search/docs/appearance/title-link).

### Meta descriptions

Write one or two natural sentences that summarize the page and name its distinctive value. Do not list keyword variants. Google has no official fixed description length and may generate a snippet from visible content; the repository's 120–160 target is an editing heuristic. Review [snippet guidance](https://developers.google.com/search/docs/appearance/snippet).

### Links

Use crawlable links and descriptive anchors. Link when the destination advances the reader's current task, not to meet a quota. Link cluster hubs to supporting articles and supporting articles back to the hub. Review [Google's link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

### Images and diagrams

Add an original visual only when it makes a relationship easier to understand: a process, timeline, decision tree, comparison, or original chart. Use descriptive alt text and a real caption. Decorative images are not information gain.

## Structured data and FAQs

The blog system emits article and breadcrumb structured data. Markup must match visible content, use truthful publication/modification dates, and name the real author or responsible organization. Correct markup provides eligibility, not guaranteed display or ranking. Review [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) and [general policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Google stopped showing FAQ rich results and removed the feature documentation on May 7, 2026. Keep FAQs when they improve the reader experience or answer natural follow-ups; do not produce them for a promised rich result. Track material changes through [Google Search documentation updates](https://developers.google.com/search/updates).

## Freshness policy

Freshness is factual maintenance, not date manipulation.

- Update year-specific dates, rules, stipend tables, organization status, and statistics when official sources change.
- Change `updatedAt`, visible dates, structured `dateModified`, and sitemap `lastmod` only after a meaningful revision.
- Keep the visible date, metadata, schema, feed, and sitemap consistent.
- Never future-date content or bump dates without substantive work.
- Use “not announced as of DATE” for unavailable future-year facts.
- Add year labels to volatile figures rather than presenting them as permanent rules.

See Google's [ranking systems guide](https://developers.google.com/search/docs/appearance/ranking-systems-guide), [byline date guidance](https://developers.google.com/search/docs/appearance/publication-dates), and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## AI-assisted writing policy

AI may help discover questions, compare sources, analyze local data, structure a draft, and edit prose. Editorial ownership remains mandatory.

- Verify every factual claim against its cited source.
- Do not manufacture use, interviews, quotations, opinions, statistics, or tests.
- Do not scrape and lightly rewrite competing content.
- Require an original contribution before indexing.
- Review metadata, schema, links, dates, captions, and alt text as carefully as body prose.
- Disclose material automation when that context helps readers understand how an analysis was produced.

Google permits useful AI assistance but treats low-value mass production as scaled-content abuse regardless of whether humans, AI, or both created it. Review [generative-AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Pre-publication review

- [ ] Search intent and canonical URL are unique.
- [ ] SERP type and competing answers were inspected recently.
- [ ] At least one information-gain artifact is present.
- [ ] Claim ledger is complete and primary-source led.
- [ ] Annual facts show their year and verification date.
- [ ] Opening and TL;DR answer the main question.
- [ ] Title and description are descriptive rather than keyword lists.
- [ ] H2s form a coherent decision or process path.
- [ ] Internal links have descriptive anchors and no missing targets.
- [ ] External citations directly support nearby claims.
- [ ] No selection guarantee, fake acceptance odds, or misleading affiliation exists.
- [ ] No copied wording, invented experience, or repetitive padding remains.
- [ ] Markdown frontmatter and body comply with the repository format.
- [ ] Parser, SEO audit, lint, type-check, and build pass as applicable.

## Post-publication measurement

Record the publication date and annotate major changes. Review at 28, 90, and 180 days where data exists:

- indexation and canonical status;
- impressions and clicks;
- queries and query families;
- CTR by page, country, and device;
- internal click-through to organization/project resources;
- engagement or task completion;
- backlinks and citations;
- factual freshness and broken sources.

Use the results to expand the useful section, improve intent alignment, merge overlap, or retire a weak page. Do not interpret one ranking fluctuation as proof of a tactic.
