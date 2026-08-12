# Production Batch 01: 15 Article Briefs

Approved after completing the research library and 150-topic roadmap. Last reviewed **2026-08-12**.

## Shared requirements

Every article in this batch must:

- contain at least 1,500 useful body words, because this batch has an explicit project-level length requirement;
- comply with [`../../blog/content-format.md`](../../blog/content-format.md);
- use `publishedAt: 2026-08-12`, `author: gsoc-orgs-team`, a focused category, 3–6 tags, a unique `coverTone`, a `keyphrase`, a 150–500-character TL;DR, 3–5 takeaways, and 3–5 reader-first FAQs;
- use one H1 from frontmatter and descriptive `##` sections in the body;
- answer the primary question in the opening paragraph and in the first relevant H2;
- cite at least three relevant primary sources when the subject supports them;
- include at least four useful internal links, including one cluster hub and one next-step guide;
- distinguish durable facts, annual facts, organization-specific requirements, derived calculations, and practical interpretation;
- state `as of 2026-08-12` near volatile rules or figures;
- add a decision framework, table, worked example, original calculation, template, checklist, or reproducible method;
- avoid keyword stuffing, padding, selection guarantees, personal acceptance probabilities, fake experience, invented quotes, and unverified “best/easy/low competition” claims;
- use FAQs for readers, not for a promised rich-result benefit;
- pass the repository parser and SEO checker with no failures.

Do not mark another article `featured`. The existing GSoC 2027 guide remains the blog hero. Use `cornerstone: true` only for the broadest durable hubs.

## Workstream A — Program foundation

### A1. `what-is-gsoc.md`

- **Title:** What Is GSoC? How Google Summer of Code Works
- **Keyphrase:** `what is gsoc`
- **Category:** GSoC Guides
- **Information gain:** a stage-by-stage program map separating Google, organizations, mentors, applicants, accepted contributors, and evaluations; a “GSoC versus internship” truth table.
- **Required H2s:** direct definition; participants and roles; annual process; organization/project model; project hours and schedules; stipend; what GSoC is not; who should consider it; first steps; misconceptions.
- **Primary sources:** official FAQ, How It Works, Contributor Guide, current timeline.
- **Internal links:** 2027 guide, eligibility, preparation roadmap, organization list, application guide.

### A2. `gsoc-eligibility.md`

- **Title:** GSoC Eligibility: Student, Graduate and Beginner Rules
- **Keyphrase:** `gsoc eligibility`
- **Category:** GSoC Applications
- **Information gain:** a decision tree covering age, student/beginner status, professional/graduate cases, prior contributor/mentor roles, residency, and uncertainty; fact versus example table.
- **Required H2s:** current official criteria; age; student/non-student; beginner definition; graduates/professionals; prior roles; country/work eligibility; examples; documents and verification; annual update checklist.
- **Primary sources:** Get Started, FAQ, current Program Rules.
- **Internal links:** what is GSoC, application guide, 2027 guide, stipend guide, preparation roadmap.

### A3. `gsoc-stipend.md`

- **Title:** GSoC Stipend: 2026 Amounts, PPP and Payment Guide
- **Keyphrase:** `gsoc stipend`
- **Category:** GSoC Applications
- **Information gain:** current 2026 range table and worked payment examples for 45%/55%; volatility ledger explaining what must be rechecked for 2027; India example without currency or tax promises.
- **Required H2s:** current status; PPP; size table; India; payment split; evaluations; provider setup; residency; tax/fees; 2027 status; myths.
- **Primary sources:** 2026 stipend table, payment instructions, tax forms, accepted contributor guide.
- **Internal links:** eligibility, project choice, evaluations, application guide, 2027 guide.

### A4. `how-to-apply-for-gsoc.md`

- **Title:** How to Apply for GSoC: Process, Timeline and Checklist
- **Keyphrase:** `how to apply for gsoc`
- **Category:** GSoC Applications
- **Information gain:** a phase-by-phase application workflow with artifacts, owner, and failure mode for each step; UTC/deadline safety checklist.
- **Required H2s:** eligibility; official calendar; account/profile; find org; make contact; prerequisites; proposal; official submission; after submission; results; checklist.
- **Primary sources:** timeline, FAQ, Get Started, Writing a Proposal, applicant advice.
- **Internal links:** what is GSoC, organization choice, project choice, proposal guide, eligibility.

### A5. `gsoc-preparation-roadmap.md`

