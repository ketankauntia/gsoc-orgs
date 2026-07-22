---
title: "GSoC Proposal Template: Structure and Review Checklist"
description: Build an original GSoC proposal with a practical template for the problem, technical approach, deliverables, milestones, risks, tests, and community benefit.
category: Proposal Guides
tags: [gsoc proposal, proposal template, project planning, open source]
publishedAt: 2026-08-10
updatedAt: 2026-07-21
author: gsoc-orgs-team
draft: true
cornerstone: true
coverTone: primary
images:
  - id: proposal-blueprint-hero
    kind: hero
    purpose: Show a proposal as an evidence-backed engineering plan rather than a generic essay.
    filename: proposal-blueprint.webp
    placement: hero
    prompt: >-
      Premium editorial blueprint illustration for a technical open-source proposal. A modular plan assembled from connected sections, strong foundation blocks leading to technical architecture, deliverables, validation checks, risks, and milestones. Deep navy blueprint lines on warm off-white rather than bright blue, muted indigo and teal modules, restrained coral risk markers, crisp flat vector geometry, generous space, no readable words, no people, no clipboards, no light bulbs, no logos, no fake code. 1200 by 630.
    status: brief
    alt: Modular GSoC proposal blueprint connecting evidence, technical work, validation, risks, and milestones.
    caption: A strong proposal connects the problem, approach, deliverables, validation, risks, and schedule.
    width: 1200
    height: 630
  - id: proposal-evidence-chain
    kind: diagram
    purpose: Show how proposal claims become reviewable milestone exit conditions.
    filename: proposal-evidence-chain.svg
    placement: after-section:turn-deliverables-into-acceptance-criteria
    prompt: >-
      Create a clean 1600 by 900 SVG evidence chain with these exact connected stages: Problem evidence, Technical approach, Deliverables, Acceptance criteria, Tests and docs, Milestone exit condition. Add supporting inputs below: Related work, Risks, Experience, Outside commitments. Use deep navy, muted indigo, teal, warm off-white, and restrained coral for risk inputs. Use crisp flat geometry, accessible contrast, manually proofread labels, generous spacing, and no people, clipboards, logos, fake code, gradients, or decorative icons.
    status: brief
    alt: Proposal evidence chain from problem evidence to a measurable milestone exit condition.
    caption: Each proposal deliverable should end in evidence that reviewers can observe and verify.
    width: 1600
    height: 900
keyphrase: gsoc proposal template
tldr: A strong GSoC proposal follows the organization's required format and shows evidence that you understand its problem, codebase, community, and constraints. Use this template as a planning scaffold, replace every prompt with original project-specific evidence, and submit early enough to receive mentor feedback.
keyTakeaways:
  - The organization's template, contributor guidance, and AI policy override every generic proposal template.
  - Define the problem and community benefit before listing features.
  - Map each required deliverable to acceptance criteria, tests, documentation, risks, and a milestone.
  - Make outside commitments, dependencies, and cut-scope options visible.
  - Submit through the official GSoC web app before the hard deadline and verify the final PDF.
faqs:
  - q: What sections should a GSoC proposal include?
    a: A useful baseline includes contact information, title, synopsis, community benefit, current state, technical approach, deliverables, milestones, tests, documentation, risks, related work, relevant experience, communication plan, and outside commitments. Follow the organization's required structure if it differs.
  - q: How long should a GSoC proposal be?
    a: There is no universal ideal length. Organizations may set limits. Use enough detail to make scope and feasibility reviewable without padding, and obey the organization's format.
  - q: Can I use this template as my final proposal?
    a: Use it as a private scaffold. Remove instructions and write original, organization-specific content. A proposal that reads like an unedited generic template does not demonstrate codebase understanding.
  - q: Can AI write my GSoC proposal?
    a: Check the organization's policy first. Google warns that some organizations automatically reject AI-generated proposal material. Your submission must follow the policy and represent understanding you can personally explain.
  - q: How many GSoC proposals can I submit?
    a: Google currently permits up to three proposals, but only one can be accepted. Prioritize the number you can research and discuss properly.
---

A GSoC proposal is a technical and community plan, not an essay about enthusiasm. Reviewers need to decide whether the project is valuable, whether the scope can be completed, whether the approach fits the codebase, and whether you can collaborate with the community for the full project period.

