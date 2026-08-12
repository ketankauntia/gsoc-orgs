---
title: "How to Write a GSoC Proposal: Research, Scope and Timeline"
description: "Learn how to write a GSoC proposal with organization-specific research, measurable deliverables, milestones, risks, communication and AI-policy checks."
category: GSoC Applications
tags: [gsoc proposal, gsoc guide, gsoc organizations, open source]
publishedAt: 2026-08-12
author: gsoc-orgs-team
coverTone: chart-5
keyphrase: write a gsoc proposal
tldr: "A strong GSoC proposal is an organization-specific engineering plan supported by prior research and communication. Define the problem, related work, deliverables, milestones, tests, risks and availability; follow the organization's exact template; submit early for feedback; and comply with its AI policy. A polished generic essay cannot replace project understanding."
keyTakeaways:
  - Confirm eligibility and every organization-specific prerequisite before drafting.
  - Explain the problem and current system before presenting your implementation.
  - Convert ideas into reviewable deliverables with tests, documentation and fallback scope.
  - Disclose outside commitments and submit early enough for mentor feedback.
  - Treat AI-generated proposal text as potentially disallowed and always follow the target organization's policy.
faqs:
  - q: "What should a GSoC proposal include?"
    a: "Include the problem, value to the organization, related work, technical approach, measurable deliverables, timeline, tests, documentation, risks, communication plan, relevant experience and outside commitments—plus every field required by the organization."
  - q: "How long should a GSoC proposal be?"
    a: "There is no universal ideal length. Follow the organization's template or limit and write enough to make scope and evaluation clear. Specific evidence is more valuable than repeated background or generic praise."
  - q: "Can I submit three GSoC proposals?"
    a: "Recent rules permit up to three proposals, but only one can be accepted. Official advice emphasizes one or two high-quality proposals and early engagement. Verify the rule for your program year."
  - q: "Should I submit my GSoC proposal early?"
    a: "Yes. Official guidance recommends an early draft because mentors may need days to respond and can request clarification before the deadline. A draft in the official system can usually be edited until applications close, subject to current rules."
  - q: "Can ChatGPT or another AI tool write my GSoC proposal?"
    a: "An organization may prohibit AI-written proposals and reject them automatically. Read its current policy. Your proposal must represent your own research, decisions and ability to execute; never submit generated claims or plans you cannot defend."
---

To write a GSoC proposal that mentors can evaluate, produce a concrete engineering plan for their community. The proposal should make it easy to answer four questions: Do you understand the problem? Can you execute the work? Can the scope be evaluated? Will communication and availability support the project?

Google's official proposal guide calls GSoC competitive and recommends submitting early, following organization-specific rules and explaining related work. Its applicant advice also stresses that a nice proposal alone does not replace interaction with the organization.

## How to write a GSoC proposal after checking prerequisites

Confirm formal eligibility, organization acceptance and local prerequisites before drafting. A technically impressive proposal can still be rejected for ignoring a required template, contribution task, communication step or AI policy.

Read, in this order:

