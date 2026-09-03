---
title: "GSoC Organizations and Projects by Year: 2016 to 2026"
description: "Explore GSoC organizations and projects by year with a reproducible 2016 to 2026 table, clear denominators and completeness warnings."
category: GSoC Data
tags: [gsoc, gsoc organizations, gsoc projects, data analysis]
publishedAt: "2026-09-04T09:00:00+05:30"
author: gsoc-orgs-team
cornerstone: true
coverTone: chart-2
keyphrase: gsoc organizations and projects by year
tldr: "GSoC organizations and projects by year show a changing program, not a simple growth line. Our finalized 2016 to 2025 snapshots contain 10,951 projects across annual cohorts, while the recovered but non-final 2026 snapshot adds 1,140 projects and 183 live organizations. Compare years only after checking status, identity normalization and missing fields."
keyTakeaways:
  - "Finalized 2016 to 2025 snapshots contain 10,951 project records in total."
  - "Annual organization counts range from 168 in 2023 to 212 in 2018 within the covered window."
  - "The 2026 live set contains 183 organizations and 1,140 recovered projects but remains non-final for several fields."
  - "Counts describe accepted program records, not applicant demand, project quality or personal selection probability."
faqs:
  - q: "How many GSoC organizations participate each year?"
    a: "In our 2016 to 2026 snapshots, annual live or finalized counts range from 168 to 212. Check the table's snapshot status before comparing."
  - q: "How many GSoC projects are in the dataset?"
    a: "The finalized 2016 to 2025 window contains 10,951 projects. The separate non-final 2026 recovery contains 1,140 projects."
  - q: "Why is 2026 marked non-final?"
    a: "Projects, contributors and descriptions were recovered, but mentor, code URL, project tag, difficulty, status and timestamp fields remain incomplete."
  - q: "Can yearly project counts show my chance of acceptance?"
    a: "No. They do not include a complete project-level denominator of eligible serious applicants, rankings, mentor capacity or slot allocation."
  - q: "How should I compare GSoC organization counts across years?"
    a: "Use the same identity normalization and status definition for every year, and label whether the count is announced, live after withdrawals or finalized. A raw total can otherwise describe different populations."
  - q: "What does the projects-per-organization ratio tell me?"
    a: "It summarizes average historical program scale for a stated year. It does not show the distribution between organizations, current mentor capacity, project quality or an applicant's selection probability."
  - q: "Are withdrawn GSoC organizations included in yearly data?"
    a: "They should remain in the historical record with an explicit withdrawn status. Tables must say whether their headline denominator represents the announced cohort or the later live cohort."
  - q: "Can I compare the current GSoC year with finalized older years?"
    a: "Only with visible caveats. A recovered or live current-year snapshot may lack mentor, status or artifact fields that a finalized archive later supplies, so compare fields with equivalent completeness."
---

GSoC organizations and projects by year reveal changes in annual scale, cohort composition and available archive evidence. They do not form a ranking of program quality, organizations or applicants. The counts become useful only when every row states its snapshot status and unit.

Our local finalized 2016 to 2025 snapshots contain 10,951 project records. The separate 2026 recovery contains 1,140 projects across 183 live organizations, but several project fields remain incomplete. This guide publishes the full annual series and its calculation rules.

## GSoC organizations and projects by year use two units

An organization count measures distinct normalized profiles in one annual cohort. A project count measures accepted project records attached to that year.

The same organization can appear in many years, so annual organization counts cannot be added to obtain unique organizations. Project counts can be summed across years when each record belongs to exactly one year.

The archive contains 524 normalized organization profiles across 2016 through 2026. That is a cross-year identity count, not an annual cohort size.

## The annual table separates final and non-final data

The yearly snapshots report these values as of September 3, 2026.

