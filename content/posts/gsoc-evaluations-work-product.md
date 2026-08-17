---
title: "GSoC Evaluations and Final Work Product Guide"
description: "Prepare for GSoC evaluations with a readiness dashboard, feedback and escalation process, scope controls, and a valid final work product template."
category: GSoC Contributors
tags: [gsoc, evaluations, work product, mentors, project delivery]
publishedAt: "2026-07-28T18:05:00+05:30"
author: gsoc-orgs-team
coverTone: chart-3
keyphrase: gsoc evaluations
tldr: "GSoC evaluations occur around the project midpoint and end, but readiness is built through continuous evidence: agreed milestones, reviewed work, tests, documentation, communication and visible scope decisions. The final contributor evaluation and a stable public work-product link are mandatory under current guidance. Mentor pass decisions and payment processing are related, but neither should be treated as automatic."
keyTakeaways:
  - Ask what passing evidence looks like during community bonding and review it every week.
  - Midterm and final decisions should not be surprises when progress and feedback stay visible.
  - Rescope early in writing when evidence shows the original plan is unrealistic.
  - The final URL must identify your work, merged and unmerged changes, remaining tasks and reusable artifacts.
  - Missing or invalid final work can cause failure even when substantial coding was completed.
faqs:
  - q: "How many GSoC evaluations are there?"
    a: "The current model has midpoint and final evaluation periods in which mentors and contributors provide feedback. Exact dates depend on the year's calendar and project schedule, so use the official dashboard and project-dates page."
  - q: "Who decides whether a GSoC contributor passes?"
    a: "The project's mentor evaluation records the pass or fail decision using progress, work quality, communication, participation and the expectations agreed with the organization. Only one mentor evaluation is submitted per project when several mentors are involved."
  - q: "Can I pass if all of my code is not merged?"
    a: "Merge status is not the only evaluation input, and the official FAQ says organizations are not required to use all produced code. The mentor still evaluates the agreed outcomes and quality. Your final report should clearly identify merged, unmerged and remaining work."
  - q: "What happens if I miss the final work-product submission?"
    a: "Current official guidance says the final contributor evaluation and work-product link are required. A missing or invalid submission should result in failure, so prepare and review the stable public URL with your mentor well before the deadline."
  - q: "Does passing an evaluation guarantee immediate payment?"
    a: "A successful evaluation is a payment trigger under current rules, but payment also depends on eligibility, completed provider setup and processing. Percentages, provider, dates and supported locations are annual facts that must be checked on the current stipend page."
---

GSoC evaluations are formal midpoint and final decisions informed by the work your mentor has observed throughout the project. Do not prepare by writing a persuasive status message on the last day. Prepare by maintaining an evidence trail: agreed outcomes, small reviewed changes, tests, documentation, decisions, risks and honest communication.

The final work product is part of that evidence. It must be a stable public page that lets a new reader identify what you did and continue the work. Start its outline during [GSoC community bonding](/blog/post/gsoc-community-bonding), then update it as the project develops.

## How GSoC evaluations work

Google's [official evaluation page](https://developers.google.com/open-source/gsoc/help/evaluations) describes two evaluation periods during coding: midpoint and final. Mentors assess performance and choose pass or fail; contributors evaluate their experience and mentors. When several mentors share a project, only one mentor evaluation is ultimately submitted, although the mentors can coordinate on it.

