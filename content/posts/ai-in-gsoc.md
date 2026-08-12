---
title: "AI in GSoC: Proposal, Code and Disclosure Rules"
description: "Learn how AI in GSoC is governed across proposals, contributions and coding, with a policy checklist, scenario matrix and verification workflow."
category: GSoC Applications
tags: [gsoc, artificial intelligence, proposals, open source, policy]
publishedAt: 2026-08-12
author: gsoc-orgs-team
coverTone: chart-5
keyphrase: ai in gsoc
tldr: "There is no single rule that makes AI allowed or banned across GSoC. As of August 12, 2026, every mentoring organization can set stricter rules for proposal text, contribution tasks and generated code. Check the written policy before using a tool, disclose use when required, and submit only work you fully understand, verify, test and can defend."
keyTakeaways:
  - Google publishes general AI guidance, but each GSoC organization decides what it will accept.
  - AI-written proposal text can cause automatic rejection when an organization prohibits it.
  - You remain fully responsible for correctness, security, authorship, licensing and understanding.
  - A safe workflow records the policy, purpose, inputs, verification, tests and required disclosure.
  - If you used AI against a rule, stop, tell the appropriate maintainer and replace unverified work honestly.
faqs:
  - q: "Can I use AI to write my GSoC proposal?"
    a: "Only if the target organization's current rules permit it. Google's guidance says some organizations prohibit AI use in proposals, and the official FAQ warns that prohibited AI-written text may trigger automatic rejection. Even when assistance is allowed, the proposal must reflect your own research and reasoning."
  - q: "Can I use AI-generated code during GSoC?"
    a: "It depends on the organization's policy and the repository's contribution rules. Some organizations prohibit generated code because of learning, quality, copyright or licensing concerns. You are responsible for understanding and validating every submitted change."
  - q: "Do I have to disclose AI use in GSoC?"
    a: "Follow the organization's written disclosure rule. If the policy is silent, ask through its preferred channel before submitting AI-assisted work. Keep a private work log so you can explain what the tool did and how you verified the result."
  - q: "Is using AI for grammar correction safe?"
    a: "Do not assume that a seemingly minor use is allowed. A policy may prohibit all generated proposal text or sharing proposal material with external tools. Confirm the scope first, and never let editing replace your own technical explanation."
  - q: "What should I do if I already used AI against the rules?"
    a: "Stop using the output, review the policy, preserve an honest record and contact the organization through the appropriate channel. Be specific about what was affected. Recreate the work yourself when permitted instead of trying to hide the use."
---

AI in GSoC is governed by two layers: Google's general guidance and the target organization's own rules. As of August 12, 2026, there is no universal permission to use generative AI in a proposal, pull request or accepted project. Some organizations permit limited assistance; others prohibit AI-written proposals, generated code or all AI tooling. The safe decision is therefore policy first, tool second.

This guide turns that principle into a practical workflow. It does not provide a trick for disguising generated work. Your proposal and contributions must demonstrate the understanding that mentors are trying to evaluate. Before drafting, also read the target organization's instructions and our [GSoC proposal guide](/blog/post/how-to-write-gsoc-proposal).

## The official position on AI in GSoC

Google's [2026 guidance for contributors using AI](https://developers.google.com/open-source/gsoc/resources/ai_guidance) says organizations have different views about when or whether AI tooling is appropriate. It tells applicants to read each organization's documentation carefully. The guidance also states that the human contributor retains **100% responsibility** for the work and must understand and validate generated output.

