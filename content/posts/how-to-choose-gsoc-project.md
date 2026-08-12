---
title: "How to Choose a GSoC Project and Scope It Correctly"
description: "Choose a GSoC project by testing community value, skill fit, feasibility, dependencies and scope with a practical scorecard and risk register."
category: GSoC Projects
tags: [gsoc projects, gsoc ideas, project scoping, gsoc proposal, open source]
publishedAt: 2026-08-12
author: gsoc-orgs-team
coverTone: chart-3
keyphrase: choose a gsoc project
tldr: "To choose a GSoC project, separate community choice from project choice, verify the current ideas page, and compare value, required skills, feasibility, dependencies, mentor capacity and available time. Run a small feasibility spike, split the outcome into core and stretch scope, and discuss unresolved assumptions before converting the idea into a proposal."
keyTakeaways:
  - Organization fit and project fit are separate decisions; validate both.
  - Read an idea as a community need to investigate, not a ready-made implementation plan.
  - Match firm prerequisites now and time-box only the learning gaps you can close safely.
  - Test the riskiest assumption before committing to a timeline.
  - Define a coherent core outcome, explicit non-goals and optional stretch work.
faqs:
  - q: "Should I choose a GSoC project only by programming language?"
    a: "No. Language fit helps you enter the codebase, but community value, domain knowledge, setup cost, dependencies, mentor capacity, project size and your available time also determine feasibility. Use technology as one filter rather than the final decision."
  - q: "Can I propose my own GSoC project idea?"
    a: "Some organizations allow original ideas and others do not. An original idea still needs a current community need, a willing and qualified mentor, realistic scope and early discussion. Never assume that novelty alone makes a project acceptable."
  - q: "Should I choose a 90, 175 or 350 hour GSoC project?"
    a: "Choose the smallest scope that produces a coherent useful outcome and matches the organization's current size options. The hours describe expected project scope, not prestige. Verify program-year rules and discuss size with the community before finalizing the proposal."
  - q: "Do I need a prototype before submitting a GSoC proposal?"
    a: "There is no universal prototype requirement. A time-boxed feasibility spike is useful when it tests an important unknown such as an API, migration path or benchmark. Do not build the whole project privately before confirming that the organization wants the approach."
---

To choose a GSoC project, compare more than the title and programming-language tags. Verify that the idea solves a current community problem, that you meet its firm prerequisites, that the riskiest assumptions can be tested, and that a useful core outcome fits your time and the current project-size rules. Then discuss the remaining uncertainty with the community before writing a timeline.

