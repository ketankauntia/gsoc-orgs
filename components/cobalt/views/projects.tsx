import Link from "next/link";
import { IconArrowLeft, IconArrowRight, IconArrowUpRight, IconCode } from "@tabler/icons-react";
import type { ContributorWork } from "@/lib/hub/public";
import type { ProjectEntryWithYear, ProjectYearPageData } from "@/lib/projects-page-types";
import { workProductLabel, workProductShortLabel } from "@/lib/work-product";
import { canonicalTechnology, technologyHref } from "@/lib/vocabulary/catalog";
import { cobaltOrganization, cobaltOrganizations, CURRENT_YEAR, programSeries, YEARS, type CobaltOrg } from "../data";
import { techLabel } from "../labels";
import { PageHead, SectionHead } from "../page";
import { BarList, ColumnChart, Dumbbell, fmt, Logo, plural, Sparkline, StatTile } from "../ui";
import { ProjectContributorWork } from "../contributor-work";
import { ProjectExplorer, type ExplorerOrg, type ExplorerProject } from "./projects-explorer";
import "../projects.css";

const ARCHIVE = "https://summerofcode.withgoogle.com/archive";
const norm = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

function excerpt(value: unknown, max = 220) {
  const text = clean(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}…`;
}

function change(now: number, then: number) {
  const diff = now - then;
  return { text: diff === 0 ? "same as last cycle" : `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff))} on last cycle`, tone: diff > 0 ? "up" : diff < 0 ? "down" : undefined };
}

/* ------------------------------------------------------------------ */
/* Archive details from the organization file                         */

export interface ArchiveProject {
  title: string;
  summary: string;
  description: string;
  url: string | null;
  code: string | null;
  tags: string[];
  difficulty: string | null;
  status: string | null;
}

interface OrganizationFile {
  years?: Record<string, { projects?: Array<{ title?: string | null; short_description?: string | null; description?: string | null; project_url?: string | null; code_url?: string | null; tags?: string[] | null; difficulty?: string | null; status?: string | null }> } | null>;
}

/** Description, links and tags per project, keyed by `${year}|${projectId}` (the id is the last part of the official URL). */
export function archiveIndex(file: unknown): Map<string, ArchiveProject> {
  const map = new Map<string, ArchiveProject>();
  for (const [key, entry] of Object.entries((file as OrganizationFile | null)?.years ?? {})) {
    const year = Number(key.replace("year_", ""));
    for (const project of entry?.projects ?? []) {
      const id = clean(project.project_url).split("/").filter(Boolean).pop();
      if (!id) continue;
      map.set(`${year}|${id}`, {
        title: clean(project.title),
        summary: clean(project.short_description),
        description: String(project.description ?? "").trim(),
        url: project.project_url || null,
        code: project.code_url || null,
        tags: (project.tags ?? []).filter(Boolean),
        difficulty: project.difficulty ?? null,
        status: project.status ?? null,
      });
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                      */

/** Projects at organizations listing each technology in one cycle (organizations list several, so rows overlap). */
function technologyRows(index: number) {
  const rows = new Map<string, { now: number; nowOrgs: number; then: number; thenOrgs: number }>();
  const active = (org: CobaltOrg, i: number) => i >= 0 && org.activeYears.includes(YEARS[i]) && !org.withdrawnYears.includes(YEARS[i]);
  for (const org of cobaltOrganizations()) {
    const now = active(org, index);
    const then = active(org, index - 1);
    if (!now && !then) continue;
    for (const tech of new Set(org.technologies.map(norm))) {
      if (tech === "c/c++") continue;
      const row = rows.get(tech) ?? { now: 0, nowOrgs: 0, then: 0, thenOrgs: 0 };
      if (now) { row.now += org.slots[index]; row.nowOrgs += 1; }
      if (then) { row.then += org.slots[index - 1]; row.thenOrgs += 1; }
      rows.set(tech, row);
    }
  }
  return [...rows.entries()].map(([value, row]) => ({ value, label: techLabel(value), ...row })).filter((row) => row.now > 0).sort((a, b) => b.now - a.now || b.nowOrgs - a.nowOrgs);
}

function TechChip({ value, pages }: { value: string; pages: Set<string> }) {
  const label = techLabel(value);
  return pages.has(canonicalTechnology(value).slug) ? <Link href={technologyHref(value)} className="cb-tag">{label}</Link> : <span className="cb-tag">{label}</span>;
}

/** Project opens our project page (which links the official GSoC page); code goes straight out. */
function ProjectLinks({ href, code }: { href: string; code: string | null }) {
  return (
    <div className="cb-project-links">
      <Link href={href}>Project <IconArrowRight size={13} stroke={2} aria-hidden /></Link>
      {code ? <a href={code} target="_blank" rel="noreferrer noopener">{workProductShortLabel(code)} <IconArrowUpRight size={13} stroke={2} aria-hidden /></a> : null}
    </div>
  );
}

function ProjectRow({ project, archive, withSummary = true }: { project: ProjectEntryWithYear; archive?: ArchiveProject; withSummary?: boolean }) {
  const summary = withSummary ? excerpt(archive?.summary || project.project_abstract_short || archive?.description || project.project_description) : "";
  const href = `/organizations/${project.org_slug}/projects/${project.project_id}`;
  return (
    <li className="cb-project">
      <div className="cb-project-main">
        <h3><Link href={href} className="cb-project-title">{clean(project.project_title)}</Link></h3>
        <p className="cb-project-people">
          <span>{clean(project.contributor) || "Contributor not listed"}</span>
          {project.mentors?.length ? <span>Mentored by {project.mentors.slice(0, 3).join(", ")}{project.mentors.length > 3 ? ` +${project.mentors.length - 3}` : ""}</span> : null}
        </p>
        {summary ? <p className="cb-project-desc">{summary}</p> : null}
      </div>
      <ProjectLinks href={href} code={archive?.code ?? project.project_code_url ?? null} />
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* /projects                                                          */

export interface YearSummary { year: number; listed: number }

export function ProjectsIndexView({ years }: { years: YearSummary[] }) {
  const series = programSeries();
  const total = series.reduce((sum, row) => sum + row.slots, 0);
  const latest = series.at(-1);
  const before = series.at(-2);
  const peak = series.reduce((best, row) => (row.slots > best.slots ? row : best), series[0]);
  const orgs = cobaltOrganizations();
  const everParticipated = orgs.filter((org) => org.cycles > 0).length;
  const listed = new Map(years.map((entry) => [entry.year, entry]));
  const cards = series.map((row, index) => ({ ...row, top: technologyRows(index)[0] ?? null, previous: index ? series[index - 1].slots : null, listed: listed.get(row.year) })).reverse();
  const allTime = [...orgs].map((org) => ({ org, total: org.slots.reduce((sum, value) => sum + value, 0) })).sort((a, b) => b.total - a.total || a.org.name.localeCompare(b.org.name)).slice(0, 10);
  const thisCycle = orgs.filter((org) => org.inCurrent).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name)).slice(0, 10);
  const latestChange = latest && before ? change(latest.slots, before.slots) : null;
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Projects" }]}
        eyebrow="ACCEPTED PROJECTS"
        title={<>{fmt(total)} accepted projects <span className="cb-quiet">since {YEARS[0]}</span></>}
        lede="Every Google Summer of Code project in the public archive, by cycle. Open a year to search its projects by title, contributor, mentor or organization."
        aside={<Link href={`/projects/${CURRENT_YEAR}`} className="cb-button cb-button-ink">GSoC {CURRENT_YEAR} projects <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label={`Projects since ${YEARS[0]}`} value={fmt(total)} context={`${YEARS.length} cycles`} accent />
          {latest ? <StatTile label={`In GSoC ${latest.year}`} value={fmt(latest.slots)} context={latestChange?.text} /> : null}
          <StatTile label="Busiest cycle" value={peak.year} context={`${fmt(peak.slots)} projects`} />
          <StatTile label="Organizations" value={fmt(everParticipated)} context={`Took part since ${YEARS[0]}`} />
          <StatTile label="Average per cycle" value={fmt(Math.round(total / series.length))} context="Accepted projects" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        <section className="cb-two" aria-label="Projects and organizations per cycle">
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Accepted projects</h3><p>Per cycle</p></div></header>
            <ColumnChart labels={YEARS} series={{ label: "Projects", values: series.map((row) => row.slots) }} caption="Accepted projects per cycle" height={180} />
          </article>
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Organizations taking part</h3><p>Per cycle</p></div></header>
            <ColumnChart labels={YEARS} series={{ label: "Organizations", values: series.map((row) => row.orgs) }} caption="Organizations per cycle" height={180} />
          </article>
        </section>

        <section aria-labelledby="cb-pj-years">
          <SectionHead id="cb-pj-years" eyebrow="BY CYCLE" title="Pick a year" quiet="to see every project." />
          <ul className="cb-pj-year-grid">
            {cards.map((card) => {
              const delta = card.previous === null ? null : card.slots - card.previous;
              return (
                <li key={card.year}>
                  <article className="cb-pj-year">
                    <div className="cb-pj-year-top">
                      <h3><Link href={`/projects/${card.year}`}>{card.year}</Link></h3>
                      {delta === null ? <small>First in archive</small> : <small data-tone={delta > 0 ? "up" : delta < 0 ? "down" : undefined}>{delta === 0 ? "same" : `${delta > 0 ? "+" : "−"}${fmt(Math.abs(delta))}`}</small>}
                    </div>
                    <dl>
                      <div><dt>Projects</dt><dd>{fmt(card.slots)}</dd></div>
                      <div><dt>Organizations</dt><dd>{fmt(card.orgs)}</dd></div>
                      <div><dt>First-time organizations</dt><dd>{card.firstTime === null ? "–" : fmt(card.firstTime)}</dd></div>
                      <div><dt>Top technology</dt><dd>{card.top ? card.top.label : "–"}</dd></div>
                    </dl>
                    <span className="cb-pj-year-go" aria-hidden="true">{card.listed ? `${fmt(card.listed.listed)} project pages` : "Projects"} <IconArrowRight size={14} stroke={2} /></span>
                  </article>
                </li>
              );
            })}
          </ul>
          <p className="cb-card-note">Top technology is the one listed by the organizations with the most projects that cycle. The archive starts in {YEARS[0]}, so no organization counts as first-time that year.</p>
        </section>

        <section className="cb-two" aria-label="Organizations with the most projects">
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Most projects since {YEARS[0]}</h3><p>All cycles</p></div></header>
            <ol className="cb-rank">
              {allTime.map(({ org, total: count }, index) => (
                <li key={org.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/organizations/${org.slug}/projects`} className="cb-pj-rank-name"><Logo org={org} size="xs" /><span className="cb-truncate">{org.name}</span></Link>
                  <span className="cb-rank-v"><strong>{fmt(count)}</strong><small>{org.cycles} cycles</small></span>
                </li>
              ))}
            </ol>
          </article>
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Most projects in {CURRENT_YEAR}</h3><p>This cycle, with last cycle for comparison</p></div></header>
            <ol className="cb-rank">
              {thisCycle.map((org, index) => (
                <li key={org.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/organizations/${org.slug}/projects`} className="cb-pj-rank-name"><Logo org={org} size="xs" /><span className="cb-truncate">{org.name}</span></Link>
                  <span className="cb-rank-v"><strong>{fmt(org.current)}</strong><small>{org.previous ? `${org.previous} in ${CURRENT_YEAR - 1}` : org.isNew ? "new" : `not in ${CURRENT_YEAR - 1}`}</small></span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <p className="cb-results-note">
          Data: Google Summer of Code public archive. A project is one accepted contributor at one organization. <a className="cb-inline-link" href={ARCHIVE} target="_blank" rel="noreferrer noopener">Official GSoC archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* /projects/[year]                                                   */

export function ProjectsYearView({ data }: { data: ProjectYearPageData }) {
  const { year, metrics, projects } = data;
  const index = YEARS.indexOf(year);
  const series = programSeries();
  const row = index >= 0 ? series[index] : null;
  const previousRow = index > 0 ? series[index - 1] : null;
  const accepted = row?.slots ?? metrics.total_projects;
  const yearChange = row && previousRow ? change(row.slots, previousRow.slots) : null;

  // Organizations with the most projects: contributor slots this cycle, with the cycle before as the tick.
  const orgs = cobaltOrganizations();
  const topOrgs = index >= 0
    ? orgs.filter((org) => org.slots[index] > 0).sort((a, b) => b.slots[index] - a.slots[index] || a.name.localeCompare(b.name)).slice(0, 10)
    : [];
  const techs = index >= 0 ? technologyRows(index).slice(0, 10) : [];

  // Explorer payload: only what the list shows.
  const counts = new Map<string, number>();
  for (const project of projects) counts.set(project.org_slug, (counts.get(project.org_slug) ?? 0) + 1);
  const explorerOrgs: Record<string, ExplorerOrg> = {};
  for (const project of projects) {
    if (explorerOrgs[project.org_slug]) continue;
    const org = cobaltOrganization(project.org_slug);
    explorerOrgs[project.org_slug] = { name: org?.name ?? project.org_name, logo: org?.logo ?? null, logoDark: org?.logoDark || undefined, count: counts.get(project.org_slug) ?? 0 };
  }
  const explorerProjects: ExplorerProject[] = projects.map((project) => ({
    i: project.project_id,
    t: clean(project.project_title),
    c: clean(project.contributor),
    m: project.mentors ?? [],
    o: project.org_slug,
    ...(project.project_abstract_short || project.project_description ? { d: excerpt(project.project_abstract_short || project.project_description, 200) } : {}),
  }));

  const firstTime = index > 0 ? data.first_time_orgs.map((entry) => ({ entry, org: cobaltOrganization(entry.slug) })).sort((a, b) => b.entry.project_count - a.entry.project_count || a.entry.name.localeCompare(b.entry.name)) : [];
  const topOrg = topOrgs[0];
  const prevYear = YEARS[index - 1];
  const nextYear = YEARS[index + 1];

  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Projects", href: "/projects" }, { label: String(year) }]}
        eyebrow={`GSOC ${year}`}
        title={<>GSoC {year} <span className="cb-quiet">· {fmt(metrics.total_projects)} projects</span></>}
        lede={<>{plural(metrics.total_projects, "project")} at {plural(metrics.total_organizations, "organization")}, each with its contributor{index >= 0 && row?.mentors !== null ? " and mentors" : ""}. Search the list or start from an organization.</>}
        aside={<Link href={`/organizations?year=${year}`} className="cb-button cb-button-outline">{year} organizations <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <nav className="cb-year-tabs cb-pj-switch cb-scroll-autohide" aria-label="Program year">
          {[...YEARS].reverse().map((option, i) => (
            <Link key={option} href={`/projects/${option}`} aria-current={option === year ? "page" : undefined}>{option}<span>{fmt(series[YEARS.length - 1 - i].slots)}</span></Link>
          ))}
        </nav>
        <div className="cb-kpis">
          <StatTile label="Projects listed" value={fmt(metrics.total_projects)} context={accepted !== metrics.total_projects ? `of ${fmt(accepted)} accepted` : yearChange?.text ?? "In the archive"} accent />
          <StatTile label="Organizations" value={fmt(metrics.total_organizations)} context={`${metrics.avg_projects_per_org} projects each on average`} />
          {index > 0 ? (
            <StatTile label="First-time organizations" value={fmt(data.first_time_orgs.length)} context={plural(metrics.first_time_org_projects, "project")} />
          ) : (
            <StatTile label="First-time organizations" value="–" context={`The archive starts in ${year}`} />
          )}
          <StatTile label="Mentors" value={row?.mentors ? fmt(row.mentors) : "–"} context={row?.mentors ? "Named on accepted projects" : "Not published yet"} />
          {topOrg ? <StatTile label="Most projects" value={<span className="cb-pj-ellipsis">{topOrg.name}</span>} context={plural(topOrg.slots[index], "project")} /> : null}
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        {topOrgs.length || techs.length ? (
          <section className="cb-two" aria-label={`Organizations and technologies in ${year}`}>
            {topOrgs.length ? (
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Organizations with the most projects</h3><p>{previousRow ? `${year}, with ${previousRow.year} as the tick` : String(year)}</p></div></header>
                {previousRow ? (
                  <BarList
                    rows={topOrgs.map((org) => ({ key: org.slug, label: org.name, href: `/organizations/${org.slug}/projects`, logo: org, now: org.slots[index], then: org.slots[index - 1], isNew: org.firstYear === year }))}
                    nowLabel={String(year)}
                    thenLabel={String(previousRow.year)}
                    caption={`Organizations with the most projects in ${year}`}
                  />
                ) : (
                  <ol className="cb-rank">
                    {topOrgs.map((org, i) => (
                      <li key={org.slug}>
                        <span className="cb-rank-n">{String(i + 1).padStart(2, "0")}</span>
                        <Link href={`/organizations/${org.slug}/projects`} className="cb-pj-rank-name"><Logo org={org} size="xs" /><span className="cb-truncate">{org.name}</span></Link>
                        <span className="cb-rank-v"><strong>{org.slots[index]}</strong></span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            ) : null}
            {techs.length ? (
              <article className="cb-card">
                <header className="cb-card-head"><div><h3>Projects by technology</h3><p>At organizations that list it</p></div></header>
                {previousRow ? (
                  <Dumbbell rows={techs} nowLabel={String(year)} thenLabel={String(previousRow.year)} unit="projects" caption={`Projects by technology in ${year}`} hrefFor={(value) => technologyHref(value)} />
                ) : (
                  <ol className="cb-rank">
                    {techs.map((tech, i) => (
                      <li key={tech.value}>
                        <span className="cb-rank-n">{String(i + 1).padStart(2, "0")}</span>
                        <Link href={technologyHref(tech.value)}>{tech.label}</Link>
                        <span className="cb-rank-v"><strong>{fmt(tech.now)}</strong><small>{tech.nowOrgs} orgs</small></span>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="cb-card-note">Organizations list several technologies, so rows overlap. Lists are the organizations&apos; current ones.</p>
              </article>
            ) : null}
          </section>
        ) : null}

        {firstTime.length ? (
          <section aria-labelledby="cb-pj-new">
            <SectionHead id="cb-pj-new" eyebrow="FIRST TIME" title={`${plural(firstTime.length, "organization")} new in ${year}`} quiet={`with ${plural(metrics.first_time_org_projects, "project")}.`} />
            <div className="cb-chip-cloud cb-pj-chips">
              {firstTime.map(({ entry, org }) => (
                <Link key={entry.slug} href={`/organizations/${entry.slug}`}>
                  <Logo org={{ name: entry.name, logo: org?.logo ?? null, logoDark: org?.logoDark }} size="xs" />
                  {org?.name ?? entry.name}<span>{entry.project_count}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="cb-pj-all">
          <SectionHead id="cb-pj-all" eyebrow="EVERY PROJECT" title={`All ${fmt(projects.length)} projects`} quiet={`from GSoC ${year}.`} />
          <ProjectExplorer year={year} projects={explorerProjects} orgs={explorerOrgs} />
        </section>

        <nav className="cb-pj-pager" aria-label="Other years">
          {prevYear ? <Link href={`/projects/${prevYear}`}><small><IconArrowLeft size={12} stroke={2} aria-hidden /> Earlier</small><span>GSoC {prevYear}</span></Link> : null}
          {nextYear ? <Link href={`/projects/${nextYear}`} data-next=""><small>Later <IconArrowRight size={12} stroke={2} aria-hidden /></small><span>GSoC {nextYear}</span></Link> : null}
        </nav>

        <p className="cb-results-note">
          Data: Google Summer of Code public archive. {accepted !== metrics.total_projects ? `The archive lists ${fmt(metrics.total_projects)} of the ${fmt(accepted)} projects accepted in ${year}. ` : ""}<a className="cb-inline-link" href={`${ARCHIVE}/${year}/projects`} target="_blank" rel="noreferrer noopener">Official {year} archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* /organizations/[slug]/projects                                     */

export function OrganizationProjectsView({ slug, name, groups, archive }: {
  slug: string;
  name: string;
  groups: Array<{ year: number; projects: ProjectEntryWithYear[] }>;
  archive: Map<string, ArchiveProject>;
}) {
  const org = cobaltOrganization(slug);
  const total = groups.reduce((sum, group) => sum + group.projects.length, 0);
  const perYear = YEARS.map((year) => groups.find((group) => group.year === year)?.projects.length ?? 0);
  const busiest = groups.reduce<{ year: number; count: number } | null>((best, group) => (!best || group.projects.length > best.count ? { year: group.year, count: group.projects.length } : best), null);
  const mentors = new Set(groups.flatMap((group) => group.projects.flatMap((project) => project.mentors ?? [])).map((mentor) => mentor.trim()).filter(Boolean));
  const current = groups.find((group) => group.year === CURRENT_YEAR)?.projects.length ?? 0;
  const first = groups.at(-1)?.year;
  const last = groups[0]?.year;
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Organizations", href: "/organizations" }, { label: name, href: `/organizations/${slug}` }, { label: "Projects" }]}
        eyebrow="PROJECTS"
        title={<>{name} <span className="cb-quiet">GSoC projects</span></>}
        lede={total ? <>{plural(total, "accepted project")} across {plural(groups.length, "cycle")}{first && last && first !== last ? `, ${first} to ${last}` : first ? ` in ${first}` : ""}. Each one links to its contributor, mentors and code.</> : <>No archived Google Summer of Code projects are recorded for {name} yet.</>}
        aside={
          <Link href={`/organizations/${slug}`} className="cb-button cb-button-outline">
            {org ? <Logo org={org} size="xs" /> : <IconArrowLeft size={16} stroke={2} aria-hidden />}
            Organization profile
          </Link>
        }
      >
        {total ? (
          <div className="cb-kpis">
            <StatTile label="Projects listed" value={fmt(total)} context={`Across ${plural(groups.length, "cycle")}`} accent />
            <StatTile label={`In GSoC ${CURRENT_YEAR}`} value={current ? fmt(current) : "–"} context={current ? (org?.isNew ? "First cycle" : org?.previous ? `${org.previous} in ${CURRENT_YEAR - 1}` : "Back this cycle") : "Not taking part"} />
            {busiest ? <StatTile label="Busiest cycle" value={busiest.year} context={plural(busiest.count, "project")} /> : null}
            <StatTile label="Mentors named" value={mentors.size ? fmt(mentors.size) : "–"} context={mentors.size ? "Across all listed projects" : "Not published"} />
            <StatTile label="First cycle" value={first ?? "–"} context={last ? `Latest ${last}` : undefined} />
          </div>
        ) : null}
      </PageHead>

      <div className="cb-page cb-page-body">
        {groups.length > 1 ? (
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Projects per cycle</h3><p>{name}, {YEARS[0]} to {YEARS.at(-1)}</p></div></header>
            <ColumnChart labels={YEARS} series={{ label: "Projects", values: perYear }} caption={`${name} projects per cycle`} height={150} />
          </article>
        ) : null}

        {groups.length ? (
          <div>
            {groups.length > 1 ? (
              <nav className="cb-year-tabs cb-pj-jump cb-scroll-autohide" aria-label="Jump to year">
                {groups.map((group) => <a key={group.year} href={`#y${group.year}`}>{group.year}<span>{group.projects.length}</span></a>)}
              </nav>
            ) : null}
            <div className="cb-pj-yearlist">
              {groups.map((group) => (
                <section key={group.year} id={`y${group.year}`} aria-labelledby={`cb-pj-y${group.year}`}>
                  <SectionHead id={`cb-pj-y${group.year}`} eyebrow={`GSOC ${group.year}`} title={plural(group.projects.length, "project")} quiet={`at ${name}.`} action={{ label: `All ${group.year} projects`, href: `/projects/${group.year}` }} />
                  <ol className="cb-project-list">
                    {group.projects.map((project) => <ProjectRow key={project.project_id} project={project} archive={archive.get(`${group.year}|${project.project_id}`)} />)}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="cb-empty">
            <h2>No projects in the archive</h2>
            <p>Google has not published projects for {name} yet.</p>
            <div><Link href={`/organizations/${slug}`} className="cb-button cb-button-outline cb-button-sm">Back to {name}</Link></div>
          </div>
        )}

        <p className="cb-results-note">
          Data: Google Summer of Code public archive. <a className="cb-inline-link" href={ARCHIVE} target="_blank" rel="noreferrer noopener">Official GSoC archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* /organizations/[slug]/projects/[projectId]                         */

function Paragraphs({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  return <div className="cb-pj-desc">{blocks.map((block, index) => <p key={index}>{block}</p>)}</div>;
}

const shortTitle = (value: string, max = 48) => (value.length <= max ? value : `${value.slice(0, Math.max(value.lastIndexOf(" ", max), max - 12))}…`);

export function ProjectView({ project, siblings, archive, techPages, work }: {
  project: ProjectEntryWithYear;
  /** Every project at the organization in the same year, in archive order (includes this one). */
  siblings: ProjectEntryWithYear[];
  archive: Map<string, ArchiveProject>;
  /** Technology slugs that have a page. */
  techPages: Set<string>;
  /** Proposal, progress posts and verified people shared on this site. */
  work: ContributorWork;
}) {
  const details = archive.get(`${project.year}|${project.project_id}`);
  const org = cobaltOrganization(project.org_slug);
  const orgName = org?.name ?? project.org_name;
  const title = clean(project.project_title);
  const description = details?.description || String(project.project_description ?? "").trim() || details?.summary || clean(project.project_abstract_short);
  // The summary often repeats the start of the description; show it only when it adds something.
  const summary = clean(details?.summary || project.project_abstract_short);
  const lede = summary && !clean(description).startsWith(summary.slice(0, 80)) ? excerpt(summary, 240) : "";
  const url = details?.url ?? project.project_url ?? null;
  const code = details?.code ?? project.project_code_url ?? null;
  const status = project.status ?? details?.status ?? null;
  const difficulty = project.difficulty ?? details?.difficulty ?? null;
  const tags = [...new Set([...(project.tech_stack ?? []), ...(details?.tags ?? [])].map(norm))];
  const position = siblings.findIndex((entry) => entry.project_id === project.project_id);
  const previous = position > 0 ? siblings[position - 1] : null;
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null;
  const others = siblings.filter((entry) => entry.project_id !== project.project_id);
  const yearIndex = YEARS.indexOf(project.year);
  const orgTotal = org ? org.slots.reduce((sum, value) => sum + value, 0) : null;
  const programLine = [status === "completed" ? "Completed" : status === "in-progress" ? "In progress" : null, difficulty ? `${difficulty[0].toUpperCase()}${difficulty.slice(1)} difficulty` : null].filter(Boolean).join(" · ");
  const hrefFor = (entry: ProjectEntryWithYear) => `/organizations/${entry.org_slug}/projects/${entry.project_id}`;
  return (
    <main>
      <PageHead
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Organizations", href: "/organizations" },
          { label: orgName, href: `/organizations/${project.org_slug}` },
          { label: "Projects", href: `/organizations/${project.org_slug}/projects` },
          { label: shortTitle(title) },
        ]}
        eyebrow={`GSOC ${project.year} PROJECT`}
        title={title}
        lede={lede || undefined}
        aside={url || code ? (
          <>
            {url ? <a href={url} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-ink">Official project <IconArrowUpRight size={16} stroke={2} aria-hidden /></a> : null}
            {code ? <a href={code} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-outline"><IconCode size={16} stroke={1.75} aria-hidden /> {workProductLabel(code)}</a> : null}
          </>
        ) : undefined}
      >
        <dl className="cb-pj-facts">
          <div><dt>Contributor</dt><dd>{clean(project.contributor) || "Not listed"}</dd></div>
          <div><dt>{project.mentors?.length === 1 ? "Mentor" : "Mentors"}</dt><dd>{project.mentors?.length ? project.mentors.join(", ") : "Not published"}</dd></div>
          <div><dt>Organization</dt><dd><Link href={`/organizations/${project.org_slug}`}>{orgName}</Link>{org?.category ? <small>{org.category}</small> : null}</dd></div>
          <div><dt>Program</dt><dd><Link href={`/projects/${project.year}`}>GSoC {project.year}</Link>{programLine ? <small>{programLine}</small> : null}</dd></div>
        </dl>
      </PageHead>

      <div className="cb-page cb-page-body">
        <div className="cb-pj-layout">
          <div>
            <article className="cb-card">
              <header className="cb-card-head"><div><h2>About this project</h2><p>Description from the program archive</p></div></header>
              {description ? <Paragraphs text={description} /> : <p className="cb-card-note">Google has not published a description for this project.</p>}
              {tags.length ? (
                <div className="cb-pj-tags">
                  <p>Tags</p>
                  <div className="cb-tags cb-tags-lg">{tags.map((tag) => <TechChip key={tag} value={tag} pages={techPages} />)}</div>
                </div>
              ) : null}
            </article>

            <ProjectContributorWork work={work} externalId={project.project_id} />

            {others.length ? (
              <section aria-labelledby="cb-pj-more">
                <SectionHead id="cb-pj-more" eyebrow={`GSOC ${project.year}`} title={`More ${orgName} projects`} quiet={`in ${project.year}.`} action={{ label: "All projects", href: `/organizations/${project.org_slug}/projects` }} />
                <ol className="cb-project-list">
                  {others.map((entry) => <ProjectRow key={entry.project_id} project={entry} archive={archive.get(`${entry.year}|${entry.project_id}`)} withSummary={false} />)}
                </ol>
              </section>
            ) : null}

            {previous || next ? (
              <nav className="cb-pj-pager" aria-label={`Other ${orgName} projects in ${project.year}`}>
                {previous ? <Link href={hrefFor(previous)}><small><IconArrowLeft size={12} stroke={2} aria-hidden /> Previous</small><span>{clean(previous.project_title)}</span></Link> : null}
                {next ? <Link href={hrefFor(next)} data-next=""><small>Next <IconArrowRight size={12} stroke={2} aria-hidden /></small><span>{clean(next.project_title)}</span></Link> : null}
              </nav>
            ) : null}
          </div>

          <aside className="cb-pj-side" aria-label="Organization">
            <div className="cb-card">
              <div className="cb-pj-org">
                <Logo org={org ?? { name: orgName, logo: null }} size="md" />
                <div>
                  <h3><Link href={`/organizations/${project.org_slug}`}>{orgName}</Link></h3>
                  {org?.category ? <p>{org.category}</p> : null}
                </div>
              </div>
              <dl className="cb-pj-org-stats">
                <div><dt>In {project.year}</dt><dd>{fmt(org && yearIndex >= 0 && org.slots[yearIndex] ? org.slots[yearIndex] : siblings.length)}</dd></div>
                {orgTotal !== null ? <div><dt>Since {YEARS[0]}</dt><dd>{fmt(orgTotal)}</dd></div> : null}
                {org ? <div><Sparkline values={org.slots} years={YEARS} name={org.name} width={88} height={26} /></div> : null}
              </dl>
              <div className="cb-pj-actions">
                <Link href={`/organizations/${project.org_slug}`} className="cb-button cb-button-outline cb-button-sm">Profile</Link>
                <Link href={`/organizations/${project.org_slug}/projects`} className="cb-button cb-button-outline cb-button-sm">All projects</Link>
              </div>
            </div>
            {org?.technologies.length ? (
              <div className="cb-card">
                <header className="cb-card-head"><div><h3>Technologies</h3><p>Listed by {orgName}</p></div></header>
                <div className="cb-tags cb-tags-lg">{org.technologies.map((tech) => <TechChip key={tech} value={tech} pages={techPages} />)}</div>
              </div>
            ) : null}
          </aside>
        </div>

        <p className="cb-results-note">
          Data: Google Summer of Code public archive. {url ? <a className="cb-inline-link" href={url} target="_blank" rel="noreferrer noopener">This project in the official archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a> : null}
        </p>
      </div>
    </main>
  );
}