| Year | Organizations | Projects | First-time field | Returning field | Status |
|---:|---:|---:|---:|---:|---|
| 2016 | 178 | 1,032 | 178* | 0* | Finalized |
| 2017 | 201 | 1,127 | 71 | 130 | Finalized |
| 2018 | 212 | 1,071 | 49 | 163 | Finalized |
| 2019 | 206 | 1,134 | 31 | 175 | Finalized |
| 2020 | 199 | 1,107 | 33 | 166 | Finalized |
| 2021 | 202 | 1,204 | 41 | 161 | Finalized |
| 2022 | 202 | 1,054 | 34 | 168 | Finalized |
| 2023 | 168 | 904 | 19 | 149 | Finalized |
| 2024 | 195 | 1,127 | 34 | 161 | Finalized |
| 2025 | 185 | 1,191 | 14 | 171 | Finalized |
| 2026 | 183 | 1,140 | 17 | 166 | Recovered, non-final |

The 2016 first-time and returning fields reflect the start of local coverage, not lifetime program history. They must not be interpreted as 178 genuinely new organizations.

## Finalized 2016 to 2025 projects total 10,951

Adding the ten finalized annual project counts produces 10,951. The calculation excludes 2026 from the finalized total.

:::stat 10,951 | Project records in finalized local snapshots from 2016 through 2025

Adding the recovered 1,140 records for 2026 gives 12,091 observed projects across the full local window, but the combined number mixes finalized and non-final snapshots. Use it only with that warning.

The largest finalized annual project count in this window is 1,204 in 2021. The smallest is 904 in 2023. Those are descriptive endpoints, not evidence of program success or failure.

## Annual organization counts range from 168 to 212

The largest organization cohort in the covered table is 212 in 2018. The smallest is 168 in 2023, a difference of 44 profiles.

:::stat 44 organizations | Difference between the largest and smallest annual cohorts in the covered window

Annual selection depends on organization applications, program decisions and capacity. The series does not establish a permanent trend. A line between two years can hide reversals visible in the full table.

Use the [yearly explorer](/yearly) to open each cohort and inspect its projects rather than judging from the count alone.

## Project counts and organization counts move differently

Projects per organization reveal distribution at a coarse annual level. Divide project count by organization count and state that the result is a mean.

For 2025, `1,191 / 185 = 6.44`, reported in the snapshot as 6.4. For the live 2026 recovery, `1,140 / 183 = 6.23`, reported as 6.2.

A mean does not describe a typical organization when large umbrellas hold many projects. The median 2026 organization has 4 projects, lower than the 6.2 mean. Publish both when discussing the current distribution.

## The 2026 denominator changed after withdrawals

Google announced 185 organizations for 2026. Two later withdrew, leaving 183 live organizations in the reconciled snapshot.

Use 185 for announcement-day composition and 183 for current live comparisons. Do not silently switch denominators inside one percentage.