The template below helps you produce that evidence. It is intentionally full of prompts rather than reusable claims. Do not submit the prompts, copy another contributor's prose, or fill sections with generic text. Start with your organization's instructions, then use only the parts of this scaffold that improve the required format.

## Rule Zero: The Organization's Instructions Win

The [official GSoC proposal guide](https://google.github.io/gsocguides/student/writing-a-proposal) says most organizations have their own guidelines or templates and applicants should follow them carefully. Organizations may also specify:

- a page or word limit;
- required headings;
- a qualification task;
- a specific ideas-list format;
- a public discussion before submission;
- a separate application form;
- required availability details;
- restrictions or disclosure rules for AI use; and
- a deadline earlier than Google's deadline for internal review.

Create an organization-compliance checklist before writing. Copy each requirement with its source URL and mark where your proposal satisfies it. If the organization says not to include a section from this article, remove it.

Google's guide says the proposal must be uploaded as a PDF in the GSoC web app. It also recommends submitting early because mentors can request changes before the deadline, and it states that proposal deadlines receive no extensions.

## Before the Template: Gather Evidence

Do not open a blank document until you can fill this research sheet:

| Question | Evidence you should have |
| --- | --- |
| What problem exists? | Issue, roadmap, ideas-page entry, user report, or maintainer discussion |
| Why does it matter now? | Current limitation, maintenance cost, user impact, or project priority |
| Where does the change live? | Repositories, modules, services, data formats, and documentation areas |
| What already exists? | Related implementations, open pull requests, prior attempts, and dependencies |
| Who can guide it? | Public mentor or maintainer contact path confirmed through the organization |
| Can you work in the codebase? | Setup result, tests run, contribution, experiment, or design discussion |
| What is the smallest complete outcome? | Required deliverables with observable acceptance criteria |
| What could block it? | Technical, review, data, dependency, legal, hardware, or scheduling risks |

If half the cells are empty, you probably need more organization research. Use the [organization selection workflow](/blog/post/how-to-use-gsoc-organizations-data) before investing in a polished PDF.

## Copyable GSoC Proposal Template

Copy this into a private Markdown document. Replace every bracketed prompt and delete all instructions before submission.

```markdown
Project title: [Short project title]

## Applicant and contact information

- Name: [preferred and full name as required]
- Email: [reliable address]
- Timezone: [UTC offset]
- Public profiles: [GitHub, GitLab, portfolio, or other relevant links]
- Preferred community handle: [handle]

## Project synopsis

[In 100 to 200 words, state the current problem, proposed result, primary users,
and what will be observably better when the project is complete.]

## Community benefit

[Explain who benefits, how the result supports the organization's goals, and why
this work is worth maintaining. Link the relevant issue, roadmap, or discussion.]

## Current state and related work

[Describe the current architecture or workflow. Identify existing implementations,
prior attempts, open pull requests, dependencies, and work this proposal will reuse.]

## Proposed technical approach

[Explain components, data flow, interfaces, important design choices, alternatives
considered, and the reason for the selected approach. Label open questions.]

## Deliverables and acceptance criteria

### Required deliverable 1: [name]

- Outcome: [observable result]
- Code areas: [repository and modules]
- Acceptance criteria: [specific pass conditions]
- Tests: [unit, integration, system, performance, accessibility, or other checks]
- Documentation: [user, developer, API, migration, or release documentation]
- Dependencies: [people, APIs, designs, data, or upstream changes]

### Required deliverable 2: [repeat structure]

### Optional deliverables

[List stretch goals separately. State the condition under which each begins.]

## Milestones and schedule

### Community bonding
[Setup, architecture study, final design decisions, baseline measurements,
communication cadence, and milestone review.]

### Milestone 1: [dates or project weeks]
- Work:
- Reviewable artifact:
- Validation:
- Exit condition:

### Milestone 2: [repeat]

### Finalization
[Integration, regression testing, documentation, release or handoff, final report,
and buffer for review.]

## Risks and fallback plan

| Risk | Early warning | Prevention | Fallback or scope cut |
| --- | --- | --- | --- |
| [risk] | [signal] | [action] | [decision] |

## Testing and quality plan

[State how correctness, compatibility, performance, security, accessibility,
documentation, and regression risk will be evaluated where relevant.]

## Communication and reporting

[Name the organization's channels, expected update cadence, meeting constraints,
and how decisions or blockers will be documented publicly.]

## Relevant experience and preparation

[Provide concise evidence for the required skills. Link contributions, experiments,
design notes, projects, or coursework. State limitations honestly.]

## Outside commitments and availability

[List classes, exams, work, travel, planned leave, and weekly availability.
Explain any schedule adjustments discussed with mentors.]

## Contributions and discussion so far

[Link relevant issues, pull requests, setup notes, prototypes, and public project
discussion. Explain what you learned from feedback.]

## References

[Link primary project documentation, issues, design material, and official guidance.]
```

The template is a coverage tool. It is not a required GSoC format and should not override organization rules.

## How to Write the Synopsis

The synopsis lets a reviewer understand the proposal before reading the implementation detail. It should answer four questions:

1. What is the current problem?
2. Who experiences it?
3. What will you build or change?
4. What measurable or observable result will exist?

Avoid opening with your biography, praise for Google, or a broad history of open source. Avoid claiming a result such as "ten times faster" unless you have a reproducible baseline and a credible method.

A useful internal test is whether a maintainer can disagree with the synopsis precisely. If the text is so broad that nobody could challenge its scope, it is not specific enough.

## Explain Community Benefit Without Marketing Copy

Google's guide asks applicants to show benefit to the organization and open-source community, not only personal benefit. Connect the work to actual users and maintenance.

Weak benefit statements say the feature will make the project "better, faster, and easier." Stronger evidence identifies:

- a blocked user workflow;
- repeated maintainer effort;
- missing platform or format support;
- an accessibility barrier;
- a security or reliability gap;
- a documented roadmap item;
- a performance limit measured with a stated method; or
- a contributor-experience problem visible in current setup reports.

Do not invent user demand. Link a source or label the statement as a hypothesis that will be validated during the project.

## Make the Technical Approach Reviewable

A feature list says what you hope to ship. A technical approach shows you have studied how it could fit.

Include the relevant system boundary:

- components you will modify;
- new interfaces or schemas;
- data flow and state transitions;
- compatibility constraints;
- dependencies and upstream coordination;
- migration or rollout needs;
- alternatives considered; and
- unresolved decisions that require mentor input.

The level of detail should match what you can know before acceptance. Do not pretend every design choice is settled if maintainers have not reviewed it. Label assumptions and propose the investigation that will resolve them.

Small diagrams can help when a change crosses several components. A decorative architecture image cannot replace an explanation.

## Turn Deliverables Into Acceptance Criteria

"Implement feature X" is not a complete deliverable. A reviewer needs to know what counts as done.

For each required deliverable, define:

- user-visible or maintainer-visible outcome;
- code or documentation location;
- supported cases;
- deliberately unsupported cases;
- tests and validation;
- reviewable intermediate artifact; and
- documentation or handoff.

Example structure:

| Deliverable | Weak wording | Reviewable wording |
| --- | --- | --- |
| Importer | Build a data importer | Import format X through the existing ingestion interface, validate required fields, report row-level errors, and pass fixtures for cases A, B, and C |
| Performance | Optimize queries | Establish a reproducible baseline, change the identified query path, and report median and tail latency under the agreed dataset |
| Documentation | Write docs | Publish setup, configuration, example, troubleshooting, and maintainer notes in the project's documentation system |

Keep optional deliverables separate. An optional item should begin only after required work meets its exit criteria.

## Choose the Right Project Size

Google currently describes three approximate scopes: 90 hours for small, 175 hours for medium, and 350 hours for large projects. The size represents expected total effort, not a prestige level.

Estimate work from tasks, review cycles, testing, documentation, and uncertainty. Do not count only initial implementation. A change that touches storage, public APIs, backward compatibility, migration, and documentation is larger than its line count suggests.

Use ranges for uncertain tasks and show the assumption behind them. If the estimated required work already consumes the full budget before review and integration, reduce scope.

## Build Milestones Around Evidence

A week-by-week list of verbs can create false precision. Milestones are stronger when each ends in a reviewable artifact and exit condition.

For example:

- design approved with unresolved questions recorded;
- vertical prototype handles one representative case;
- core implementation passes agreed unit tests;
- integration handles compatibility and failure paths;
- documentation and migration guide build successfully;
- release candidate passes regression testing; and
- final work product maps every goal to evidence.

Include review time. Maintainers are volunteers with other responsibilities. Code submitted on the last day of a milestone is not automatically reviewed the next morning.

Include a final buffer for integration and documentation rather than planning feature work until the submission deadline.

## Write a Real Risk Register

"I will work hard" is not a mitigation. A risk register connects uncertainty to a decision.

Common categories include:

- an upstream API or dependency changing;
- incomplete or unavailable data;
- performance that cannot meet the hoped-for target;
- hardware or platform access;
- a design requiring broader community consensus;
- review latency;
- unfamiliar parts of the stack;
- an external service or license constraint; and
- exams, employment, health, or planned leave.

For each risk, name an early warning and a fallback. A good fallback preserves a coherent project. It does not simply delete testing and documentation.

## Show Evidence of Preparation

Your experience section should map evidence to the project requirements. Instead of listing every language you have seen, select the relevant claims.

Useful evidence includes:

- a contribution to the target code area;
- a reproducible setup or bug investigation;
- a prototype testing a risky assumption;
- code in another project that uses the same concept;
- a design discussion where you incorporated feedback;
- tests or documentation that reveal codebase understanding; and
- relevant coursework or professional work described without confidential material.

Be honest about gaps. "I have not used library Y, but I built the linked experiment with its lower-level dependency and allocated the first investigation milestone to Y" is more credible than adding Y to a skills list.

## Disclose Time and Communication Constraints

The official guide asks applicants to inventory outside commitments and communicate them. Include exams, jobs, travel, planned leave, major family obligations, and connectivity limitations.

State your timezone and the organization's normal channel. If the project depends on synchronous meetings, confirm overlap. If you require an extended schedule, discuss it before the proposal deadline rather than presenting it as a surprise after acceptance.

Do not promise a weekly number that conflicts with the rest of your calendar. Mentors can plan around a known constraint more easily than an unexplained disappearance.

## Apply the Organization's AI Policy

Google's [FAQ](https://developers.google.com/open-source/gsoc/faq) and proposal guide tell applicants to check organization-specific AI policies. Some organizations automatically reject AI-generated proposal materials.

Before using an AI tool for research, drafting, editing, code, translation, or diagrams, answer:

- Does the organization permit this use?
- Does it require disclosure?
- Are proposal text and code treated differently?
- Can you verify every technical claim and citation?
- Can you explain and defend the result without the tool?
- Does the tool expose confidential community or personal information?

If the policy is unclear, ask in the organization's preferred public channel. Do not assume that rewriting generated text removes a disclosure obligation.

## Proposal Review Checklist

### Compliance

- [ ] Every organization requirement has a matching section or artifact.
- [ ] The proposal uses the required format and length.
- [ ] Qualification tasks and separate forms are complete.
- [ ] AI use follows the organization's policy.
- [ ] The final file is a readable PDF.

### Substance

- [ ] The problem, users, and community benefit are specific and sourced.
- [ ] The current state and related work are accurate.
- [ ] The technical approach identifies code areas, interfaces, dependencies, and alternatives.
- [ ] Required and optional deliverables are separated.
- [ ] Every required deliverable has acceptance criteria, tests, and documentation.
- [ ] Milestones end in reviewable artifacts.
- [ ] Risks include early warnings and coherent fallbacks.

### Credibility

- [ ] Skill claims link to relevant evidence.
- [ ] Contributions are useful and correctly attributed.
- [ ] Outside commitments and unavailable dates are visible.
- [ ] The scope fits the chosen project size with review time included.
- [ ] Claims, numbers, and links have been verified.
- [ ] The writing is original and can be explained in conversation.

### Submission

- [ ] Mentors had time to review an early draft where the organization permits feedback.
- [ ] Requested changes were addressed or discussed.
- [ ] The PDF has no clipped tables, broken links, missing fonts, or comments.
- [ ] The correct version was uploaded in the GSoC web app.
- [ ] Submission was completed before the hard deadline.
- [ ] A private copy and confirmation were saved.

## Sources and Freshness

This template was reviewed on July 21, 2026 using Google's [proposal-writing guide](https://google.github.io/gsocguides/student/writing-a-proposal), [GSoC FAQ](https://developers.google.com/open-source/gsoc/faq), and [official timeline](https://developers.google.com/open-source/gsoc/timeline). The organization you apply to is the primary source for its format, project requirements, mentor process, and AI policy.