- **Title:** GSoC Preparation Roadmap: From Zero to Proposal
- **Keyphrase:** `gsoc preparation roadmap`
- **Category:** GSoC Guides
- **Information gain:** readiness diagnostic and milestone-based paths for 12-, 6-, and 3-month starting points; evidence log rather than a course list.
- **Required H2s:** baseline; Git/Linux; choose a stack; build/debug; study communities; first contribution; deepen work; choose project; proposal; shortened timelines; tracking checklist.
- **Primary sources:** applicant advice, Choosing an Organization, Am I Good Enough?, GitHub beginner/open-source guides.
- **Internal links:** 2027 guide, what is GSoC, first contribution, organization choice, application guide.

## Workstream B — Applicant decisions and selection

### B1. `how-to-start-open-source-for-gsoc.md`

- **Title:** How to Start Open Source for GSoC: First Contribution
- **Keyphrase:** `start open source for gsoc`
- **Category:** Open Source
- **Information gain:** an end-to-end first-contribution workflow, issue-quality rubric, PR review checklist, and recovery paths for setup/issue/review failures.
- **Required H2s:** what contribution proves; choose repo; read docs; local setup; issue selection; reproduce; discuss; implement/test; PR; review; rejected work; AI spam; checklist.
- **Primary sources:** applicant advice, Am I Good Enough?, GitHub open-source contribution guidance, GSoC spam-proposal guidance.
- **Internal links:** preparation roadmap, organization choice, project choice, mentor contact, proposal guide.

### B2. `how-to-contact-gsoc-mentors.md`

- **Title:** How to Contact GSoC Mentors Without Spamming Them
- **Keyphrase:** `contact gsoc mentors`
- **Category:** GSoC Guides
- **Information gain:** channel decision tree plus good/bad/revised message examples; evidence-based follow-up and no-response policy.
- **Required H2s:** mentor role; research first; preferred channels; introduction anatomy; technical questions; public/private; examples; follow-up; no response; volunteer boundaries; community health.
- **Primary sources:** Making First Contact, Communication Best Practices, applicant advice, Working With Your Mentor.
- **Internal links:** organization choice, first contribution, project choice, proposal guide, 2027 guide.

### B3. `how-to-choose-gsoc-project.md`

- **Title:** How to Choose and Scope a GSoC Project Idea
- **Keyphrase:** `choose a gsoc project`
- **Category:** GSoC Projects
- **Information gain:** project-comparison scorecard, feasibility spike, dependency/risk register, and core-versus-stretch scope example.
- **Required H2s:** organization versus project; ideas page; community value; required/learnable skills; sizes; feasibility; dependencies; prototype; mentor questions; scorecard; project plan.
- **Primary sources:** Finding the Right Project, Defining a Project Ideas List, FAQ, proposal guide.
- **Internal links:** organization choice, proposal guide, first contribution, application guide, organization list.

### B4. `accepted-gsoc-proposal-examples.md`

- **Title:** Accepted GSoC Proposal Examples: What to Learn
- **Keyphrase:** `accepted gsoc proposal examples`
- **Category:** GSoC Applications
- **Information gain:** transparent analysis rubric for public historical examples; distinguish recurring useful patterns from survivorship bias and obsolete rules; include an annotated evaluation worksheet rather than copying proposal text.
- **Required H2s:** what examples prove; sample selection; problem statements; system research; deliverables; milestones; testing; risks; contribution evidence; weak patterns; copying danger; rubric.
- **Primary sources:** official Writing a Proposal, FAQ, spam-proposal guidance, publicly hosted organization proposal archive/example pages when cited.
- **Internal links:** proposal guide, project choice, selection process, mentor contact, application guide.

### B5. `gsoc-acceptance-rate-selection-process.md`

- **Title:** GSoC Acceptance Rate and Selection Process Explained
- **Keyphrase:** `gsoc acceptance rate`
- **Category:** GSoC Applications
- **Information gain:** reproduce 2026 applicant and proposal ratios from official denominators; explain why they differ; map organization ranking, mentors, slots, duplicate selections, and interviews; explicitly reject personal-odds inference.
- **Required H2s:** define rates; 2026 calculation; prior-year comparability; org review; mentor/project fit; ranking; Google slots; interviews; why odds vary; actionable evidence; misuse checklist.
- **Primary sources:** 2026 contributor announcement, Selecting Contributors and Mentors, Selecting a Contributor, FAQ.
- **Internal links:** application guide, proposal guide, organization choice, project choice, accepted examples.

## Workstream C — Policies, execution, and technology discovery

### C1. `ai-in-gsoc.md`

