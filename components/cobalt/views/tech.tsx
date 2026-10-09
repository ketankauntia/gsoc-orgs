import Link from "next/link";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import type { TechStackIndexData, TechStackPageData } from "@/lib/tech-stack-page-types";
import { isTaxonomyIndexEligible } from "@/lib/search-index-policy";
import { technologyHref } from "@/lib/vocabulary/catalog";
import { cobaltOrganization, cobaltOrganizations, CURRENT_YEAR, programSeries, technologyDemand, YEARS, type CobaltOrg } from "../data";
import { Finder } from "../finder";
import { techLabel } from "../labels";
import { AZList, OrgTable, PageHead, SectionHead } from "../page";
import { ColumnChart, Dumbbell, fmt, plural, StatTile } from "../ui";

const norm = (value: string) => value.trim().toLocaleLowerCase("en");

export function TechIndexView({ data }: { data: TechStackIndexData }) {
  const demand = technologyDemand(12);
  const slots = programSeries().at(-1)?.slots ?? 0;
  const top = demand.rows[0];
  const growing = data.charts.fastest_growing.slice(0, 8);
  const mostOrgs = [...data.all_techs].sort((a, b) => b.org_count - a.org_count).slice(0, 10);
  const current = data.charts.most_selections[0];
  const currentCount = current?.byYear.find((entry) => entry.year === CURRENT_YEAR)?.count;
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Technologies" }]}
        eyebrow="TECHNOLOGIES"
        title={<>{fmt(data.metrics.total_technologies)} technologies <span className="cb-quiet">across {data.metrics.total_organizations} organizations</span></>}
        lede="Start from what you already write. Every technology an organization lists has its own page with the organizations, trends and accepted projects behind it."
        aside={<Link href="/organizations" className="cb-button cb-button-outline">Filter the directory <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label="Technologies listed" value={fmt(data.metrics.total_technologies)} context="By organizations since 2016" />
          {current ? <StatTile label={`Most used in ${CURRENT_YEAR}`} value={techLabel(current.name)} context={currentCount ? `${currentCount} organizations` : `${current.total} selections since 2021`} /> : null}
          {top ? <StatTile label={`Slots at ${top.label} organizations`} value={fmt(top.now)} context={`of ${fmt(slots)} in ${CURRENT_YEAR}`} accent /> : null}
          {growing[0] ? <StatTile label="Fastest growing" value={techLabel(growing[0].name)} context={`${growing[0].first_year_count} → ${growing[0].last_year_count} organizations`} /> : null}
          <StatTile label="Organizations" value={data.metrics.total_organizations} context="In the archive" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        <section aria-labelledby="cb-tech-demand">
          <SectionHead id="cb-tech-demand" eyebrow="DEMAND" title={`Where the ${CURRENT_YEAR} contributor slots went,`} quiet="by technology." />
          <article className="cb-card">
            <Dumbbell rows={demand.rows} nowLabel={String(CURRENT_YEAR)} thenLabel={String(demand.then)} unit="slots" caption="Contributor slots by technology" hrefFor={(value) => technologyHref(value)} />
            <p className="cb-card-note">Slots are accepted projects at organizations that list the technology. Organizations list several, so rows overlap.</p>
          </article>
        </section>

        <section className="cb-two" aria-label="Rankings">
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Listed by the most organizations</h3><p>All cycles since 2016</p></div></header>
            <ol className="cb-rank">
              {mostOrgs.map((tech, index) => (
                <li key={tech.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/tech-stack/${tech.slug}`}>{techLabel(tech.name)}</Link>
                  <span className="cb-rank-v"><strong>{tech.org_count}</strong><small>{fmt(tech.project_count)} projects</small></span>
                </li>
              ))}
            </ol>
          </article>
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Fastest growing</h3><p>Change in organizations listing it, earliest to latest cycle</p></div></header>
            <ol className="cb-rank">
              {growing.map((tech, index) => (
                <li key={tech.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/tech-stack/${tech.slug}`}>{techLabel(tech.name)}</Link>
                  <span className="cb-rank-v"><strong>+{tech.growth_pct}%</strong><small>{tech.first_year_count} → {tech.last_year_count}</small></span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section aria-labelledby="cb-tech-all">
          <SectionHead id="cb-tech-all" eyebrow="EVERY TECHNOLOGY" title="Find your stack" />
          <Finder noun="technologies" aLabel="orgs" bLabel="projects" items={data.all_techs.map((tech) => ({ label: techLabel(tech.name), href: `/tech-stack/${tech.slug}`, a: tech.org_count, b: tech.project_count }))} />
        </section>
      </div>

      <AZList id="cb-tech-az" eyebrow="A TO Z" title="Technologies with their own page" items={data.all_techs.filter((tech) => isTaxonomyIndexEligible(tech.org_count, tech.project_count)).map((tech) => ({ label: techLabel(tech.name), href: `/tech-stack/${tech.slug}` }))} />
    </main>
  );
}

export function TechDetailView({ data }: { data: TechStackPageData }) {
  const name = techLabel(data.name);
  const orgs = data.organizations.map((org) => cobaltOrganization(org.slug)).filter((org): org is CobaltOrg => Boolean(org));
  const current = orgs.filter((org) => org.inCurrent).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));
  const earlier = orgs.filter((org) => !org.inCurrent).sort((a, b) => b.lastYear - a.lastYear || b.totalProjects - a.totalProjects);
  const slots = current.reduce((sum, org) => sum + org.current, 0);
  const program = programSeries().at(-1)?.slots ?? 0;
  const key = norm(data.name);
  const together = new Map<string, number>();
  for (const org of orgs) for (const tech of new Set(org.technologies.map(norm))) if (tech !== key) together.set(tech, (together.get(tech) ?? 0) + 1);
  const companions = [...together.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  // Per-cycle series from the same slot data as the rest of the site (the tech file lags a cycle).
  const years = YEARS;
  const orgsPerYear = YEARS.map((year) => orgs.filter((org) => org.activeYears.includes(year) && !org.withdrawnYears.includes(year)).length);
  const slotsPerYear = YEARS.map((_, i) => orgs.reduce((sum, org) => sum + org.slots[i], 0));
  const TABLE = 20;
  const directoryHref = `/organizations?tech=${encodeURIComponent(key)}`;
  const maxCurrent = Math.max(1, ...cobaltOrganizations().map((org) => org.current));
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Technologies", href: "/tech-stack" }, { label: name }]}
        eyebrow="TECHNOLOGY"
        title={name}
        lede={<>{plural(data.metrics.org_count, "organization")} list {name}. Together they took {plural(data.metrics.project_count, "accepted project")} from {data.metrics.first_year_used} to {data.metrics.latest_year_used}.</>}
        aside={<Link href={directoryHref} className="cb-button cb-button-outline">Open in the directory <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label={`In GSoC ${CURRENT_YEAR}`} value={current.length} context={`of ${data.metrics.org_count} organizations`} accent />
          <StatTile label={`Contributors in ${CURRENT_YEAR}`} value={fmt(slots)} context={program ? `${((slots / program) * 100).toFixed(1)}% of all slots` : undefined} />
          <StatTile label="Projects since 2016" value={fmt(data.metrics.project_count)} context={`${data.metrics.avg_projects_per_org} per organization`} />
          <StatTile label="First listed" value={data.metrics.first_year_used} context={`Latest ${data.metrics.latest_year_used}`} />
          <StatTile label="Organizations" value={data.metrics.org_count} context="All cycles" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        {years.length ? (
          <section className="cb-two" aria-label={`${name} per cycle`}>
            <article className="cb-card">
              <header className="cb-card-head"><div><h3>Organizations listing {name}</h3><p>Per cycle</p></div></header>
              <ColumnChart labels={years} series={{ label: "Organizations", values: orgsPerYear }} caption={`Organizations listing ${name} per cycle`} height={180} />
            </article>
            <article className="cb-card">
              <header className="cb-card-head"><div><h3>Accepted projects at those organizations</h3><p>Per cycle</p></div></header>
              <ColumnChart labels={years} series={{ label: "Projects", values: slotsPerYear }} caption={`Projects at organizations listing ${name} per cycle`} height={180} />
            </article>
          </section>
        ) : null}

        {companions.length ? (
          <section aria-labelledby="cb-tech-with">
            <SectionHead id="cb-tech-with" eyebrow="OFTEN LISTED WITH" title={`What ${name} organizations also use`} />
            <div className="cb-chip-cloud">
              {companions.map(([tech, count]) => <Link key={tech} href={technologyHref(tech)}>{techLabel(tech)}<span>{count}</span></Link>)}
            </div>
          </section>
        ) : null}

        {current.length ? (
          <section aria-labelledby="cb-tech-current">
            <SectionHead id="cb-tech-current" eyebrow={`GSOC ${CURRENT_YEAR}`} title={`${plural(current.length, "organization")} using ${name}`} quiet="this cycle." action={{ label: "Filter the directory", href: directoryHref }} />
            <OrgTable orgs={current.slice(0, TABLE)} maxCurrent={maxCurrent} caption={`${CURRENT_YEAR} organizations using ${name}`} />
            <MoreOrgs orgs={current.slice(TABLE)} />
          </section>
        ) : null}

        {earlier.length ? (
          <section aria-labelledby="cb-tech-earlier">
            <SectionHead id="cb-tech-earlier" eyebrow="EARLIER CYCLES" title={`${plural(earlier.length, "organization")}`} quiet={`not in ${CURRENT_YEAR}.`} />
            <OrgTable orgs={earlier.slice(0, TABLE)} maxCurrent={maxCurrent} caption={`Earlier organizations using ${name}`} />
            <MoreOrgs orgs={earlier.slice(TABLE)} />
          </section>
        ) : null}

        <p className="cb-results-note">
          Organizations count toward every technology they list. <a className="cb-inline-link" href="https://summerofcode.withgoogle.com/archive" target="_blank" rel="noreferrer noopener">Official GSoC archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}

/** The rest of a long organization list as plain links (still crawlable, much shorter). */
function MoreOrgs({ orgs }: { orgs: CobaltOrg[] }) {
  if (!orgs.length) return null;
  return (
    <div className="cb-more-orgs">
      <p>{plural(orgs.length, "more organization")}</p>
      <ul>{orgs.map((org) => <li key={org.slug}><Link href={`/organizations/${org.slug}`} prefetch={false}>{org.name}</Link></li>)}</ul>
    </div>
  );
}