1. [Official GSoC FAQ](https://developers.google.com/open-source/gsoc/faq) and rules for your year.
2. [Official timeline](https://developers.google.com/open-source/gsoc/timeline), with deadlines converted from UTC correctly.
3. The accepted organization's current GSoC page and idea list.
4. Its proposal template, contributor guide, code of conduct and AI policy.
5. Relevant repositories, architecture notes, issues and previous project work products.

If you have not selected a community yet, first use [How to choose a GSoC organization](/blog/post/how-to-choose-gsoc-organization). Do not write one proposal and replace the organization name three times.

## Start with the problem, not your biography

Open with a direct description of the user or engineering problem, its current impact and why the organization wants it solved. Then define the proposed outcome. Keep personal background brief until you can connect it to execution evidence.

A clear problem statement contains:

- the affected users, maintainers or system;
- current behavior and limitation;
- evidence from issues, code, documentation or mentor discussion;
- the desired outcome;
- explicit boundaries that prevent the project from expanding indefinitely.

Weak: “I will improve the dashboard using modern technologies.”

Stronger: “The dashboard currently fetches the complete dataset before applying filters, which delays interaction on low-memory devices. I propose a paginated query path, URL-persisted filters and regression benchmarks, while preserving the existing API contract.”

The stronger version can still be wrong, but a mentor can review and correct it.

## Explain related work and the current system

Related work proves that you investigated before proposing. Identify existing modules, earlier pull requests, design discussions, rejected approaches, upstream dependencies and comparable implementations. Explain how your proposal extends rather than duplicates them.

Official [proposal guidance](https://google.github.io/gsocguides/student/writing-a-proposal) specifically asks contributors to understand other people's work and describe how the proposed project fits the target organization. This is also where a small prior contribution becomes valuable: it gives you concrete knowledge of tests, review and architecture.

Include links to:

- the idea or issue being addressed;
- relevant source modules and documentation;
- previous discussions or attempts;
- your related investigation, prototype or contributions;
- external standards or upstream work when relevant.

Do not inflate trivial contributions. Explain what you learned and how feedback changed the proposed approach.

## Turn the approach into measurable deliverables

A deliverable should be reviewable and useful even if later milestones change. “Implement backend” is not measurable; “add a versioned endpoint with schema validation, pagination, tests and migration documentation” is.

For each deliverable, state:

- behavior or artifact produced;
- acceptance test or evaluation method;
- relevant interfaces and dependencies;
- documentation and test work;
- what is explicitly out of scope.

:::callout Code is not the only deliverable
Include tests, documentation, migration paths, benchmarks, design review and integration work. A feature that cannot be understood, verified or maintained is not complete.
:::

Separate core, stretch and fallback scope. Core work should form a coherent project. Stretch goals are attempted only after core acceptance. Fallback scope describes a smaller useful outcome if a named risk materializes; it should not be a hidden plan to do less.

## Build a timeline from dependencies

A realistic timeline follows technical dependencies and review cycles. It does not divide a feature wish list into equal weekly boxes. Recent GSoC guidance describes projects near 90, 175 or 350 hours and allows different lengths; verify the available sizes for your year and organization.

| Phase | Work | Reviewable evidence |
|---|---|---|
| Community bonding | Confirm design, environment, interfaces and communication | Approved design note, working setup, refined milestones |
| Milestone 1 | Implement smallest end-to-end path | Focused PR, tests and demo |
| Milestone 2 | Extend core behavior and edge cases | Integrated feature, regression suite |
| Midpoint | Reconcile scope, risk and feedback | Demonstration, updated plan and documentation |
| Milestone 3 | Complete remaining core deliverables | Feature-complete reviewed changes |
| Finalization | Stabilize, document, benchmark and hand off | Final work product, user/maintainer docs, known limitations |

For every period, include time for review and revision. A pull request opened on the last day of a milestone is not completed work.

## State risks and fallback plans

Risk analysis signals engineering judgment, not weakness. Identify uncertainties that could change scope or sequencing.

Common risks include:

- an upstream API or dependency changing;
- a migration requiring compatibility with old data;
- performance targets depending on unavailable infrastructure;
- a research approach failing to meet accuracy requirements;
- mentor or contributor availability around exams or travel;
- review revealing architectural constraints;
- community rules restricting a planned tool or data source.

For each material risk, state likelihood, impact, early detection and mitigation. If a dependency is critical, schedule a proof of concept before building everything around it.

## Be honest about availability

Inventory exams, employment, travel, health needs, other programs and recurring obligations. Official guidance asks applicants to disclose outside commitments and discuss planned absences. Mentors can help adjust a realistic plan; they cannot plan around surprises they do not know about.

Provide:

- expected weekly commitment;
- timezone and typical overlap window;
- known unavailable dates;
- preferred communication channels;
- how blockers and progress will be reported;
- when scope should be revisited.

Do not promise an unsustainable number of hours to appear committed. Reliability is more useful than an inflated estimate.

## Show evidence that you can execute

Relevant evidence connects directly to the project. A short list of code investigations, tests, reviewed contributions or maintained projects is stronger than a catalogue of certificates.

Describe:

- what you changed or investigated;
- why it mattered;
- how you tested it;
- what review feedback you received;
- what you would do differently now.

Google's [2026 anti-spam guidance](https://developers.google.com/open-source/gsoc/resources/spam_proposals) for organizations recommends checking applicant activity and meaningful contributions, sometimes requiring links to one to three relevant pieces of work. Requirements differ, but this reveals what generic proposals fail to show: authentic engagement with the codebase.

## Design the communication plan

Communication is part of project delivery. Google's mentor documentation describes poor communication as a leading sign of projects in trouble and recommends clear expectations for meetings, reports and code check-ins.

A simple plan might specify:

- a concise public progress update each week;
- early notification of blockers rather than waiting for a meeting;
- one scheduled mentor sync when the organization uses meetings;
- design discussion before large implementation changes;
- small reviewable pull requests instead of one final branch;
- milestone demos and scope review.

Match the organization's normal tools. Do not force a private chat workflow on a project that makes decisions through public mailing lists or issues.

## Follow AI and authorship rules

Every target organization can define whether and how AI tools may be used. Google's current [AI guidance](https://developers.google.com/open-source/gsoc/resources/ai_guidance) reports policies ranging from limited permission to prohibitions on AI-written proposals or generated code. The official FAQ warns that using AI to write a proposal may lead to automatic rejection under an organization's guidance.

:::stat 100% | responsibility remains with the human contributor for submitted work

Never use a tool to invent repository research, contribution history, benchmark results or mentor conversations. Even when assistance is allowed, verify every claim, understand every technical choice, check licensing and disclose usage if required.

The proposal is evidence of how you think. Generic generated prose often removes the exact details mentors need to evaluate.

## Submit early and ask for specific feedback

Submit a complete draft early enough for review. Official proposal guidance notes that mentors may take several days or more than a week during a busy application period. It also says proposals can generally be edited before the deadline; confirm the current system behavior.

Ask focused questions:

- Is this boundary consistent with the intended project?
- Does milestone two depend on an interface likely to change?
- Is the proposed benchmark representative?
- Which deliverable should become fallback scope?

Avoid “please review everything and tell me what to write.” Make it easy for volunteers to provide high-value feedback.

## A practical GSoC proposal structure

Use the organization's required template first. If it provides none, this structure covers common evaluation needs:

1. Title and concise summary.
2. Problem, users and motivation.
3. Current system and related work.
4. Proposed technical approach and alternatives.
5. Core deliverables and explicit non-goals.
6. Tests, documentation, compatibility and evaluation.
7. Timeline with dependencies and review time.
8. Risks, mitigations, fallback and stretch scope.
9. Communication plan and timezone.
10. Availability and outside commitments.
11. Relevant experience and contribution evidence.
12. References and required organization-specific answers.

The official guide notes that a PDF version may be required for upload. Generate the final PDF early, then check headings, links, page breaks and accessibility instead of discovering formatting failures near the deadline.

## Final proposal review checklist

- [ ] Eligibility and program-year rules are confirmed.
- [ ] Every organization prerequisite and template field is satisfied.
- [ ] The problem and value are understandable without promotional language.
- [ ] Related work and repository evidence are linked.
- [ ] Deliverables are measurable and include tests/documentation.
- [ ] Core, stretch and fallback scope are separated.
- [ ] Milestones include dependencies, review and revision time.
- [ ] Risks and mitigations are specific.
- [ ] Availability and outside commitments are honest.
- [ ] Communication expectations match the community.
- [ ] Contribution claims and metrics are verifiable.
- [ ] The proposal complies with the organization's AI policy.
- [ ] The PDF and all links were checked.
- [ ] A draft was submitted before the final deadline pressure.

A strong GSoC proposal is the written result of good organization selection, codebase research and community communication. Begin that chain with the [GSoC organization list](/blog/post/gsoc-organizations-list), then use the proposal to make already-shared understanding concrete.