- **Title:** AI in GSoC: Proposal, Code and Disclosure Rules
- **Keyphrase:** `ai in gsoc`
- **Category:** GSoC Applications
- **Information gain:** allowed/uncertain/prohibited scenario matrix, policy-discovery checklist, and verification workflow for AI-assisted research/code.
- **Required H2s:** official position; organization authority; proposal rules; contributions; coding period; verification/tests; copyright/licensing; disclosure; scenario matrix; policy checklist; recovery.
- **Primary sources:** official AI guidance, FAQ, Writing a Proposal, spam-proposal guidance.
- **Internal links:** proposal guide, first contribution, acceptance process, project choice, 2027 guide.

### C2. `gsoc-community-bonding.md`

- **Title:** GSoC Community Bonding: A Three-Week Action Plan
- **Keyphrase:** `gsoc community bonding`
- **Category:** GSoC Contributors
- **Information gain:** 3-week/15-working-day sample action plan with deliverables, communication agreement, risk register, and environment-readiness definition.
- **Required H2s:** purpose; official timing; expectations agreement; local setup; architecture/domain; milestones; communication cadence; early contribution; documentation; risk; sample plan; mistakes.
- **Primary sources:** accepted contributor information, How It Works, Working With Your Mentor, community-bonding mentor guide.
- **Internal links:** evaluations/work product, project choice, mentor contact, application guide, proposal guide.

### C3. `gsoc-evaluations-work-product.md`

- **Title:** GSoC Evaluations and Final Work Product Guide
- **Keyphrase:** `gsoc evaluations`
- **Category:** GSoC Contributors
- **Information gain:** evaluation-readiness dashboard, escalation ladder, and valid/weak work-product comparison; explain payment links without implying guaranteed passage.
- **Required H2s:** evaluation model; midterm; final; criteria; feedback; scope changes; failure/withdrawal; payment; final work requirements; stable URL; report template; extension; checklist.
- **Primary sources:** official evaluations, Contributor evaluation guide, roles/responsibilities, work-product guidelines, project dates.
- **Internal links:** community bonding, stipend, project choice, mentor contact, proposal guide.

### C4. `gsoc-organizations-for-python.md`

- **Title:** GSoC Organizations for Python: Data and Shortlisting
- **Keyphrase:** `gsoc organizations for python`
- **Category:** GSoC Organizations
- **Information gain:** original local-tag analysis: 293 normalized organization profiles carry a Python tag somewhere in 2016–2026; the finalized 2025 yearly summary lists Python on 119 of 185 organizations. Explain that organization-level tags are not project-language guarantees and that incomplete 2026 projects are excluded from project claims. Do not use the generated tag page's 122-profile intersection as 2025 usage: that page attaches globally aggregated tags to every active year.
- **Required H2s:** method/boundary; historical breadth; 2025 snapshot; umbrella orgs; domain groups; adjacent technologies; repository inspection; current verification; shortlist scorecard; myths.
- **Primary sources:** official organization directory, Choosing an Organization, applicant advice; local files `new-api-details/tech-stack/python.json` and 2025 yearly snapshot.
- **Internal links:** organization list, data methodology, organization choice, `/tech-stack/python`, project choice.

### C5. `gsoc-organizations-for-javascript.md`

- **Title:** GSoC Organizations for JavaScript and TypeScript
- **Keyphrase:** `gsoc organizations for javascript`
- **Category:** GSoC Organizations
- **Information gain:** original tag analysis: 225 normalized profiles carry JavaScript somewhere in 2016–2026 and the finalized 2025 yearly summary lists it on 92 of 185 organizations. TypeScript appears on 33 profiles across the full window and 20 organizations in the 2025 summary; the same summary lists React on 11 and Node.js on 13. These are organization-level tags, not project-language counts. Do not derive current-year usage by intersecting global profile tags with active years.
- **Required H2s:** methodology; JS versus TS/framework tags; 2025 table; frontend/backend/domain groups; testing/build expectations; contributions beyond UI; repository complexity; current verification; shortlist; myths.
- **Primary sources:** official organization directory, Choosing an Organization, applicant advice; local JavaScript, TypeScript, React, Node.js tag files and 2025 snapshot.
- **Internal links:** organization list, data methodology, organization choice, `/tech-stack/javascript`, `/tech-stack/typescript`, project choice.

## Batch acceptance checks

- Exactly 15 new Markdown posts exist at the approved slugs.
- Each body contains at least 1,500 words without boilerplate duplication.
- Each focus keyphrase has one canonical article in this batch.
- All internal post links resolve.
- All official links are direct and relevant.
- Every volatile claim has a year or verification date.
- Local statistics reconcile with documented inputs and avoid incomplete 2026 project totals.
- The content loader parses every post and exposes them to blog/category/tag/RSS/search-index routes.
- SEO checks have no failures; image warnings may remain when the generated `PostCover` is the deliberate visual.
- Lint, type-check, and production build pass, with unrelated pre-existing warnings reported separately.
