---
title: What Is GSoC? A Source-Backed Google Summer of Code Guide
description: Learn what GSoC is, who it is for, how the program works, what contributors produce, and what the 2026 numbers actually mean.
category: GSoC Guides
tags: [gsoc, google summer of code, open source, beginners]
publishedAt: 2026-07-30
updatedAt: 2026-07-21
author: gsoc-orgs-team
featured: true
draft: true
cornerstone: true
coverTone: chart-2
images:
  - id: gsoc-program-hero
    kind: hero
    purpose: Explain the relationship between a contributor, an open-source organization, mentorship, and a scoped project.
    filename: gsoc-program-connection.webp
    placement: hero
    prompt: >-
      Sophisticated editorial systems illustration showing three clearly connected elements: an individual contributor, an open-source community, and a scoped software project with mentorship. Abstract geometric profile and community forms, precise connection lines, subtle global online network, deep navy, muted indigo, teal, warm off-white, one coral accent, clean flat vector aesthetic with slight tactile texture, lots of negative space, no logos, no words, no laptops, no robots, no corporate stock style. 1200 by 630.
    status: brief
    alt: Contributor, open-source organization, and mentored project connected within the GSoC program.
    caption: GSoC connects contributors with open-source organizations to complete scoped, mentored projects.
    width: 1200
    height: 630
  - id: gsoc-program-phases
    kind: diagram
    purpose: Show the full program flow without implying that annual dates are fixed.
    filename: gsoc-program-phases.svg
    placement: after-section:how-gsoc-works-from-start-to-finish
    prompt: >-
      Create a clean 1600 by 900 SVG timeline with seven phases from left to right: Organizations apply, Organizations announced, Research and discussion, Contributor proposals, Community bonding, Project work, Evaluations and final work product. Add the note Exact dates change each year. Use deep navy and muted indigo on warm off-white, teal for active progress, one restrained coral checkpoint, crisp flat geometry, accessible contrast, and manually proofread labels. No Google logo, people, calendar dates, gradients, 3D effects, or decorative clutter.
    status: brief
    alt: Timeline of the seven main phases in a Google Summer of Code cycle.
    caption: The sequence stays broadly consistent, but applicants must verify the exact dates for each program year.
    width: 1600
    height: 900
keyphrase: what is gsoc
tldr: Google Summer of Code, commonly called GSoC, is a global online program that introduces eligible students and open-source beginners to established open-source communities. Contributors work on a scoped project with mentors and may receive a stipend after passing evaluations, but they are not Google interns or employees.
keyTakeaways:
  - GSoC is a mentored open-source contribution program, not an internship or a Google recruitment program.
  - Eligible applicants must be at least 18, able to work in their country of residence, and either students or open-source beginners under the official rules.
  - Projects are generally scoped at about 90, 175, or 350 hours and can run for 8 to 22 weeks.
  - Organization fit, early communication, contribution evidence, and a realistic proposal matter more than collecting applications.
  - Always verify current dates and rules on the official GSoC site because they can change by program year.
faqs:
  - q: What does GSoC stand for?
    a: GSoC stands for Google Summer of Code. It is a global, online program that connects eligible students and open-source beginners with mentoring organizations.
  - q: Is GSoC a Google internship?
    a: No. Google states that contributors are independent developers, not Google employees or interns and not employees or interns of their mentoring organizations.
  - q: Do you have to be a student to apply for GSoC?
    a: No. The program is open to eligible students and open-source beginners. All applicants must also satisfy the other official requirements, including age, residence, work eligibility, and prior participation limits.
  - q: How long is a GSoC project?
    a: Projects can run for 8 to 22 weeks. Official project sizes are approximately 90 hours for small, 175 hours for medium, and 350 hours for large projects.
  - q: Can I submit more than one GSoC proposal?
    a: You may submit up to three proposals, but only one can be accepted. A smaller number of well-researched proposals is usually more useful than three weak applications.
  - q: Do GSoC contributors receive a stipend?
    a: Eligible contributors receive a stipend when they pass the required evaluations. The stipend is tied to program evaluation outcomes, not an employment relationship with Google or the mentoring organization, and participants must complete the required payment and tax steps.
---