The [Contributor evaluation guide](https://google.github.io/gsocguides/student/evaluations) says a pass/fail decision should not be a surprise. Contributor and mentor should already be discussing code quality, participation and progress. It also says contributors are encouraged to complete both evaluations, while the final evaluation and final work-product link are required under the current process.

Exact windows are annual and project-specific. As of August 12, 2026, the default small project is eight weeks and default medium/large projects are twelve weeks, while approved schedules can differ. The [official project-dates page](https://developers.google.com/open-source/gsoc/help/project-dates) and your dashboard, not a generic blog calendar, determine your deadlines.

## Prepare for the midterm evaluation

For a standard twelve-week project, the current contributor guide places the midpoint after week six; for a standard eight-week small project, it places it after week four. Longer approved schedules move the midpoint. The [mentor evaluation guide](https://google.github.io/gsocguides/mentor/evaluations) describes roughly 40–50% completion as a default midpoint expectation, but your actual evidence should follow the milestones and scope agreed with the organization.

One week before the window, review:

- required milestones planned for the first half;
- code, design, research, tests and documentation actually completed;
- pull requests and review status;
- decisions that changed the approach;
- blocked work and when it was escalated;
- communication and community participation;
- remaining risks and the second-half plan.

Do not count lines of code. A small reviewed interface and strong tests may be more meaningful than a large unreviewed branch. If the work differs from the proposal, link the discussion where mentor and contributor accepted the change.

:::callout Ask the pass question early
At every milestone, ask: “If this evidence were reviewed today, what would keep it from meeting our agreed expectation?” Specific feedback is more useful than “How am I doing?”
:::

## Prepare for the final evaluation

The final evaluation considers the whole project, including the validity of the submitted work-product link. Complete implementation alone is not enough if nobody can identify the work, run it or understand what remains.

Before the final window:

1. Freeze the required-scope checklist with your mentor.
2. Resolve or clearly document failing tests and incomplete integrations.
3. Separate work merged upstream from open PRs, branches and experiments.
4. Verify installation, build and usage instructions from a clean environment where feasible.
5. Document limitations, migration needs and follow-up issues.
6. Assemble the public final report and test every link without private access.
7. Ask your mentor to review the exact URL.
8. Submit early enough to correct portal or content mistakes before the deadline.

The official guide notes that finishing implementation early does not remove the obligation to log into the dashboard and submit the final evaluation and work product during the correct window.

## What mentors can evaluate

Google's published evaluation questions cover progress, performance, community interaction, communication, AI use and whether the work upload is valid. The repository's [roles and responsibilities guidance](https://developers.google.com/open-source/gsoc/help/responsibilities) expects contributors to submit quality work, communicate completed and next work, surface blockers, respond to feedback and engage with the broader community.

Translate those broad areas into project evidence:

| Area | Strong evidence | Weak substitute |
|---|---|---|
| Progress | Accepted milestone outcomes and demonstrable behavior | Hours claimed without artifacts |
| Quality | Tests, review responses, maintainable design and documentation | A large diff with no review |
| Communication | Timely updates, researched blockers and recorded decisions | A summary sent only at evaluation |
| Community | Normal public workflow and collaboration beyond one private chat | Message counts with no useful context |
| Independence | Investigation, alternatives and appropriate requests for help | Hiding blockers or copying unexplained output |
| Scope control | Written rescoping with preserved core value | Quietly dropping difficult deliverables |

Organizations may define additional criteria. Ask for them in writing rather than assuming that a global checklist overrides local expectations.

## Use feedback before it becomes a pass/fail surprise

Feedback is actionable when it names the gap, evidence and review date. If a mentor says progress is behind, ask which required outcome is at risk and what smaller result would still be useful. Agree on a recovery checkpoint instead of promising to “work harder.”

A concise recovery plan contains:

- current verified state;
- missed expectation and reason;
- smallest remaining core outcome;
- tasks, owners and dates;
- review cadence;
- work removed from scope;
- trigger for further escalation or withdrawal discussion.

Respond to criticism with code, tests, questions and updated plans. Do not argue from effort alone. Conversely, mentors should keep contributors informed of their status and communicate before failing under the official responsibility guidelines.

## Rescope when project evidence changes

Research can reveal that an upstream API is unavailable, a design assumption is wrong or the original project is too large. GSoC permits mentor and contributor to adjust scope; the goal is a coherent useful result, not preserving every sentence of an outdated proposal.

Use a written scope-change record:

| Field | Example content |
|---|---|
| Trigger | Upstream API cannot support incremental updates |
| Evidence | Linked issue, prototype and maintainer response |
| Original outcome | Live synchronization plus migration tooling |
| Revised core | Reliable batch synchronization with tests and documentation |
| Removed/stretch | Live event listener |
| Evaluation effect | New acceptance tests and updated milestone dates |
| Approval | Mentor/date and organization-admin action if schedule changes |

Preserve community value and testability. Rescoping is not permission to substitute unrelated work without review. The project-design methods in [how to choose a GSoC project](/blog/post/how-to-choose-gsoc-project) help distinguish core, stretch and non-goals.

## Failure, withdrawal and the escalation ladder

Under current guidance, failing an evaluation ends participation and no further Google stipend payments are issued. A missing or invalid final work submission is a failure risk. Health, family, safety or capacity problems should be raised early; silence removes options that communication might preserve.

Use this escalation ladder:

1. **Mentor:** share the concrete issue, its impact and the help or decision needed.
2. **Backup/secondary mentor:** use the agreed path if the primary mentor is unavailable or owns a conflict.
3. **Organization administrator:** escalate persistent communication problems, major scope disputes, mentor absence, policy concerns or potential withdrawal.
4. **Google program support:** use the official contact route for program-level or sensitive matters when organization handling is insufficient or guidance directs you there.

The [Working With Your Mentor guide](https://google.github.io/gsocguides/student/working-with-your-mentor) advises contacting a backup mentor or org admin when a mentor remains unresponsive, rather than waiting until evaluation. Keep the message factual and include prior attempts. Review respectful channel use in [how to contact GSoC mentors](/blog/post/how-to-contact-gsoc-mentors).

## How evaluations connect to payment

The official FAQ says stipends are paid to eligible participants who pass evaluations. For 2026, the current stipend documentation uses two installments—45% after the first successful evaluation and 55% after the final one—with dates based on the individual project schedule.

Those percentages, provider, dates, supported locations and setup requirements are **annual facts**. Passing does not bypass proof-of-residency, tax forms, payment-provider registration or processing. Likewise, code being unmerged does not by itself decide payment; the mentor's evaluation is the program trigger.

Use the maintained [GSoC stipend guide](/blog/post/gsoc-stipend) for worked examples, then confirm everything on the [official current stipend page](https://developers.google.com/open-source/gsoc/help/student-stipends). Do not budget around an assumed instant transfer.

## Final work-product requirements

Google's [Work Product Submission Guidelines](https://developers.google.com/open-source/gsoc/help/work-product) require a link that makes your own work easy to identify, lives at a stable public location and gives someone enough context to use or extend the result. The recommended report covers goals, completed work, current state, remaining work, merged and unmerged code, challenges and lessons.

A valid destination might be:

- a detailed public report linking all relevant issues, commits and pull requests;
- one comprehensive pull request whose description clearly records the GSoC scope and final commit;
- a purpose-built repository with a detailed README when the repository itself is the deliverable;
- another stable public artifact accepted by the organization that clearly attributes the work.

Weak destinations include the top of the organization's repository, an undifferentiated personal fork, a ZIP archive or the public GSoC project page. Those force readers to reconstruct authorship and state.

## Choose a stable public URL

The official archive publishes the submitted link. Google's guidance says the URL cannot be changed after submission; the FAQ says support may remove an old archive URL but will not update it. Choose a location the organization expects to remain available.

Test it in a signed-out browser. Check that no issue, document, image or build artifact requires your private account. Use permanent repository links where appropriate, but also link the live PR or issue so later discussion remains visible. If one branch will continue after GSoC, identify the last commit included in the submitted term.

Avoid a personal domain you are unlikely to renew unless the content is mirrored in a durable project-controlled location. Ask your mentor to open the page and identify your work without explanation.

## Final report template

Use this structure as a starting point, then follow organization instructions:

1. **Project and organization:** title, contributor, mentors, program year and canonical project links.
2. **Problem and intended users:** the need addressed and why it matters to the community.
3. **Agreed scope:** required, optional and explicitly excluded outcomes, including approved changes.
4. **Completed work:** outcome-based summary with demonstrations.
5. **Code and review ledger:** merged PRs, open PRs, branches, commits and issue discussions.
6. **Verification:** build instructions, tests, benchmarks, platforms and known failures.
7. **Documentation and migration:** user/developer docs, compatibility and rollout steps.
8. **Incomplete or unmerged work:** honest state, reason and exact continuation path.
9. **Challenges and decisions:** important tradeoffs and lessons supported by links.
10. **Next steps:** prioritized tasks a future contributor can take.

Keep the report concise enough to navigate but complete enough to transfer ownership. Do not conceal incomplete work behind promotional language.

## Extensions and nonstandard schedules

An extension is not a private grace period granted after a missed deadline. Current rules require contributor and mentor agreement plus formal action by the organization administrator before the final-submission period begins. The current schedule range is eight to twenty-two weeks, with small projects capped at twelve weeks; consult the official project-dates page for allowed dates.

An extension changes evaluation and payment timing but does not automatically increase project hours, scope or stipend. First consider whether reducing stretch work produces a better result. If a schedule change is justified, record the reason, revised milestones, midpoint/final windows and org-admin confirmation.

## Evaluation-readiness dashboard and checklist

Update this dashboard weekly:

| Status | Question |
|---|---|
| Green/amber/red | Are required outcomes on track against agreed evidence? |
| Count and links | Which changes are merged, in review, blocked or not started? |
| Pass/fail | Do baseline and new tests pass, with failures documented? |
| Date/owner | What is the highest project risk and next decision? |
| Last contact | Are mentor and community communication within the agreed cadence? |
| Scope version | Is the public plan consistent with approved changes? |
| URL readiness | Can a signed-out reader understand the current work-product draft? |

Before each official window:

- [ ] Confirm the exact dashboard deadline and timezone.
- [ ] Ask the mentor for explicit status feedback.
- [ ] Reconcile milestones with linked artifacts.
- [ ] Document scope changes and remaining risks.
- [ ] Run required checks and record results.
- [ ] Complete the contributor evaluation honestly.
- [ ] For the final, validate the public stable URL with the mentor.
- [ ] Submit early and save confirmation.

Your proposal remains useful as a baseline, not as evidence by itself. Keep the [proposal-writing guide](/blog/post/how-to-write-gsoc-proposal) linked in the project record so later scope decisions have context. Evaluations become manageable when every week leaves a trace of what changed, why it changed and how the community can verify it.
