# GSoC Search-Demand and Intent Map

This is a qualitative demand study verified **2026-08-12**. It does not claim monthly search volumes. The evidence comes from repeated query formulations, current result-page patterns, official FAQ/help headings, current community questions, and opportunities for original local-data analysis.

## Demand findings

- Future-year demand begins before official dates and organizations exist. GSoC 2027 discussions already ask when to start, which technology to learn, how to identify likely communities, and whether early contribution affects beginner status.
- Eligibility, stipend, preparation from zero, language choice, organization selection, mentor contact, proposal examples, selection odds, interviews, and workload are repeated anxieties.
- Users often collapse four different decisions: organization choice, project choice, proof through contributions, and proposal design. Those deserve separate canonical guides.
- “Beginner friendly,” “best,” and “low competition” appear frequently, but responsible content must replace unverifiable rankings with observable onboarding, activity, scope, and mentor-fit evidence.
- Technology matching is a real discovery job. Current results and competing tools surface Python, JavaScript, C++, Rust, machine learning, and other language-specific lists.
- Program-stage questions continue after acceptance: community bonding, weekly reports, evaluations, extensions, final work, payments, and resume language.
- The best content opportunity is not another generic “crack GSoC” list. It is a connected system of official-rule explanations, original dataset research, reusable artifacts, and direct paths into organization/project exploration.

## Evidence examples

Official sources expose durable query language through the [FAQ](https://developers.google.com/open-source/gsoc/faq), [timeline](https://developers.google.com/open-source/gsoc/timeline), [stipend documentation](https://developers.google.com/open-source/gsoc/help/student-stipends), [applicant advice](https://developers.google.com/open-source/gsoc/help/student-advice), and contributor/mentor guides.

Current community discussions show real questions about [GSoC 2027 preparation](https://www.reddit.com/r/gsoc_2027/comments/1u8us04/gsoc_2027/), [technology selection](https://www.reddit.com/r/gsoc_2027/comments/1t67mfu/which_tech_stack_shld_i_follow/), [finding a mentor](https://www.reddit.com/r/gsoc2025/comments/1unlkpw/how_to_get_a_mentor_for_gsoc/), and [balancing GSoC with an internship](https://www.reddit.com/r/gsoc_2027/comments/1vhdaxf/intern_and_gsoc/). Community material is demand evidence, not authority for program rules.

The official 2026 contributor announcement reported 15,245 applicants, 23,371 proposals, and 1,141 accepted contributors across 184 organizations. That produces two different descriptive ratios—about 7.5% of applicants and 4.9% of proposals. Neither is a personal “chance,” because people can submit multiple proposals, selection occurs within organizations/projects, mentor capacity varies, and global denominators conceal fit. Source: [2026 contributor announcement](https://opensource.googleblog.com/2026/04/the-journey-begins-meet-the-2026-gsoc-contributors.html).

## Intent families

| Family | Reader job | Examples | Best content form |
|---|---|---|---|
| Future year | Prepare without confusing estimates with announcements | GSoC 2027, timeline, organizations | Maintained hub with status and preparation plan |
| Fundamentals | Understand the program and whether it fits | what is GSoC, internship, online, paid | Plain-language process guide |
| Eligibility | Resolve formal and edge-case eligibility | age, graduate, professional, beginner | Current rule guide with decision tree |
| Application | Complete registration and proposal stages | deadline, apply, results | Current timeline/process map |
| Money/workload | Understand stipend, payments, time, taxes | stipend India, Payoneer, hours | Annual official table plus cautious explanation |
| Preparation | Build the right skills on a realistic schedule | roadmap, Git, DSA, three months | Diagnostic roadmap with milestones |
| Contribution | Enter a real community productively | first PR, good first issue, codebase | Repository workflow and examples |
| Organization discovery | Find and compare viable communities | org list, tech filters, new/returning | Interactive explorer plus evidence framework |
| Project discovery | Choose and scope a feasible idea | ideas list, own idea, project size | Project scorecard and scoping worksheet |
| Proposal/selection | Produce and understand an application | template, examples, interview, rate | Proposal hub, analyzed examples, selection explainer |
| Communication | Interact without wasting volunteer time | mentor email, no response, etiquette | Channel decision tree and message examples |
| Accepted contributor | Execute and finish responsibly | bonding, reports, evaluation, work product | Stage-specific operating guides |
| Technology | Match skills to current/historical evidence | Python orgs, C++ orgs, ML orgs | Original data analysis plus live filters |
| Named organization | Navigate one community's actual process | PSF, Apache, CERN, KDE | Maintained organization dossier only with first-party evidence |
| Ecosystem | Find alternatives or next steps | Outreachy, LFX, rejection, after GSoC | Comparisons based on official current rules |

## Canonical ownership and cannibalization

| Query family | Current or planned canonical | Merge rule |
|---|---|---|
| GSoC 2027, broad timeline, roadmap, preparation | `gsoc-2027-guide.md` | Refresh the hub when official details arrive; do not make generic duplicate year pages |
| GSoC organizations, list, orgs, historical participation | `gsoc-organizations-list.md` | New pages must add a distinct technology, category, named organization, or method |
| Best/beginner-friendly/low-competition organization choice | `how-to-choose-gsoc-organization.md` | Expand the evidence framework; never publish unsupported “easy org” rankings |
| General proposal writing/template/checklist | `how-to-write-gsoc-proposal.md` | Separate only selection, rejected proposals, or analyzed historical examples |
| Historical organization methodology | `how-to-use-gsoc-organizations-data.md` | Supporting data posts link here rather than repeat methodology |
| First contribution | Planned `how-to-start-open-source-for-gsoc.md` | Existing hub sections become summaries linking to the canonical workflow |
| Project choice and scope | Planned `how-to-choose-gsoc-project.md` | Keep distinct from choosing a community |
| Eligibility | Planned `gsoc-eligibility.md` | One evergreen rule page with annual verification; year queries redirect/link here unless rules materially diverge |
| Stipend | Planned `gsoc-stipend.md` | One annually refreshed table and explainer; country variants remain sections unless unique tax/legal treatment is commissioned |
| Selection odds | Planned `gsoc-acceptance-rate-selection-process.md` | Own global statistics and selection mechanics without personal probability claims |
| Technology-specific organizations | Planned cluster | Publish only when original current/historical data and language-specific guidance are available |
| Organization-specific guides | Research backlog | Require maintained first-party source coverage and distinct community workflow |

## Prioritization model

Score each proposed page from 0–3 on five dimensions:

1. **Demand evidence:** repeated official/community/Search Console query evidence.
2. **Task importance:** consequence of getting the answer wrong or failing to find it.
3. **Information gain:** strength of available original analysis or artifact.
4. **Product fit:** usefulness of internal organization/project/data routes.
5. **Maintainability:** ability to keep volatile facts accurate.

Subtract 0–3 for cannibalization risk and 0–3 for unsupported-claim risk. A high-volume-looking query is not publishable when it cannot clear the information-gain and truthfulness gates.

## Measurement plan

After publication, use Search Console rather than retrospective intuition:

- group variants with regular expressions;
- compare page and query impressions/clicks;
- identify high-impression, low-CTR pages;
- inspect unexpected queries for missing sections;
- compare equivalent seasonal windows;
- record whether multiple URLs appear for one intent;
- merge, redirect, or reposition cannibalizing pages;
- keep anonymized-query and data-truncation limitations visible in reports.

The detailed 150-item research backlog and subheading plans live in [`../strategy/150-post-roadmap.md`](../strategy/150-post-roadmap.md).
