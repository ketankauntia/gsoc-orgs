---
title: GSoC 2026 Final Work Product and Evaluation Checklist
description: A source-backed checklist for packaging your GSoC 2026 work product, completing the final evaluation, and giving mentors evidence they can verify.
category: GSoC Guides
tags: [gsoc 2026, final submission, evaluations, work product]
publishedAt: 2026-07-27
updatedAt: 2026-07-21
author: gsoc-orgs-team
featured: true
draft: true
cornerstone: false
coverTone: primary
images:
  - id: final-submission-hero
    kind: hero
    purpose: Show the final work product as a verifiable evidence package, not a ceremonial submission.
    filename: final-submission-evidence-map.webp
    placement: hero
    prompt: >-
      Premium editorial information-design illustration for an open-source engineering guide. A single structured final work-product dossier at the center, connected to five precise abstract artifacts representing source code, automated tests, documentation, merge status, and remaining work. Deep navy and muted indigo on warm off-white, restrained teal and coral accents, thin crisp lines, generous negative space, subtle grid texture, balanced asymmetrical composition, no people, no logos, no words, no random code, no 3D cartoon style, no glowing effects. 1200 by 630.
    status: brief
    alt: Final work-product dossier connected to code, tests, documentation, merge status, and remaining work.
    caption: A complete final submission connects every project claim to evidence a mentor can verify.
    width: 1200
    height: 630
  - id: final-work-product-structure
    kind: diagram
    purpose: Give contributors a scannable structure for their final work-product page.
    filename: final-work-product-structure.svg
    placement: after-section:build-one-stable-work-product-page
    prompt: >-
      Create a clean 1600 by 900 SVG information diagram titled Final work product. Connect the center node to Goals and status, Merged work, Unmerged work, Validation, and Remaining work. Add a footer strip with Stable public link and Mentor can verify without guessing. Use deep navy, muted indigo, teal, warm off-white, and one restrained coral accent. Use crisp geometry, generous spacing, accessible contrast, and manually proofread labels. No icons without meaning, gradients, shadows, logos, people, or decorative clutter.
    status: brief
    alt: Diagram showing the sections of a verifiable GSoC final work-product page.
    caption: A stable final page should separate status, shipped work, unmerged work, validation, and remaining work.
    width: 1600
    height: 900
keyphrase: gsoc 2026 final work product
tldr: For a standard GSoC 2026 project, submit your final work product and final evaluation between August 17 and August 24 at 18:00 UTC. Your work link should let a reviewer identify what you completed, what was merged, what remains unmerged, and what is left to do without reconstructing the project from scattered chats and pull requests.
keyTakeaways:
  - Confirm your personal deadline in the GSoC web app because extended projects follow a different schedule.
  - Publish one stable work-product page that maps goals to deliverables, code, tests, documentation, and remaining work.
  - Separate merged, submitted, and unfinished work so your mentor can verify the result quickly.
  - Complete the final evaluation and test every public link before the deadline.
  - Keep a private evidence archive even after the public submission is complete.
faqs:
  - q: What is the GSoC 2026 final submission deadline?
    a: For the standard coding period, contributors submit the final work product and final evaluation from August 17 through August 24 at 18:00 UTC. Extended projects can run later, with November 2 at 18:00 UTC as the final contributor deadline. Confirm the deadline shown in your GSoC web app.
  - q: What should the final work product link contain?
    a: It should clearly describe the work completed during GSoC, what was merged, what remains unmerged, and what is still left to do. Link directly to code, pull requests, tests, documentation, demos, and reports where relevant.
  - q: Does all GSoC code need to be merged before final evaluation?
    a: The official guide explicitly asks contributors to identify both merged and unmerged work. Your organization and mentor decide how the work is evaluated, so make the status of every deliverable unambiguous and discuss unmerged work before submission week.
  - q: Is the final evaluation optional?
    a: No. The official contributor guide says the final evaluation, including the work-product link, is required. Missing it results in failing the program.