Google Summer of Code, or GSoC, is a structured way for people who are new to open source to work with established open-source communities. Google operates the program, open-source organizations define and mentor projects, and accepted contributors carry out the work online.

That simple definition matters because GSoC is often described incorrectly. It is not a generic coding contest, a guaranteed path into Google, a university-only program, or an internship at Google. It is a competitive, mentored open-source contribution program with formal eligibility rules, project milestones, evaluations, and stipends for eligible contributors who pass.

This guide explains the program as it exists in 2026, while separating stable concepts from rules and dates that must be checked each year.

## What GSoC Means

GSoC stands for **Google Summer of Code**. Google describes it in the [official FAQ](https://developers.google.com/open-source/gsoc/faq) as a global, online program focused on introducing new contributors to open-source software development. Contributors work with experienced mentors in established open-source organizations.

The program has three main participants:

- **Google's Open Source Programs Office** runs the program, publishes rules and timelines, selects mentoring organizations, operates the application system, and administers stipends.
- **Mentoring organizations** are open-source communities accepted for a program year. They publish ideas and contributor guidance, communicate with applicants, select proposals, provide mentors, and evaluate contributors.
- **GSoC contributors** are accepted applicants who carry out a scoped project while participating in the organization's community.

The output is not limited to writing new feature code. Depending on the organization and project, a contributor might work on testing, infrastructure, accessibility, documentation tooling, scientific software, developer tools, performance, security, mobile applications, compilers, or other technical work. The work must fit the community's goals and the proposal accepted for that contributor.

## GSoC Is Not an Internship

The word "internship" is common in informal conversations, but it is not the program's legal or official relationship. Google states that GSoC contributors are independent developers. They are not Google employees or interns, and they are not employees or interns of the mentoring organization.

This distinction affects how you describe the experience:

| Inaccurate wording | Accurate direction |
| --- | --- |
| Google intern | GSoC 2026 contributor with the named open-source organization |
| Worked for Google | Contributed to an open-source project through Google Summer of Code |
| Google employee | Independent contributor participating in GSoC |

Google also says GSoC is not a recruiting program. Completing it can produce strong public evidence of technical work and community collaboration, but it does not guarantee employment at Google or anywhere else.

The official FAQ advises accepted participants not to claim the GSoC Contributor title as a completed credential until they have successfully passed the program. Before completion, it is accurate to say you were accepted to work with a particular organization.

## Who GSoC Is For

GSoC is designed for people entering open source, not experienced open-source maintainers seeking a paid project. The [current official eligibility criteria](https://developers.google.com/open-source/gsoc/faq) require an applicant to:

- be at least 18 years old at registration;
- be eligible to work in the country where they reside;
- be a student or an open-source beginner;
- have been accepted into GSoC no more than once before; and
- not reside in a United States embargoed country.

There are additional program rules and country-specific complications. For example, visa conditions can affect whether someone may participate. The official rules, not a blog checklist, decide eligibility. If your case involves work authorization, sanctions, a visa, or prior roles in GSoC, verify it with the official material before investing in an application.

Google gives useful examples of beginner-level experience. Personal or class projects, open-source work used only within one institution, fewer than ten issues or pull requests across various packages, and continued involvement in a project joined during GSoC preparation can still fit the beginner definition. Regular contributors to an open-source project are not considered beginners.

Professional developers are not automatically excluded by job title, but they must still meet the beginner requirement and have enough time. The program is about open-source experience, not whether a person has ever written production software.

For a case-by-case walkthrough, use the [GSoC eligibility guide](/blog/post/gsoc-eligibility).

## How GSoC Works From Start to Finish

Dates change each year, but the program follows a recognizable sequence.

### 1. Organizations apply

Open-source communities apply to become mentoring organizations. Google reviews these applications and announces the accepted organizations. Applicants cannot choose from every open-source project in the world. They apply through organizations accepted for that program year.

### 2. Potential contributors research organizations

After the organization list is published, applicants read organization profiles, ideas lists, contributor guidance, repositories, and communication channels. This is the period to build the project, understand contribution rules, ask specific questions, and test whether the community is a realistic fit.

In 2026, accepted organizations were announced on February 19. The official timeline set February 19 through March 15 as the dedicated discussion period before contributor applications opened, although serious research can start earlier using previous-year information.

### 3. Contributors submit proposals

Applicants submit proposals through the GSoC web app during the official application window. In 2026, that window ran from March 16 at 18:00 UTC to March 31 at 18:00 UTC.

A proposal explains the problem, benefit to the community, technical approach, deliverables, timeline, related work, relevant experience, and outside commitments. Organizations may require a specific template, qualification task, contribution, or communication process. Their instructions override a generic template.

The official FAQ permits up to three proposals, but only one can be accepted. Three proposals do not create three independent chances when the applicant lacks time to understand any of the communities.

### 4. Organizations select projects

Organizations review proposals and applicant interactions, confirm mentors, rank projects, and receive a slot allocation. A technically polished document is not the only evidence. Organizations may consider prior communication, small contributions, the applicant's understanding of the codebase, project usefulness, feasibility, and community fit.

Accepted 2026 contributor projects were announced on April 30.

### 5. Community bonding begins

Accepted contributors use the community bonding period to understand the codebase, development process, people, and final project plan. In 2026, this period ran from May 1 through May 24, with coding beginning May 25.

Community bonding is not a vacation between acceptance and coding. A useful outcome is a shared milestone plan, functioning development environment, agreed communication cadence, clarified scope, and early technical investigation.

### 6. The contributor carries out the project

The contributor implements, documents, tests, discusses, and revises the work with mentor guidance. Project length is flexible. Google says projects can run from 8 to 22 weeks, and the three approximate sizes are:

- **Small:** about 90 hours;
- **Medium:** about 175 hours; and
- **Large:** about 350 hours.

These are total project scopes, not promised weekly schedules. Actual weekly effort depends on project duration, the contributor's experience, community workflow, and agreed plan. If the original scope is too large or too small, the contributor and mentor should adjust it openly.

### 7. Midterm and final evaluations occur

Mentors evaluate progress and contributors evaluate their experience. The [official evaluation guide](https://google.github.io/gsocguides/student/evaluations) describes midterm and final evaluations. The timing varies with project length.

At the end, the contributor provides a link to the final work product. It should identify completed work, merged work, unmerged work, and what remains. See the [GSoC 2026 final submission checklist](/blog/post/gsoc-2026-final-submission-checklist) for a practical evidence package.

Passing the required evaluations controls successful completion and stipend payments. Google notes that payment is based on passing evaluation, not on whether the organization ultimately uses every piece of code.

## What Happened in GSoC 2026

Google first announced **185 accepted mentoring organizations** for 2026. When contributor projects were announced, Google reported **1,141 contributors working with 184 mentoring organizations**. The difference is important: an accepted organization may not end up with an accepted contributor project.

Google also reported:

- 15,245 applicants from 131 countries;
- 23,371 submitted proposals;
- more than 2,000 mentors and organization administrators; and
- 1,141 accepted contributors.

These official figures allow several transparent calculations:

| Derived 2026 measure | Calculation | Result |
| --- | --- | --- |
| Proposals per applicant | 23,371 / 15,245 | About 1.53 |
| Accepted contributors as a share of applicants | 1,141 / 15,245 | About 7.5% |
| Accepted contributors as a share of proposals | 1,141 / 23,371 | About 4.9% |
| Accepted contributors per active mentoring organization | 1,141 / 184 | About 6.2 |

These are descriptive program-level ratios, not an applicant's personal probability. Applicants can submit multiple proposals, organizations have different numbers of slots, projects have different sizes, and applicant quality is not evenly distributed. The useful conclusion is simply that GSoC is selective and a generic proposal is unlikely to be competitive.

The figures come from Google's [2026 contributor announcement](https://opensource.googleblog.com/2026/04/the-journey-begins-meet-the-2026-gsoc-contributors.html) and [2026 organization announcement](https://opensource.googleblog.com/2026/02/introducing-the-185-organizations-for-gsoc-2026.html). They were checked on July 21, 2026.

## What Makes a Strong GSoC Application

There is no universal point system, and no external website can predict acceptance. Strong applications usually reduce uncertainty for the organization.

They show that the applicant can:

1. follow the organization's instructions;
2. communicate in its normal public channels;
3. build or navigate the relevant codebase;
4. understand the problem behind the idea;
5. propose deliverables that fit the available time;
6. identify tests, risks, dependencies, and documentation;
7. respond constructively to feedback; and
8. be honest about skills and outside commitments.

Google's proposal guide emphasizes organization-specific formats, early submission, community benefit, clear deliverables, related work, and realistic scope. It also warns applicants to check each organization's policy on AI-generated material. Some organizations reject proposals that violate their AI rules.

A typo-free PDF cannot compensate for no community interaction or no understanding of the project. Likewise, a small contribution is useful evidence only when it reflects real engagement, not when it is a rushed cosmetic pull request sent to collect a link.

## How to Choose an Organization

Start with fit, not perceived prestige. A good target sits at the intersection of:

- a mission or product you care about;
- technologies you can use or learn in time;
- project ideas with understandable outcomes;
- contribution instructions you can follow;
- communication channels where questions receive useful answers;
- enough current repository activity to support the work; and
- mentors who appear able to guide the project.

Use the [organization directory](/organizations) to filter by technology, topic, category, and participation years. Then leave the directory and validate the present-day reality on the organization's own ideas page, contributor guide, repository, issue tracker, and community channels.

Historical participation is a signal, not a guarantee. A returning organization may have an established GSoC process. A first-time organization may offer close mentorship and a clear project. Neither status proves that a specific project fits you.

The detailed [organization selection workflow](/blog/post/how-to-use-gsoc-organizations-data) includes a scorecard that keeps popularity from dominating the decision.

## Common Misunderstandings

### "I need to know every technology before I apply"

You need enough relevant ability to make credible progress, but projects can include planned learning. The risk is choosing a project where every foundation is new. Be explicit about what you know, what you have tested, and what you need to learn.

### "The proposal is the whole application"

The proposal is central, but organizations evaluate people and projects in context. Communication, prerequisite tasks, contributions, and demonstrated understanding can matter. Follow the organization's published process.

### "More pull requests always improve my chances"

Maintainers value useful work and good collaboration. Low-value changes, duplicate fixes, and unsolicited large rewrites can create work for the community. One relevant, well-discussed contribution can show more than a pile of superficial patches.

### "I should contact mentors privately"

Use the organization's preferred channel. Open-source communities often favor public mailing lists, forums, or chat rooms because answers benefit everyone. Do not send the same generic message to many mentors.

### "The stipend is the project goal"

The stipend is real and important, but the program's purpose is to bring new contributors into open-source communities. Applicants who cannot explain why the organization and project matter will struggle to build a credible proposal.

## A Practical Starting Plan

If you are new to GSoC, work through these steps:

1. Read the official FAQ, rules, timeline, and contributor guide.
2. Check your eligibility before doing application work.
3. List the technologies, domains, and open-source products you genuinely want to work with.
4. Browse accepted organizations and make a broad list.
5. Reduce it to three to five candidates using mission and skill fit.
6. Read each candidate's ideas page and contributor instructions.
7. Build the relevant project or complete its onboarding path.
8. Observe community communication before asking a question already answered in the docs.
9. Choose one primary target and perhaps one backup you can research properly.
10. Discuss a specific idea, gather evidence, and draft the proposal early.

Do not begin by copying an accepted proposal from a previous year. It reflects another person, project, organization, and codebase state. Use a [proposal structure and review checklist](/blog/post/gsoc-proposal-template), then write original content grounded in your own research.

## Official Sources to Bookmark

- [GSoC FAQ](https://developers.google.com/open-source/gsoc/faq)
- [Official program timeline](https://developers.google.com/open-source/gsoc/timeline)
- [Contributor guide](https://google.github.io/gsocguides/student/)
- [Proposal-writing guide](https://google.github.io/gsocguides/student/writing-a-proposal)
- [Evaluation guide](https://google.github.io/gsocguides/student/evaluations)
- [Current mentoring organizations](https://summerofcode.withgoogle.com/programs/2026/organizations)

This article was reviewed on July 21, 2026. Eligibility, dates, terminology, country restrictions, stipend administration, and application procedures can change. Use official sources for the current program year.