The official [2026 program page](https://summerofcode.withgoogle.com/programs/2026) remains the authority for current program status. Google's [program archive](https://summerofcode.withgoogle.com/programs) provides the year entry points. Local withdrawal records preserve the reason a historical count may differ from a later one.

## The 2026 recovery is complete for some fields only

The local 2026 snapshot marks projects, contributors and descriptions available. It marks mentors, code URLs, project tags, difficulty, completion status and timestamps unavailable or incomplete.

Therefore, 1,140 accepted project records and their organization links can support project-volume analysis. The snapshot cannot support a current mentor-total comparison, language-by-project table or completion-rate claim.

Missing must remain `null` or explicitly unavailable. Replacing it with zero would state that no mentors existed, which is false.

## First-time counts depend on the observation window

For years after 2016, the local first-time field asks whether a normalized profile appeared earlier in the covered archive. In 2025, 14 of 185 were first appearances within the window. In 2026, 17 of 183 live profiles were first appearances.

The 2016 boundary has no earlier local year, so every profile is mechanically classified first. Exclude that row from claims about genuinely new organizations.

The [first-time organization guide](/blog/post/first-time-gsoc-organizations) explains identity and live-denominator checks.

## Returning counts measure identity recurrence

Returning fields depend on normalized identities. Name changes, foundation changes and umbrella restructuring can create false first appearances or false continuity if merged carelessly.

Our method preserves source names, uses canonical local slugs and applies known reconciliation. Ambiguous cases remain separate until evidence connects them.

The [returning organization analysis](/blog/post/returning-gsoc-organizations) adds total appearances, current streaks and observed gaps. None of these measures current mentor availability.

## Compare year-over-year change with both values

A percentage change should show start, end and formula. From 2023 to 2024, projects increased from 904 to 1,127. The change is `(1,127 - 904) / 904 × 100 = 24.7%`.

That does not mean opportunity for an individual rose 24.7 percent. Cohort composition, project sizes, applicant demand and mentor capacity also changed.

Use year-over-year change to describe records, not causality. Do not attach reasons without primary evidence.

## Do not infer acceptance odds from annual projects

Accepted project totals provide the numerator for some global descriptive ratios, but this dataset does not contain complete annual applicant and proposal denominators for every row.

Even a global ratio cannot estimate personal odds for a particular project. Organizations review fit, interaction and technical evidence, rank proposals with mentors and receive limited slots.

The [acceptance-rate guide](/blog/post/gsoc-acceptance-rate-selection-process) documents the 2026 official denominators and explains the selection process.

## Do not infer programming-language totals from profile tags

Technology tags live on accumulated organization profiles. Intersecting a global tag with every active year would pretend the tag applied in all those years.

Project records lack complete normalized language labels across the full window. Therefore, yearly language-project totals require a separate project-level classification method and validation sample.

The [programming-language guide](/blog/post/gsoc-organizations-by-programming-language) limits its current counts to matching profiles and states the alias set.

## Reproduce the yearly calculation

A reproducible workflow has six steps.

1. Load one annual snapshot.
2. Verify its `year`, `finalized` flag and completeness metadata.
3. Count organization records after documented withdrawal treatment.
4. Count project records with valid year and organization identity.
5. Compare computed counts with stored metrics.
6. Report differences and stop publication until reconciled.

Save tool version, source date and output. Do not manually edit a total to match an expected press release.

## Use the table for practical research

Yearly data can answer which projects existed, how an organization's scope changed and where archived work may help. Open the relevant cohort, then the organization and project record.

For application planning, prioritize current ideas and repositories. Historical projects supply context, alternative approaches and maintenance clues. They do not reserve or recreate an old idea.

Use the [organization data guide](/blog/post/how-to-use-gsoc-organizations-data) to build a shortlist without confusing interest with evidence.

## Maintain an explicit update ledger

Every refresh should record source, snapshot state, added or removed profiles, withdrawal changes, identity merges and field-completeness changes.

Recalculate derived totals after any identity or withdrawal update. Keep old reported values in the ledger so readers can explain why a count changed.

GSoC organizations and projects by year are valuable when their boundaries remain visible. The table supports history and discovery, while current official sources and project-level research still control application decisions.

## Check concentration without naming it competition

Project distribution can be summarized with quantiles or concentration shares, but it still cannot reveal applicant demand. For 2026, the median is 4 projects while the largest observed profile has 34.

Report the top-share calculation only as accepted-project concentration. Explain umbrella structures and do not label high-volume profiles easier or harder.

This analysis can help interface design by showing whether a typical profile page and a large umbrella page need different navigation. It should never become a personal selection forecast.

## Export tables with their metadata

A reusable table should travel with year, retrieval time, finalized flag, unit definitions, withdrawal handling, schema version and source links.

CSV or JSON without that sidecar invites later misuse. Include nulls for missing values and avoid converting display labels into identifiers. Preserve Unicode names and source slugs.

When a consumer needs only counts, publish the smallest aggregate that answers the question. Data minimization reduces privacy and maintenance risk.

Validate exported totals against the rendered article so the download, sitemap and prose never describe different snapshots.
