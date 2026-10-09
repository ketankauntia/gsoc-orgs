import Link from "next/link";
import { IconArrowLeft, IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import type { ContributorWork } from "@/lib/hub/public";
import type { YearlyPageData } from "@/lib/yearly-page-types";
import { ContributorWorkSection } from "../contributor-work";
import { canonicalTechnology } from "@/lib/vocabulary/catalog";
import { cobaltOrganization, cobaltOrganizations, CURRENT_YEAR, programSeries, YEARS, type CobaltOrg } from "../data";
import { countWord, techLabel } from "../labels";
import { PageHead, SectionHead } from "../page";
import { BarList, ColumnChart, Dumbbell, fmt, Histogram, Logo, plural, StatTile } from "../ui";
import { pickPosts, PostCards } from "../posts";

interface YearProject { id: string; t: string; o: string; s: string; c: string | null; m: string[] }
import "../yearly.css";

const yearHref = (year: number) => `/yearly/google-summer-of-code-${year}`;
const takesPart = (org: CobaltOrg, year: number) => org.activeYears.includes(year) && !org.withdrawnYears.includes(year);
const norm = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

function ordinal(value: number) {
  const tens = value % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th";
  return `${value}${suffix}`;
}

/** Where a first-time organization went after its first cycle. */
function firstTimerNote(org: CobaltOrg, year: number) {
  if (year === CURRENT_YEAR) return "First cycle";
  if (org.cycles <= 1) return "Only this cycle";
  return org.inCurrent ? `${org.cycles} cycles, in GSoC ${CURRENT_YEAR}` : `${org.cycles} cycles, last in ${org.lastYear}`;
}

const SOURCE = `Data: Google Summer of Code public archive. Contributor counts are accepted projects. Participation history is not a prediction of selection.`;

/* ------------------------------------------------------------------ */
/* /yearly */

export function YearlyIndexView({ years }: { years: number[] }) {
  const series = programSeries();
  const available = new Set(years);
  const now = series[series.length - 1];
  const last = series[series.length - 2];
  const total = series.reduce((sum, row) => sum + row.slots, 0);
  const everOrgs = cobaltOrganizations().filter((org) => org.cycles > 0).length;
  const peak = series.reduce((best, row) => (row.slots > best.slots ? row : best), series[0]);
  const mentorIndex = series.map((row) => row.mentors).findLastIndex((value) => value !== null);
  const mentorRow = series[mentorIndex];
  const cards = [...series].reverse();
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Program years" }]}
        eyebrow="PROGRAM YEARS"
        title={<>{countWord(series.length, true)} cycles <span className="cb-serif">of Google Summer of Code</span></>}
        lede={`Every cycle from ${YEARS[0]} to ${CURRENT_YEAR} has its own page: the organizations, the first-timers, the technologies, and every accepted project with its contributor and mentors.`}
        aside={<Link href={yearHref(CURRENT_YEAR)} className="cb-button cb-button-outline">Open GSoC {CURRENT_YEAR} <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label="Cycles" value={series.length} context={`${YEARS[0]} to ${CURRENT_YEAR}`} />
          <StatTile label="Organizations" value={fmt(everOrgs)} context="Took part at least once" />
          <StatTile label="Contributors" value={fmt(total)} context={`Accepted projects since ${YEARS[0]}`} />
          <StatTile label="Busiest cycle" value={peak.year} context={`${fmt(peak.slots)} contributors`} />
          <StatTile label={`New in ${CURRENT_YEAR}`} value={now.firstTime ?? 0} context={`Organizations; ${last.firstTime ?? 0} in ${last.year}`} accent />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        <section aria-labelledby="cb-yr-trend">
          <SectionHead id="cb-yr-trend" eyebrow="PER CYCLE" title="Organizations, contributors and mentors" quiet={`${YEARS[0]} to ${CURRENT_YEAR}.`} />
          <article className="cb-card">
            <div className="cb-multiples cb-yr-multiples">
              {[
                { title: "Organizations", values: series.map((row) => row.orgs), value: now.orgs, context: `in ${CURRENT_YEAR}, ${last.orgs} in ${last.year}`, accent: series.length - 1 },
                { title: "Contributors", values: series.map((row) => row.slots), value: now.slots, context: `in ${CURRENT_YEAR}, ${fmt(last.slots)} in ${last.year}`, accent: series.length - 1 },
                { title: "Mentors", values: series.map((row) => row.mentors), value: mentorRow?.mentors ?? 0, context: mentorRow && mentorRow.year !== CURRENT_YEAR ? `in ${mentorRow.year}; ${CURRENT_YEAR} not published yet` : `in ${CURRENT_YEAR}`, accent: Math.max(0, mentorIndex) },
              ].map((chart) => (
                <div key={chart.title} className="cb-multiple">
                  <p className="cb-multiple-title">{chart.title}</p>
                  <p className="cb-multiple-value">{fmt(chart.value)} <small>{chart.context}</small></p>
                  <ColumnChart compact height={132} labels={YEARS} series={{ label: chart.title, values: chart.values }} accent={chart.accent} caption={`${chart.title} per cycle`} labelValues="none" />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section aria-labelledby="cb-yr-all">
          <SectionHead id="cb-yr-all" eyebrow="EVERY CYCLE" title="Pick a year" />
          <ol className="cb-yr-cards">
            {cards.map((row) => {
              const href = available.has(row.year) ? yearHref(row.year) : null;
              const current = row.year === CURRENT_YEAR;
              return (
                <li key={row.year}>
                  <article className="cb-yr-card" data-current={current || undefined}>
                    <header className="cb-yr-card-head">
                      <h3>
                        <small>GSoC</small>
                        {href ? <Link href={href} className="cb-row-link">{row.year}</Link> : row.year}
                      </h3>
                      {current ? <span className="cb-badge" data-tone="accent">Current cycle</span> : <span className="cb-yr-edition">{ordinal(row.year - 2004)} edition</span>}
                    </header>
                    <dl>
                      <div><dt>Organizations</dt><dd>{fmt(row.orgs)}</dd></div>
                      <div><dt>Contributors</dt><dd>{fmt(row.slots)}</dd></div>
                      <div><dt>First-time orgs</dt><dd>{row.firstTime === null ? <span className="cb-yr-na" title={`The archive starts in ${YEARS[0]}`}>–</span> : fmt(row.firstTime)}</dd></div>
                      <div><dt>Mentors</dt><dd>{row.mentors === null ? <span className="cb-yr-na" title="Not published yet">–</span> : fmt(row.mentors)}</dd></div>
                    </dl>
                    <p className="cb-yr-card-foot">
                      <span>Median {fmt(row.median)} per organization</span>
                      {href ? <IconArrowRight size={16} stroke={2} aria-hidden /> : null}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
          <p className="cb-results-note">{SOURCE} Mentor totals for {CURRENT_YEAR} are published after the cycle.</p>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* /yearly/[slug] */

function technologyRows(orgs: CobaltOrg[], index: number) {
  const rows = new Map<string, { value: string; label: string; now: number; nowOrgs: number; then: number; thenOrgs: number }>();
  for (const org of orgs) {
    const seen = new Set<string>();
    for (const raw of org.technologies) {
      if (norm(raw) === "c/c++") continue;
      let slug: string;
      let name: string;
      try {
        ({ slug, name } = canonicalTechnology(raw));
      } catch {
        continue;
      }
      if (seen.has(slug)) continue;
      seen.add(slug);
      const row = rows.get(slug) ?? { value: slug, label: techLabel(name), now: 0, nowOrgs: 0, then: 0, thenOrgs: 0 };
      if (takesPart(org, YEARS[index])) { row.now += org.slots[index]; row.nowOrgs += 1; }
      if (index > 0 && takesPart(org, YEARS[index - 1])) { row.then += org.slots[index - 1]; row.thenOrgs += 1; }
      rows.set(slug, row);
    }
  }
  return [...rows.values()].filter((row) => row.now > 0).sort((a, b) => b.now - a.now || a.label.localeCompare(b.label)).slice(0, 12);
}

const SIZE_BUCKETS = [
  { label: "1", test: (n: number) => n === 1 },
  { label: "2", test: (n: number) => n === 2 },
  { label: "3–5", test: (n: number) => n >= 3 && n <= 5 },
  { label: "6–10", test: (n: number) => n >= 6 && n <= 10 },
  { label: "11–20", test: (n: number) => n >= 11 && n <= 20 },
  { label: "21+", test: (n: number) => n > 20 },
];

export function YearDetailView({ data, work }: { data: YearlyPageData; work: ContributorWork }) {
  const { year, metrics } = data;
  const index = YEARS.indexOf(year);
  const series = programSeries();
  const row = index >= 0 ? series[index] : null;
  const prevRow = index > 0 ? series[index - 1] : null;
  const prevYear = index > 0 ? YEARS[index - 1] : null;
  const nextYear = index >= 0 && index < YEARS.length - 1 ? YEARS[index + 1] : null;
  const counts = data.counts ?? { announced: metrics.total_organizations, participating: metrics.total_organizations, withdrawn: 0 };
  const isFirst = index === 0;

  const all = cobaltOrganizations();
  const taking = index >= 0 ? all.filter((org) => takesPart(org, year)) : [];
  const bySlots = [...taking].sort((a, b) => b.slots[index] - a.slots[index] || a.name.localeCompare(b.name));
  const top = bySlots.slice(0, 10);
  const sizes = taking.map((org) => org.slots[index]).filter((value) => value > 0);
  const buckets = SIZE_BUCKETS.map((bucket) => ({ label: bucket.label, value: sizes.filter(bucket.test).length }));
  const modal = buckets.reduce((best, bucket) => (bucket.value > best.value ? bucket : best), buckets[0]);
  const tech = index >= 0 ? technologyRows(all, index) : [];
  const withMentors = taking.filter((org) => (org.mentors[index] ?? 0) > 0);
  const mentorTop = [...withMentors].sort((a, b) => (b.mentors[index] ?? 0) - (a.mentors[index] ?? 0) || a.name.localeCompare(b.name)).slice(0, 10);
  const mentorValues = series.map((entry) => entry.mentors);

  const contributors = row?.slots ?? metrics.total_participants;
  const mentors = row?.mentors ?? metrics.total_mentors;
  const median = row?.median ?? 0;
  const firstTime = isFirst ? null : metrics.first_time_organizations;
  const firstPct = firstTime !== null && counts.participating ? Math.round((firstTime / counts.participating) * 100) : 0;

  const firstTimers = isFirst ? [] : data.first_time_orgs
    .map((entry) => ({ entry, org: cobaltOrganization(entry.slug) }))
    .sort((a, b) => (b.org?.slots[index] ?? 0) - (a.org?.slots[index] ?? 0) || a.entry.name.localeCompare(b.entry.name));
  const orgList = [...data.organizations].sort((a, b) =>
    Number(a.status === "withdrawn") - Number(b.status === "withdrawn") || b.project_count - a.project_count || a.name.localeCompare(b.name));
  const names = new Map(data.organizations.map((org) => [org.slug, org.name]));
  const projects: YearProject[] = data.projects
    .map((project) => ({
      id: project.id,
      t: project.title,
      o: names.get(project.org_slug) ?? cobaltOrganization(project.org_slug)?.name ?? project.org_slug,
      s: project.org_slug,
      c: project.contributor?.trim() || null,
      m: (project.mentors ?? []).filter(Boolean),
    }))
    .sort((a, b) => a.o.localeCompare(b.o) || a.t.localeCompare(b.t));
  // Ten projects for the page: one from each of the year's largest organizations, for range.
  const sample: YearProject[] = [];
  for (const entry of orgList) {
    const pick = projects.find((project) => project.s === entry.slug && !sample.includes(project));
    if (pick) sample.push(pick);
    if (sample.length === 10) break;
  }
  const posts = pickPosts({ year, limit: 4 });

  const lede = isFirst
    ? <>{plural(counts.participating, "organization")} took part, and the median one took {fmt(median)} contributors. The archive starts in {year}, so there is no earlier cycle to compare with.</>
    : <>{plural(counts.participating, "organization")} took part, and the median one took {fmt(median)} contributors. {countWord(firstTime ?? 0, true)} {firstTime === 1 ? "was" : "were"} new to the program and {fmt(metrics.returning_organizations)} had taken part before.{counts.withdrawn > 0 ? <> {countWord(counts.withdrawn, true)} announced {counts.withdrawn === 1 ? "organization" : "organizations"} withdrew.</> : null}</>;

  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Program years", href: "/yearly" }, { label: `GSoC ${year}` }]}
        eyebrow={`${year === CURRENT_YEAR ? "CURRENT CYCLE" : "PROGRAM YEAR"} · ${ordinal(year - 2004)} EDITION`}
        title={<>GSoC {year} <span className="cb-serif">with {fmt(contributors)} contributors.</span></>}
        lede={lede}
        aside={
          <nav className="cb-yr-step" aria-label="Other years">
            {prevYear ? <Link href={yearHref(prevYear)} className="cb-button cb-button-outline cb-button-sm"><IconArrowLeft size={15} stroke={2} aria-hidden /> {prevYear}</Link> : null}
            <Link href="/yearly" className="cb-button cb-button-outline cb-button-sm">All years</Link>
            {nextYear ? <Link href={yearHref(nextYear)} className="cb-button cb-button-outline cb-button-sm">{nextYear} <IconArrowRight size={15} stroke={2} aria-hidden /></Link> : null}
          </nav>
        }
      >
        <div className="cb-kpis">
          <StatTile label="Organizations" value={fmt(counts.participating)} context={counts.withdrawn > 0 ? `${counts.announced} announced, ${counts.withdrawn} withdrawn` : isFirst ? "First cycle in the archive" : `${metrics.returning_organizations} returning`} />
          <StatTile label="First time" value={firstTime === null ? "–" : fmt(firstTime)} context={firstTime === null ? `The archive starts in ${year}` : `${firstPct}% of organizations`} accent />
          <StatTile label="Contributors" value={fmt(contributors)} context={metrics.total_projects !== contributors ? `${fmt(metrics.total_projects)} projects listed in the archive` : `${metrics.avg_projects_per_org} per organization`} />
          <StatTile label="Mentors" value={mentors === null ? "–" : fmt(mentors)} context={mentors === null ? "Not published yet" : contributors ? `${(mentors / contributors).toFixed(1)} per contributor` : undefined} />
          <StatTile label="Median per organization" value={fmt(median)} context={prevRow ? `${fmt(prevRow.median)} in ${prevRow.year}` : "Contributors"} />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        {top.length ? (
          <section aria-labelledby="cb-yr-size">
            <SectionHead id="cb-yr-size" eyebrow="ORGANIZATIONS" title={`Where the ${year} contributors went`} />
            <div className="cb-two">
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Most contributors</h3><p>{prevYear ? `${year}, with a tick for ${prevYear}` : `Top ten in ${year}`}</p></div></header>
                {prevYear ? (
                  <BarList
                    rows={top.map((org) => ({ key: org.slug, label: org.name, href: `/organizations/${org.slug}`, logo: org, now: org.slots[index], then: org.slots[index - 1], isNew: !org.activeYears.some((y) => y < year && takesPart(org, y)) }))}
                    nowLabel={String(year)}
                    thenLabel={String(prevYear)}
                    caption={`Organizations with the most contributors in ${year}`}
                  />
                ) : (
                  <ol className="cb-rank">
                    {top.map((org, i) => (
                      <li key={org.slug}>
                        <span className="cb-rank-n">{String(i + 1).padStart(2, "0")}</span>
                        <Link href={`/organizations/${org.slug}`} className="cb-yr-rank-name"><Logo org={org} size="xs" /><span className="cb-truncate">{org.name}</span></Link>
                        <span className="cb-rank-v"><strong>{org.slots[index]}</strong><small>contributors</small></span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Contributors per organization</h3><p>Organizations by the number they took in {year}</p></div></header>
                <Histogram buckets={buckets} emphasis={modal.label} unit="contributors" head={`Contributors in ${year}`} caption={`Organizations by contributors in ${year}`} />
                <p className="cb-card-note"><strong>{plural(modal.value, "organization")}</strong> took {modal.label === "1" ? "one contributor" : `${modal.label.replace("–", " to ")} contributors`}, the most common size. The median was {fmt(median)}.</p>
              </article>
            </div>
          </section>
        ) : null}

        {tech.length ? (
          <section aria-labelledby="cb-yr-tech">
            <SectionHead id="cb-yr-tech" eyebrow="TECHNOLOGIES" title={`Contributor slots by technology`} quiet={prevYear ? `${year} against ${prevYear}.` : `in ${year}.`} />
            <article className="cb-card">
              {prevYear ? (
                <Dumbbell rows={tech} nowLabel={String(year)} thenLabel={String(prevYear)} unit="slots" caption={`Contributor slots by technology in ${year} and ${prevYear}`} hrefFor={(slug) => `/tech-stack/${slug}`} />
              ) : (
                <ol className="cb-rank">
                  {tech.map((item, i) => (
                    <li key={item.value}>
                      <span className="cb-rank-n">{String(i + 1).padStart(2, "0")}</span>
                      <Link href={`/tech-stack/${item.value}`}>{item.label}</Link>
                      <span className="cb-rank-v"><strong>{fmt(item.now)}</strong><small>{item.nowOrgs} orgs</small></span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="cb-card-note">Slots are accepted projects at organizations that list the technology today. Organizations list several, so rows overlap.</p>
            </article>
          </section>
        ) : null}

        {index >= 0 ? (
          <section aria-labelledby="cb-yr-context">
            <SectionHead id="cb-yr-context" eyebrow="IN CONTEXT" title={`${year} among all cycles`} />
            <div className="cb-two">
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Organizations</h3><p>Per cycle, {year} highlighted</p></div></header>
                <ColumnChart labels={YEARS} series={{ label: "Organizations", values: series.map((entry) => entry.orgs) }} accent={index} caption="Organizations per cycle" height={180} labelValues="none" />
              </article>
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Contributors</h3><p>Per cycle, {year} highlighted</p></div></header>
                <ColumnChart labels={YEARS} series={{ label: "Contributors", values: series.map((entry) => entry.slots) }} accent={index} caption="Contributors per cycle" height={180} labelValues="none" />
              </article>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="cb-yr-mentors">
          <SectionHead id="cb-yr-mentors" eyebrow="MENTORS" title={mentors === null ? `Mentors for ${year}` : `${fmt(mentors)} mentors`} quiet={mentors === null ? "are not published yet." : `for ${fmt(contributors)} contributors.`} />
          {mentorTop.length ? (
            <div className="cb-two">
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Most mentors</h3><p>Organizations where every project lists its mentors</p></div></header>
                <ol className="cb-rank">
                  {mentorTop.map((org, i) => (
                    <li key={org.slug}>
                      <span className="cb-rank-n">{String(i + 1).padStart(2, "0")}</span>
                      <Link href={`/organizations/${org.slug}`} className="cb-yr-rank-name"><Logo org={org} size="xs" /><span className="cb-truncate">{org.name}</span></Link>
                      <span className="cb-rank-v"><strong>{org.mentors[index]}</strong><small>{plural(org.slots[index], "contributor")}</small></span>
                    </li>
                  ))}
                </ol>
              </article>
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Mentors per cycle</h3><p>{year} highlighted</p></div></header>
                <ColumnChart labels={YEARS} series={{ label: "Mentors", values: mentorValues }} accent={index} caption="Mentors per cycle" height={180} labelValues="none" />
              </article>
            </div>
          ) : (
            <article className="cb-card">
              <p className="cb-yr-empty">{mentors === null ? `Google publishes mentor names once a cycle ends. The ${year} project list below already has every contributor.` : `Mentor counts per organization are not available for ${year}.`}</p>
            </article>
          )}
        </section>

        {firstTimers.length ? (
          <section aria-labelledby="cb-yr-new">
            <SectionHead id="cb-yr-new" eyebrow="FIRST TIME" title={`${plural(firstTimers.length, "organization")}`} quiet={`new to GSoC in ${year}.`} action={year === CURRENT_YEAR ? { label: "Filter the directory", href: "/organizations?new=1" } : undefined} />
            <ul className="cb-yr-orgs" data-variant="cards">
              {firstTimers.map(({ entry, org }) => (
                <li key={entry.slug} className="cb-yr-org">
                  <Logo org={org ?? { name: entry.name, logo: null }} size="sm" />
                  <div>
                    <Link href={`/organizations/${entry.slug}`} prefetch={false} className="cb-row-link">{entry.name}</Link>
                    <small>{org ? firstTimerNote(org, year) : "New this year"}</small>
                  </div>
                  <span className="cb-yr-org-n" title={`Contributors in ${year}`}>{org ? fmt(org.slots[index]) : "–"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="cb-yr-list">
          <SectionHead id="cb-yr-list" eyebrow={`EVERY ORGANIZATION IN ${year}`} title={plural(counts.participating, "organization")} quiet={counts.withdrawn > 0 ? `plus ${counts.withdrawn} withdrawn.` : "by projects that year."} action={{ label: "Filter the directory", href: `/organizations?year=${year}` }} />
          <ul className="cb-yr-orgs">
            {orgList.map((entry) => {
              const org = cobaltOrganization(entry.slug);
              const withdrawn = entry.status === "withdrawn";
              return (
                <li key={entry.slug} className="cb-yr-org" data-withdrawn={withdrawn || undefined}>
                  <Logo org={org ?? { name: entry.name, logo: null }} size="xs" />
                  <div>
                    <Link href={`/organizations/${entry.slug}`} prefetch={false} className="cb-row-link">{entry.name}</Link>
                  </div>
                  {withdrawn ? <span className="cb-badge">Withdrawn</span> : <span className="cb-yr-org-n" title={`Projects in ${year}`}>{fmt(entry.project_count)}</span>}
                </li>
              );
            })}
          </ul>
        </section>

        {projects.length ? (
          <section aria-labelledby="cb-yr-projects">
            <SectionHead id="cb-yr-projects" eyebrow="PROJECTS AND PEOPLE" title={`${fmt(projects.length)} accepted projects`} quiet="with their contributors and mentors." />
            <ol className="cb-project-list">
              {sample.map((project) => (
                <li key={project.id} className="cb-project">
                  <div className="cb-project-main">
                    <p className="cb-yr-sample-org"><Link href={`/organizations/${project.s}`}>{project.o}</Link></p>
                    <h3><Link href={`/organizations/${project.s}/projects/${project.id}`} className="cb-project-title">{project.t}</Link></h3>
                    <p className="cb-project-people">
                      <span>{project.c ?? "Contributor not listed"}</span>
                      {project.m.length ? <span>Mentored by {project.m.slice(0, 3).join(", ")}{project.m.length > 3 ? ` +${project.m.length - 3}` : ""}</span> : null}
                    </p>
                  </div>
                  <div className="cb-project-links">
                    <Link href={`/organizations/${project.s}/projects/${project.id}`} prefetch={false} className="cb-arrow">Project</Link>
                  </div>
                </li>
              ))}
            </ol>
            <div className="cb-finder-more">
              <Link href={`/projects/${year}`} className="cb-button cb-button-outline">See all {fmt(projects.length)} projects from {year} <IconArrowRight size={16} stroke={2} aria-hidden /></Link>
            </div>
          </section>
        ) : null}

        <ContributorWorkSection
          id="cb-cw-year"
          eyebrow={`SHARED BY THE ${year} COHORT`}
          title="Proposals and progress posts"
          work={work}
          proposalsHref={`/proposals?year=${year}`}
          postsHref={`/contributor-blogs?year=${year}`}
          emptyText={`No ${year} contributor has shared a proposal or progress post yet. Were you one of them?`}
        />

        <PostCards posts={posts} id="cb-yr-posts" eyebrow={`READING FOR GSOC ${year}`} title="Guides for this cycle" quiet="and every one after it." />

        <p className="cb-results-note">
          {SOURCE} <a className="cb-inline-link" href={year === CURRENT_YEAR ? `https://summerofcode.withgoogle.com/programs/${year}/organizations` : `https://summerofcode.withgoogle.com/archive/${year}/organizations`} target="_blank" rel="noreferrer noopener">Official {year} archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}