---

The last week of Google Summer of Code is not the right time to discover that your work is spread across an inaccessible fork, an expired demo, a private document, and twelve pull requests with unclear status. A strong final submission is a small, durable evidence package. It tells a reviewer what you promised, what you delivered, where the work lives, how it was validated, and what remains.

This checklist is for GSoC contributors in the 2026 program. It is not a replacement for instructions from your mentoring organization or the deadline shown in your GSoC account. Treat those as the controlling requirements. Use this guide to make the work easy to inspect.

## Know Which 2026 Deadline Applies to You

The [official GSoC 2026 timeline](https://developers.google.com/open-source/gsoc/timeline) separates the standard coding period from extended projects.

| Milestone | Official 2026 timing | What it means for you |
| --- | --- | --- |
| Standard final submission window | August 17 to August 24, 18:00 UTC | Contributors submit the final work product and final mentor evaluation. |
| Standard mentor evaluation window | August 24 to August 31, 18:00 UTC | Mentors verify the work and submit the final contributor evaluation. |
| Extended project work period | August 24 to November 2 | Approved extended projects continue coding. |
| Final extended-project contributor deadline | November 2, 18:00 UTC | Last date for all contributors to submit the final work product and evaluation. |
| Final extended-project mentor deadline | November 9, 18:00 UTC | Last date for mentors to evaluate extended projects. |

Do not infer your deadline from another contributor's calendar. Project lengths can vary, and an extension must be agreed with the organization. Open the GSoC web app, record the exact deadline displayed for your project, include the UTC timezone, and convert it to your local time. Then plan to finish at least 48 hours earlier.

That buffer is not ceremonial. It protects you from account problems, broken links, PDF export failures, repository permissions, Internet outages, and last-minute mentor feedback. A hard deadline is a poor place to test whether your evidence is public.

## Understand What Google Asks You to Submit

The [official contributor evaluation guide](https://google.github.io/gsocguides/student/evaluations) says the final evaluation includes a link to the work created during the current GSoC participation. The target of that link should briefly explain:

- what work was done;
- what code was merged;
- what code was not merged; and
- what is left to do.

The same guide says the final evaluation is required. If you do not complete it and provide the work-product link, you fail the program. Google's [2026 evaluation questions](https://developers.google.com/open-source/gsoc/help/evaluations) also ask mentors to verify that the uploaded link clearly points to the contributor's work and that someone viewing it can tell it was completed for GSoC.

This creates a practical standard: your submission should be understandable to someone who did not follow every weekly meeting. It should not force the reviewer to search your username across a repository and guess which commits belong to the project.

## Build One Stable Work-Product Page

Create one public page as the front door to your evidence. The exact location depends on your organization's practice. It might be:

- a final report in the organization's documentation;
- a Markdown file in the project repository;
- a project wiki page;
- a public blog post;
- a dedicated page on a stable personal site; or
- another public location approved by your mentor.

Ask your mentor where the organization wants it. Prefer a URL the community controls or expects to preserve. If the primary page is in your personal repository, avoid renaming the repository or changing its visibility after submission.

Your page should have a descriptive title such as `GSoC 2026 Final Work Product: Project Name for Organization Name`. Put your name, organization, project title, project period, and the date near the top. State that the page describes work completed as a GSoC 2026 contributor. This prevents the page from looking like an unlabeled collection of links.

## Use a Goal-to-Evidence Table

A concise table exposes both progress and gaps. Use one row per promised deliverable.

| Proposal goal | Final status | Evidence | Validation | Notes |
| --- | --- | --- | --- | --- |
| Implement feature A | Merged | Pull request and commit links | Unit and integration tests | Released in version X if applicable |
| Add migration path | Submitted, not merged | Pull request link | Test log and sample migration | Waiting for maintainer review |
| Write user guide | Complete | Documentation link | Docs build and reviewer approval | Published on project site |
| Optional benchmark | Not completed | Planning issue | Not applicable | De-scoped with mentor on date |

Use status words consistently:

- **Merged** means the work is in the organization's target branch.
- **Submitted** means there is a reviewable patch or pull request, but it has not been merged.
- **Complete outside the main repository** means the artifact exists in its intended location, such as documentation or a dataset.
- **Partially complete** means a usable portion exists, with the missing portion named.
- **De-scoped** means you and your mentor intentionally removed it from the expected scope.
- **Not completed** means it remains undone.

Do not turn every row green by changing definitions after the fact. An accurate partial result is more credible than a vague claim of completion.

## Inventory the Code Before You Write the Report

Start from repository evidence, not memory. Make a private inventory of:

- merged pull requests;
- open pull requests;
- closed or superseded pull requests;
- relevant commits that were not submitted through a pull request;
- design documents and issue discussions;
- tests added or changed;
- documentation pages;
- release notes or changelog entries;
- demos, screenshots, recordings, benchmarks, or datasets; and
- known bugs, limitations, and follow-up issues.

Check attribution. If a pull request contains commits from mentors or other contributors, describe your part instead of claiming the entire change. If the project involved pair programming, co-authored design, or a pre-existing branch, say so. The aim is not to maximize the number of links. It is to make your contribution boundary clear.

If your work spans several repositories, group links by repository and explain why each one matters. If it lives on a long-running shared branch, link to a comparison or commit range that isolates your changes. The contributor guide notes that a diff or even a branch may be appropriate depending on the project.

## Show Validation, Not Just Activity

A list of commits proves that files changed. It does not prove the result works. Pair each main deliverable with the strongest available validation:

- automated test results;
- a reproducible command and expected output;
- before-and-after behavior;
- performance measurements with hardware and method stated;
- screenshots for a visual change;
- a short demo recording;
- documentation build output;
- review or approval from the responsible maintainer; or
- a release containing the work.

Avoid screenshots of terminal text when a durable text log or CI run is available. Avoid a demo that only works on your machine without setup instructions. If a benchmark improved, include the baseline, final result, dataset, environment, number of runs, and measurement method. A percentage without those details is not useful evidence.

Document negative results too. A failed experiment can be legitimate project work when it answered an important technical question. Explain the hypothesis, method, result, and resulting decision. Do not present exploratory work as a shipped feature.

## Explain Merged and Unmerged Work Separately

Unmerged code is not automatically failed work. Reviews can outlast the coding period, maintainers may request architectural changes, and a dependency may block integration. However, an unlabeled open pull request creates uncertainty.

For each unmerged change, record:

1. the pull request or patch URL;
2. its current review state;
3. what remains before it can merge;
4. whether the branch is current with the target branch;
5. whether tests pass;
6. who is expected to act next; and
7. the follow-up plan agreed with your mentor.

Tell your mentor about this list before the final window. Your final report should confirm an existing shared understanding, not reveal project status for the first time.

## Write the Remaining-Work Section Honestly

"Future work" should be specific enough for another contributor to continue. Split it into three groups:

- **Required follow-up:** work needed to merge, release, migrate, or make the result safe.
- **Known limitations:** cases the current implementation does not support.
- **Optional extensions:** useful ideas that were never required for project completion.

Link to issues when possible. Include reproduction steps for known defects. If a task was removed from scope, state when and why it changed, and link to the relevant discussion if it is public.

This section protects the community from treating a prototype as production-ready. It also protects you from being evaluated against optional ideas that were never part of the final agreement.

## Include a Short Project Narrative

After the evidence table, explain the project in plain language:

- What problem did the project address?
- Who benefits from the result?
- What was the starting state?
- What are the most important technical decisions?
- What changed from the original proposal, and why?
- What did you learn that will help future maintainers?

Keep this separate from a week-by-week diary. A chronological log can be linked as supporting evidence, but the final page should synthesize the work. Reviewers need the result and reasoning, not a transcript of activity.

## Run the 48-Hour Submission Check

Two days before your deadline, perform this check with a signed-out browser or private window:

- [ ] The work-product page opens without requesting access.
- [ ] Every repository, pull request, document, demo, and test link opens.
- [ ] The page identifies you, the organization, the project, and GSoC 2026.
- [ ] Proposal goals map to final statuses.
- [ ] Merged and unmerged work are clearly separated.
- [ ] Remaining work and known limitations are named.
- [ ] Third-party and mentor contributions are attributed correctly.
- [ ] Test or validation evidence accompanies the main deliverables.
- [ ] The page works on a phone and does not depend on local files.
- [ ] Your mentor has reviewed the link or confirmed the expected format.
- [ ] You know the exact submission path in the GSoC web app.
- [ ] You have saved a private copy of the report and evidence inventory.

If your organization requests a PDF, generate and inspect it now. Check page breaks, code wrapping, URLs, and image legibility. The official proposal guide requires a PDF during application, but final work-product formats are organization-dependent, so do not assume a PDF alone is sufficient for the final link.

## Complete the Evaluation Deliberately

The evaluation is more than a link field. Google's published questions cover communication, mentor interaction, project scope, total hours, community involvement, and AI use. Set aside uninterrupted time and answer accurately. The contributor guide estimates 10 to 15 minutes, but preparing a careful response may take longer.

Do not wait for your mentor's evaluation window. Contributor and mentor actions have separate deadlines. Submit your own final evaluation, capture confirmation, and tell your mentor it is complete.

If the web app behaves unexpectedly, take a screenshot with the time and immediately use the official support path. Do not rely on an unsent draft or assume a failed request was recorded.

## Keep an Evidence Archive After Submission

Your public work-product page should be concise. Your private archive can be more complete. Save:

- the final submitted text;
- submission confirmation;
- a PDF or static copy of the public report;
- commit hashes and pull request URLs;
- test logs and benchmark inputs;
- important mentor approvals or scope decisions;
- release or deployment evidence; and
- a list of links that depend on third-party services.

This archive helps if a link later breaks, a repository moves, or you need to explain the project accurately in a portfolio. It also makes a future handoff easier.

## Use Accurate Portfolio Language

Passing GSoC does not make you a Google intern or employee. The [official FAQ](https://developers.google.com/open-source/gsoc/faq) says participants are independent developers receiving a stipend and are not employees or interns of Google or the mentoring organization. After successful completion, describe yourself as a Google Summer of Code 2026 contributor with the organization, subject to any preferred wording from that organization. The [complete GSoC explainer](/blog/post/what-is-gsoc) covers the program relationship and terminology in more detail.

Your final report can support that description with real evidence. Lead with the problem and impact, then link the work. Avoid inflated claims such as "built the entire platform" when the repository history shows a narrower contribution.

## Final Submission Template

Use this outline as a starting point, then follow your organization's required format:

1. Project title, contributor, organization, mentors, and project period
2. One-paragraph project summary
3. Original goals and final status table
4. Major deliverables with code and documentation links
5. Test, demo, benchmark, or release evidence
6. Merged work
7. Submitted but unmerged work
8. Scope changes and decisions
9. Known limitations and remaining work
10. How to build, test, or reproduce the result
11. Acknowledgements and contribution attribution
12. Stable links to the proposal, weekly reports, and relevant community pages

The best submission is not the longest one. It is the one a mentor can verify without guessing.

## Sources and Freshness

This guide was checked on July 21, 2026 against the [official 2026 timeline](https://developers.google.com/open-source/gsoc/timeline), the [official contributor evaluation guide](https://google.github.io/gsocguides/student/evaluations), the [published 2026 evaluation questions](https://developers.google.com/open-source/gsoc/help/evaluations), and the [GSoC FAQ](https://developers.google.com/open-source/gsoc/faq). Google or your mentoring organization may update instructions. Confirm the web app and organization guidance before submitting.