The [official GSoC FAQ](https://developers.google.com/open-source/gsoc/faq) makes the application consequence explicit: using AI to write a proposal may result in automatic rejection, depending on the organization's rules. This is an annual and organization-specific area, so recheck both sources for the program year in which you apply.

These statements establish a minimum, not a universal license. A repository can impose stricter authorship, security, privacy, copyright or contribution requirements. The absence of a sentence on Google's page does not override a project's policy.

:::callout Three questions before one prompt
Is this use permitted? Can I share this material with the tool? Can I personally verify and defend the output? If any answer is unknown, pause and ask the organization first.
:::

## Why the organization has final authority over its work

A mentoring organization must maintain the code after GSoC. It understands its contributor agreements, threat model, licenses, review capacity and educational goals. That is why two accepted organizations can reasonably reach different conclusions about the same tool.

Policy may live in several places:

- the organization's GSoC ideas or applicant page;
- a proposal template or prerequisite document;
- `CONTRIBUTING.md`, developer documentation or a code-of-conduct addendum;
- repository pull-request templates and bot messages;
- a current announcement in the official community channel;
- instructions given by an authorized organization administrator or mentor.

Record the URL and access date. If two instructions conflict, do not choose the more convenient one. Ask through the organization's preferred channel and retain the answer. Our [organization-selection framework](/blog/post/how-to-choose-gsoc-organization) explains how to evaluate whether rules and contribution paths are current before committing to a community.

## AI rules for GSoC proposals

A proposal is evidence of how you define a problem, research the existing system, make tradeoffs and plan uncertain work. Generated prose can conceal those signals even when it sounds polished. Google's [proposal-writing guide](https://google.github.io/gsocguides/student/writing-a-proposal) therefore tells applicants to follow organization instructions closely, especially rules on AI-generated material.

Separate four activities instead of treating “AI use” as one switch:

1. **Discovery:** generating search terms or a list of questions.
2. **Research assistance:** summarizing material you have independently opened and checked.
3. **Editing:** changing grammar, structure or tone in text you wrote.
4. **Authorship:** generating the problem analysis, approach, milestones or personal evidence submitted as yours.

An organization may permit the first activity and prohibit the other three. Another may permit editing with disclosure. Never infer permission from what a tool can do. If allowed, compare every claim with the codebase and primary source, restore your own reasoning, and remove invented details. Do not submit a generated timeline that ignores repository dependencies or mentor feedback.

The official application system permits proposal revisions before the deadline, so use early human feedback rather than manufacturing certainty. You can develop a stronger plan by following the evidence steps in [how to choose and scope a GSoC project](/blog/post/how-to-choose-gsoc-project).

## AI-assisted contributions before selection

Pre-application contributions are real community work, not disposable audition pieces. Generated patches can impose review costs, introduce subtle defects and give mentors a false impression of your ability. A contribution that you cannot explain is weak evidence even if continuous integration happens to pass.

Google's [guidance for organizations handling low-quality proposals](https://developers.google.com/open-source/gsoc/resources/downloads/spam_proposals) describes generic AI-expanded ideas and unverified work as screening concerns. It encourages organizations to evaluate actual interaction and meaningful contributions. That does not create a universal PR quota, but it shows why automated volume is counterproductive.

Before using an allowed tool on a contribution:

- reproduce the issue without the tool;
- understand the expected behavior and relevant tests;
- identify which files, interfaces and licenses are in scope;
- ask whether external processing could expose private reports, tokens or user data;
- keep the change focused enough to review manually;
- run the project's full required checks;
- explain the design in your own words;
- disclose assistance in the format the project requests.

For the complete contribution workflow, use [how to start open source for GSoC](/blog/post/how-to-start-open-source-for-gsoc) rather than chasing activity counts.

## AI use during the coding period

Acceptance does not relax repository policy. It increases the need for clarity because the work now has agreed deliverables, mentor expectations and formal evaluations. Discuss AI use during community bonding even if you asked during the application period; policies, tools or project risks may have changed.

A written agreement should answer:

- Which tools and account types are allowed?
- May code, logs, issue content or design documents be sent to them?
- Are generated code, tests, documentation and commit messages treated differently?
- What disclosure belongs in commits, pull requests or weekly reports?
- Are there subsystems where AI is prohibited because of security or licensing?
- What evidence must accompany assisted work?

Google's guidance describes research, learning, boilerplate, tests and debugging as uses some mentors consider helpful, while emphasizing that complex core logic often exposes tool limitations. These are examples, not permissions. A mentor's casual suggestion also cannot override an organization-wide license or security rule.

## A verification workflow for AI-assisted code

“I read the output” is not verification. Use a repeatable evidence chain:

1. **Define the claim.** Write the behavior the change is supposed to produce and the failure it should prevent.
2. **Locate authority.** Link the issue, specification, architecture note or maintainer decision that defines correct behavior.
3. **Reduce the change.** Inspect each generated or assisted line; remove unrelated refactoring and unexplained dependencies.
4. **Trace execution.** Follow inputs, state changes, error paths and outputs through the actual code.
5. **Design tests yourself.** Include the expected case, boundary conditions, invalid inputs and a regression that fails before the fix.
6. **Run project checks.** Use the repository's formatter, type checker, linter, unit/integration tests and platform matrix where available.
7. **Review nonfunctional risks.** Consider security, privacy, performance, accessibility, compatibility and migration behavior.
8. **Explain the result.** Write why the approach works, alternatives considered and remaining uncertainty without asking the tool to invent the explanation.
9. **Request human review.** Make assumptions visible so a mentor can challenge them.

If you cannot complete a step, treat the output as an unverified lead, not a contribution. This workflow also creates useful material for milestones and evaluations.

## Copyright, licensing, privacy and attribution

Google's AI guidance identifies copyright and open-source licensing as serious concerns raised by mentors. A model can produce code resembling copyrighted or incompatibly licensed material without giving you reliable provenance. A syntactically valid answer is not proof that the project can distribute it.

Check the repository license, developer certificate of origin, contributor license agreement and attribution policy. Do not ask a public service to process credentials, embargoed vulnerabilities, private user information, proprietary datasets or unpublished security reports. Organization rules may also restrict tools because prompts and outputs are retained by a provider.

When provenance is uncertain, rewrite from the underlying specification and established project patterns, or do not use the output. Ask maintainers about license questions; do not declare generated code “copyright free.”

## How to disclose AI use without vague language

Disclosure should help a reviewer assess risk. “Used AI” is too broad, while naming a product alone says little about the affected work. Follow the required format and include enough detail to reproduce your verification.

A useful disclosure can state:

- the task for which assistance was used;
- the files or sections affected;
- whether output was copied, adapted or used only as a research lead;
- which tests and manual checks were performed;
- any unresolved provenance or correctness concern;
- the tool/version when the organization requests it.

Example: “With prior approval, I used an assistant to enumerate boundary cases for the parser tests. I wrote the assertions and implementation, checked each case against the grammar, and ran the full parser suite. No repository source or credentials were sent to the service.” Adapt this structure only when it is true.

## AI in GSoC scenario matrix

This matrix is a decision aid, not a replacement for policy.

| Scenario | Initial status | Required next action |
|---|---|---|
| Organization explicitly bans AI-written proposals | Prohibited | Write the proposal yourself; do not use rewriting or generation to bypass the rule |
| Policy allows research but says nothing about generated text | Uncertain | Use sources directly and ask before applying output to the submission |
| Tool suggests documentation links | Potentially allowed | Open every primary source and verify relevance, date and claim yourself |
| Tool generates core implementation code | High risk/uncertain | Confirm permission first; then perform line-level review, tests and disclosure |
| Approved assistant drafts repetitive test scaffolding | Conditionally allowed | Verify the test design, assertions, coverage and repository conventions |
| Prompt contains a private vulnerability or access token | Prohibited unless a specifically approved private system exists | Remove the secret, rotate exposed credentials and follow security reporting rules |
| Tool edits grammar in your proposal | Organization-specific | Confirm whether the policy treats editing as generated proposal material |
| You cannot explain an assisted function | Not ready to submit | Study, rewrite or remove it before review |

## Policy-discovery checklist

- [ ] Read the current official [GSoC AI guidance](https://developers.google.com/open-source/gsoc/resources/ai_guidance) and FAQ.
- [ ] Search the organization's GSoC page, ideas page and proposal template for `AI`, `LLM`, `generated` and `authorship`.
- [ ] Read repository contribution, license, privacy and security instructions.
- [ ] Check dated announcements in the organization's official channel.
- [ ] Ask a narrow question if the planned use remains unclear.
- [ ] Save the policy URL, answer and verification date.
- [ ] List the allowed tool, purpose, data boundary, tests and disclosure format.
- [ ] Recheck after selection and when the project scope changes.

Selection still depends on project, contributor and mentor fit rather than a universal AI score. See the [GSoC selection-process explainer](/blog/post/gsoc-acceptance-rate-selection-process) for that broader context and the [GSoC 2027 guide](/blog/post/gsoc-2027-guide) for future-year status.

## Recovering from an AI-policy mistake

Do not hide a violation or generate a story to explain it. Stop submitting affected output, identify its exact scope and read the authoritative policy again. If credentials or private data were exposed, follow the repository's security process immediately and rotate anything compromised.

Contact the appropriate mentor, maintainer or organization administrator through the designated channel. State what tool was used, what content was shared or generated, which commits or proposal sections are affected, and what verification occurred. Ask whether the work should be reverted, rewritten or formally disclosed.

Recreate permitted work from primary sources and your own understanding. A transparent correction cannot guarantee that an organization will continue reviewing an application, but concealment adds trust and compliance problems to the original mistake. The durable standard is simple: policy compliance, human understanding and verifiable work come before convenience.