The official [Finding the Right Project guide](https://google.github.io/gsocguides/student/finding-the-right-project) recommends shortlisting ideas, asking researched questions, evaluating available documentation and help, and turning the selected idea into a plan with potential mentors. This article provides a reproducible scorecard and scoping method for that step. If you have not chosen a community, begin with [how to choose a GSoC organization](/blog/post/how-to-choose-gsoc-organization) and the historical [GSoC organizations list](/blog/post/gsoc-organizations-list).

## How to choose a GSoC project after choosing an organization

An organization can be a strong match while one of its projects is not. You may appreciate a community's mission and communication but lack a firm prerequisite for a particular compiler project. Conversely, a project title may match your stack while the repository is inactive, the idea is poorly defined, or the available mentor cannot cover its domain.

Make two decisions in order:

1. **Community decision:** Do I want to work with this mission, repository workflow and communication culture?
2. **Project decision:** Can I produce this specific outcome with the available skills, time, dependencies and mentor support?

Do not compare projects from ten organizations indefinitely. Google's [applicant advice](https://developers.google.com/open-source/gsoc/help/student-advice) recommends researching roughly three to five organizations and narrowing to one or two. Within that smaller set, compare a few viable ideas deeply enough to uncover their real constraints.

Historical participation and past projects can help you understand a community, but they do not confirm a future organization, mentor or idea. Use the current official program directory and current organization pages for status.

## Read the ideas page as a research brief

An ideas page is written to describe community needs and recruit viable work; it is not necessarily a complete specification. Google’s mentor guide on [defining a project ideas list](https://google.github.io/gsocguides/mentor/defining-a-project-ideas-list) says ideas should include a description, expected outcomes, required or preferred skills, possible mentors and an expected size. It also encourages enough openness for applicants to demonstrate their own planning.

Extract every candidate idea into this worksheet:

| Field | What to record |
|---|---|
| Community problem | Who is affected and why the work matters now |
| Expected outcome | Observable behavior, artifact or improvement |
| Current system | Repository, component, issue and related work |
| Firm prerequisites | Skills or access required before the project begins |
| Learnable skills | Gaps that can be closed during preparation or planned investigation |
| Possible mentors | Named people or team and evidence of current involvement |
| Suggested size | Current 90, 175 or 350 hour classification, when given |
| Dependencies | Upstream changes, data, hardware, other teams or approvals |
| Unknowns | Questions the page does not answer |
| Source freshness | Year and last update of every critical instruction |

An outdated or vague page is not automatically disqualifying, but it increases the amount you must verify. Never copy its description into a proposal and expand the wording. The official project guide explicitly warns against submitting a restated ideas-page description instead of your own researched plan.

## Test the project's value to the community

A GSoC project should produce value for the open-source organization, not only a learning exercise for the applicant. Trace the idea to issues, user reports, roadmap discussions, maintenance pain or a capability the community has requested. Ask what becomes easier, safer, faster or newly possible if the project succeeds.

Use a value chain:

`current problem -> affected user or maintainer -> proposed capability -> measurable outcome -> longer-term maintenance owner`

For example, “rewrite the dashboard” is a technology activity. “Let maintainers filter ten years of organization records without downloading the full dataset, while preserving existing URLs and accessibility” describes users, behavior and constraints. It can be evaluated.

Check for competing or completed work. Search merged and open pull requests, project roadmaps, release notes, mailing-list discussions and past GSoC work products. If a similar attempt was rejected, learn why. A project may still be valuable, but your approach must address the earlier constraint.

Ask who maintains the result after the coding period. A clever standalone prototype with no integration path can be less useful than a smaller change built into the project's tests, documentation and release process.

## Separate required skills from learnable skills

Project pages often mix prerequisites with preferences. Classify every skill instead of assuming you must master them all.

- **Firm now:** required to set up the repository, understand the main component or complete a pre-assessment.
- **Learn before proposal:** a bounded gap you can close and demonstrate through investigation or a contribution.
- **Learn during project:** a tool or subdomain that the plan explicitly allocates time to explore.
- **Optional advantage:** useful for stretch work but unnecessary for the core outcome.

Be conservative. If a project requires strong C++ memory-model knowledge and your only experience is a short introductory course, that is not a two-week documentation gap. If it uses an unfamiliar test runner around a language you already know, a time-boxed setup and patch may be enough to prove readiness.

Build a skill-evidence table:

| Skill | Classification | Current evidence | Next proof | Deadline |
|---|---|---|---|---|
| Primary language | Firm now | Relevant maintained project | Fix/test in target repository | Before project decision |
| Build system | Learn before proposal | Basic local use | Reproduce documented build | One week |
| Domain protocol | Learn during project | Read specification overview | Design spike and mentor review | Early milestone |
| Visualization library | Optional | None | Defer unless core finishes | Stretch only |

Do not hide a gap. The official [proposal guide](https://google.github.io/gsocguides/student/writing-a-proposal) asks applicants to be clear about ability and outside commitments. A credible learning plan is more useful than claiming expertise a reviewer can disprove.

## Match project size to an outcome, not prestige

As of 2026-08-12, the official [GSoC FAQ](https://developers.google.com/open-source/gsoc/faq) describes small projects near 90 hours, medium projects near 175 hours and large projects near 350 hours. These figures can change, so verify them for the relevant program year. Hours represent approximate scope; they are not a universal weekly schedule and do not indicate that a larger project is more impressive.

Choose size by estimating the work needed for a coherent outcome:

- discovery and design needed to resolve known unknowns;
- implementation broken into reviewable increments;
- automated and manual tests;
- compatibility, performance, security or migration work;
- documentation and examples;
- review latency, revision and integration;
- a reasonable buffer for identified risks.

Avoid filling a larger category with unrelated features. A small project that ships a complete, maintained path is better scoped than a large collection of partially connected ambitions.

Also separate **project size** from **calendar length**. Current rules allow scheduling flexibility, but spreading a project across more weeks does not increase its scoped hours. Use the official project-date guidance for the target year before planning around exams, employment or travel.

## Run a feasibility spike on the riskiest assumption

A feasibility spike is a short, disposable investigation designed to answer one important question. It is not a secret implementation of the whole project and not a polished demo created to bypass community review.

Good spike questions include:

- Can the current API expose the required data without a breaking schema change?
- Can the proposed library operate under the project's supported runtime versions?
- Does a migration preserve round-trip behavior on representative fixtures?
- Can a minimal benchmark reach the required order of magnitude?
- Is the necessary dataset or hardware actually accessible under compatible terms?

Time-box the spike, define the decision it will inform and share the result. A useful record contains the hypothesis, setup, result, limitations and recommended next step. A negative result may be more valuable than a flashy prototype because it reveals a dependency before the proposal timeline depends on it.

If the idea is already well understood and the organization discourages speculative implementations, use the spike on local setup, a related test or an architecture trace instead. Ask before investing heavily.

## Build a dependency and risk register

Projects fail in the spaces between components: an upstream release slips, data access is unavailable, another team owns an interface, or review requires an expert with limited capacity. List these before selecting the idea.

| Risk or dependency | Early evidence | Impact | Mitigation | Fallback trigger |
|---|---|---|---|---|
| Upstream API is unstable | Open breaking-change proposal | Rework interface | Add adapter boundary; pin test fixture | API not stable by milestone 1 |
| Dataset license unclear | No published reuse terms | Cannot ship training path | Use approved public subset | No written clearance by design review |
| Hardware unavailable | Benchmark needs specialist device | Cannot validate performance | Maintain portable baseline | Access not confirmed before coding |
| Single mentor owns component | Review history shows one reviewer | Review bottleneck | Identify backup reviewer; smaller PRs | No backup before proposal ranking |
| Migration edge cases unknown | Old formats lack fixtures | Data-loss risk | Add fixture inventory and dry run | Error rate exceeds agreed threshold |

The register is not a prediction of failure. It is a decision tool. Reject or rescope a project when a critical dependency has no owner, no evidence and no useful fallback.

## Define core, stretch and non-goals

Scope becomes credible when the core is independently useful. Stretch goals must not be required to rescue an incomplete core, and non-goals prevent reviewers from assuming hidden work.

Worked example for a hypothetical import migration:

**Core outcome**

- define and review a versioned import schema;
- migrate two supported legacy formats through one validated path;
- provide deterministic error reporting and regression fixtures;
- document the operator workflow and rollback boundary.

**Stretch work**

- add an interactive preview for recoverable warnings;
- benchmark very large files and optimize the slowest verified step;
- support a third legacy format after core acceptance.

**Non-goals**

- redesign the entire storage engine;
- infer missing user data automatically;
- remove the old reader before a separately approved deprecation cycle.

This structure gives mentors meaningful choices when evidence changes. If a risk materializes, the team can protect the core instead of quietly abandoning the last third of an oversized proposal.

## Ask mentors questions that change the decision

After research, contact the community with questions that can affect scope or feasibility. Use the [GSoC mentor-contact guide](/blog/post/how-to-contact-gsoc-mentors) for channel etiquette and examples.

High-value questions include:

- Which outcome is essential if only one part ships?
- Is a listed prerequisite firm, or may it be learned during the project?
- Which existing interface must remain compatible?
- Who can review the component, and is backup review available?
- Is dependency X expected to stabilize before coding?
- What test or benchmark would demonstrate acceptance?
- Does the organization permit original ideas or a different scope size?
- Which related attempt should I study before proposing an approach?

Avoid asking which project is easiest, least competitive or guaranteed to receive a slot. Mentors may not know applicant counts, and selection occurs through fit, ranking and capacity rather than a published difficulty formula.

## Use a project-comparison scorecard

Score only documented evidence, from 0 to 3. Record a source or observation beside every number so enthusiasm does not turn into false precision.

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Community value | Unclear | Claimed only | Linked need | Prioritized and measurable |
| Firm skill fit | Major gaps | Several gaps | One manageable gap | Demonstrated in target context |
| Setup readiness | Cannot run | Partial setup | Core tests run | Relevant behavior reproduced |
| Scope clarity | Open-ended | Many unknowns | Bounded with questions | Core/stretch/non-goals agreed |
| Dependency control | Critical blockers | Weak mitigations | Manageable risks | Independent path and fallback |
| Mentor/review capacity | Unknown | Single uncertain contact | Named mentor | Active mentor plus backup path |
| Time fit | Conflicts hidden | Tight estimate | Buffer included | Evidence-based plan and disclosure |
| Personal motivation | Label/brand only | General interest | Specific learning/value | Sustained interest beyond GSoC |

Do not publish the total as a selection score. Use it to identify where more research changes your own choice. A project scoring well on language but zero on mentor capacity is not fixed by averaging.

Compare no more than a few projects at once. Revisit scores after a setup attempt, contribution or mentor response. Keep the decision journal so you can explain why the chosen project is a fit in your proposal.

## Turn the chosen idea into a project plan

Selection of an idea ends research breadth and begins planning depth. Convert the project into reviewable milestones organized by technical dependency:

1. Confirm the problem, acceptance criteria, architecture boundary and non-goals.
2. Complete the highest-risk investigation early.
3. Build the smallest end-to-end core path.
4. Add edge cases, compatibility and integration in separate reviewable increments.
5. Reconcile scope at the midpoint using actual evidence.
6. Stabilize tests, documentation, migration and handoff before optional work.

For each milestone, name the artifact a reviewer can inspect: design note, regression test, pull request, demo, benchmark, fixture set or user documentation. Include review and revision time rather than treating an opened PR as completed work.

Then use [how to write a GSoC proposal](/blog/post/how-to-write-gsoc-proposal) to describe the plan, and the [application process guide](/blog/post/how-to-apply-for-gsoc) to verify submission requirements. The proposal should document understanding already built through research and contact; it should not be the first time the community encounters your interpretation.

## Final project-choice checklist

- [ ] The organization and project are current and verified at official sources.
- [ ] I can state the community problem and affected users in plain language.
- [ ] I found related issues, code, prior work and important constraints.
- [ ] Firm prerequisites are met or have concrete evidence deadlines.
- [ ] The suggested size matches a coherent outcome and my availability.
- [ ] The riskiest assumption has been tested or scheduled for an early spike.
- [ ] Critical dependencies have owners, mitigations and fallback triggers.
- [ ] Core, stretch and non-goals are separate.
- [ ] A possible mentor and realistic review path exist.
- [ ] My questions were discussed through the approved channel.
- [ ] The scorecard is backed by evidence rather than imagined odds.
- [ ] I can explain why I would value this work even without selection.

A well-chosen GSoC project is not the one with the most fashionable title. It is the one where community value, technical readiness, manageable learning, scope and mentoring capacity form a deliverable plan.
