import Link from "next/link";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";
import type { TopicPageData, TopicsIndexData } from "@/lib/topics-page-types";
import { isTaxonomyIndexEligible } from "@/lib/search-index-policy";
import { canonicalTechnology, canonicalTopic, type CanonicalVocabularyValue } from "@/lib/vocabulary/catalog";
import { cobaltOrganization, cobaltOrganizations, CURRENT_YEAR, programSeries, YEARS, type CobaltOrg } from "../data";
import { Finder } from "../finder";
import { techLabel, topicLabel } from "../labels";
import { AZList, OrgTable, PageHead, SectionHead } from "../page";
import { ColumnChart, fmt, plural, StatTile } from "../ui";

const norm = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

/** Canonical slug and name for a raw value, or null when the value has no usable slug. */
function canonical(kind: "topic" | "technology", raw: string): CanonicalVocabularyValue | null {
  try {
    return kind === "topic" ? canonicalTopic(raw) : canonicalTechnology(raw);
  } catch {
    return null;
  }
}

/** Count organizations per canonical value (each organization once per value). */
function countBy(orgs: CobaltOrg[], kind: "topic" | "technology", skip?: string) {
  const counts = new Map<string, { slug: string; name: string; orgs: number; slots: number }>();
  for (const org of orgs) {
    const seen = new Set<string>();
    for (const raw of kind === "topic" ? org.topics : org.technologies) {
      const value = canonical(kind, raw);
      if (!value || value.slug === skip || seen.has(value.slug)) continue;
      seen.add(value.slug);
      const row = counts.get(value.slug) ?? { slug: value.slug, name: value.name, orgs: 0, slots: 0 };
      row.orgs += 1;
      row.slots += org.current;
      counts.set(value.slug, row);
    }
  }
  return [...counts.values()].sort((a, b) => b.orgs - a.orgs || b.slots - a.slots || a.name.localeCompare(b.name));
}

export function TopicsIndexView({ data }: { data: TopicsIndexData }) {
  const names = new Map(data.topics.map((topic) => [topic.slug, topicLabel(topic.name)]));
  const byOrgs = [...data.topics].sort((a, b) => b.organizationCount - a.organizationCount || b.projectCount - a.projectCount).slice(0, 10);
  const currentOrgs = cobaltOrganizations().filter((org) => org.inCurrent);
  const now = countBy(currentOrgs, "topic").filter((row) => names.has(row.slug));
  const topNow = now.slice(0, 10);
  const shared = data.topics.filter((topic) => topic.organizationCount >= 3).length;
  const allOrgs = cobaltOrganizations().filter((org) => org.cycles > 0).length;
  const leader = byOrgs[0];
  const leaderNow = now[0];
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Topics" }]}
        eyebrow="TOPICS"
        title={<>{fmt(data.total)} topics <span className="cb-quiet">across {fmt(allOrgs)} organizations</span></>}
        lede="Organizations tag themselves with the areas they work in, from machine learning to compilers. Each topic has a page with the organizations behind it and the contributors they took."
        aside={<Link href="/tech-stack" className="cb-button cb-button-outline">Browse by technology <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label="Topics listed" value={fmt(data.total)} context="By organizations since 2016" />
          <StatTile label={`Listed in ${CURRENT_YEAR}`} value={fmt(now.length)} context={`By ${currentOrgs.length} organizations`} />
          {leaderNow ? <StatTile label={`Most listed in ${CURRENT_YEAR}`} value={names.get(leaderNow.slug) ?? topicLabel(leaderNow.name)} context={`${leaderNow.orgs} organizations, ${fmt(leaderNow.slots)} contributors`} accent /> : null}
          {leader ? <StatTile label="Most listed since 2016" value={topicLabel(leader.name)} context={`${leader.organizationCount} organizations`} /> : null}
          <StatTile label="Shared by 3 or more" value={fmt(shared)} context="The rest belong to one or two organizations" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        <section className="cb-two" aria-label="Rankings">
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Listed by the most organizations</h3><p>All cycles since 2016</p></div></header>
            <ol className="cb-rank">
              {byOrgs.map((topic, index) => (
                <li key={topic.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/topics/${topic.slug}`}>{topicLabel(topic.name)}</Link>
                  <span className="cb-rank-v"><strong>{topic.organizationCount}</strong><small>{fmt(topic.projectCount)} projects</small></span>
                </li>
              ))}
            </ol>
          </article>
          <article className="cb-card">
            <header className="cb-card-head"><div><h3>Most listed in GSoC {CURRENT_YEAR}</h3><p>Organizations this cycle, with the contributors they took</p></div></header>
            <ol className="cb-rank">
              {topNow.map((topic, index) => (
                <li key={topic.slug}>
                  <span className="cb-rank-n">{String(index + 1).padStart(2, "0")}</span>
                  <Link href={`/topics/${topic.slug}`}>{names.get(topic.slug) ?? topicLabel(topic.name)}</Link>
                  <span className="cb-rank-v"><strong>{topic.orgs}</strong><small>{fmt(topic.slots)} contributors</small></span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section aria-labelledby="cb-tp-all">
          <SectionHead id="cb-tp-all" eyebrow="EVERY TOPIC" title="Find your area" />
          <Finder noun="topics" aLabel="orgs" bLabel="projects" items={data.topics.map((topic) => ({ label: topicLabel(topic.name), href: `/topics/${topic.slug}`, a: topic.organizationCount, b: topic.projectCount }))} />
          <p className="cb-results-note">Topics are written by the organizations, so similar areas can appear under different names. Project counts add up every accepted project at the organizations listing a topic.</p>
        </section>
      </div>

      <AZList id="cb-tp-az" eyebrow="A TO Z" title="Topics with their own page" items={data.topics.filter((topic) => isTaxonomyIndexEligible(topic.organizationCount, topic.projectCount)).map((topic) => ({ label: topicLabel(topic.name), href: `/topics/${topic.slug}` }))} />
    </main>
  );
}

export function TopicDetailView({ data, topicSlugs }: { data: TopicPageData; topicSlugs: Set<string> }) {
  const name = topicLabel(data.name);
  const orgs = data.organizations.map((org) => cobaltOrganization(org.slug)).filter((org): org is CobaltOrg => Boolean(org));
  const current = orgs.filter((org) => org.inCurrent).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));
  const earlier = orgs.filter((org) => !org.inCurrent).sort((a, b) => b.lastYear - a.lastYear || b.totalProjects - a.totalProjects);
  const slots = current.reduce((sum, org) => sum + org.current, 0);
  const program = programSeries().at(-1)?.slots ?? 0;
  const related = countBy(orgs, "topic", data.slug).filter((row) => topicSlugs.has(row.slug)).slice(0, 14);
  const stack = countBy(orgs, "technology").filter((row) => row.slug !== "c-cpp").slice(0, 12);
  // Per-cycle series from the slot data used across the site (the topic file has no projects for the latest cycle).
  const orgsPerYear = YEARS.map((year) => orgs.filter((org) => org.activeYears.includes(year) && !org.withdrawnYears.includes(year)).length);
  const slotsPerYear = YEARS.map((_, i) => orgs.reduce((sum, org) => sum + org.slots[i], 0));
  const years = [...data.years].sort((a, b) => a - b);
  const first = years[0] ?? YEARS[0];
  const last = years.at(-1) ?? CURRENT_YEAR;
  const TABLE = 20;
  const directoryHref = `/organizations?topic=${encodeURIComponent(norm(data.name))}`;
  const maxCurrent = Math.max(1, ...cobaltOrganizations().map((org) => org.current));
  const average = data.organizationCount ? Math.round(data.projectCount / data.organizationCount) : 0;
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Topics", href: "/topics" }, { label: name }]}
        eyebrow="TOPIC"
        title={name}
        lede={<>{plural(data.organizationCount, "organization")} list {name} as a topic. Together they took {plural(data.projectCount, "accepted project")} from {first} to {last}.</>}
        aside={<Link href={directoryHref} className="cb-button cb-button-outline">Open in the directory <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label={`In GSoC ${CURRENT_YEAR}`} value={current.length} context={`of ${data.organizationCount} organizations`} accent />
          <StatTile label={`Contributors in ${CURRENT_YEAR}`} value={fmt(slots)} context={program ? `${((slots / program) * 100).toFixed(1)}% of all slots` : undefined} />
          <StatTile label="Projects since 2016" value={fmt(data.projectCount)} context={`${average} per organization`} />
          <StatTile label="First cycle" value={first} context={`Latest ${last}`} />
          <StatTile label="Organizations" value={data.organizationCount} context="All cycles" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        {orgs.length ? (
          <section className="cb-two" aria-label={`${name} per cycle`}>
            <article className="cb-card">
              <header className="cb-card-head"><div><h3>Organizations listing {name}</h3><p>Per cycle</p></div></header>
              <ColumnChart labels={YEARS} series={{ label: "Organizations", values: orgsPerYear }} caption={`Organizations listing ${name} per cycle`} height={180} />
            </article>
            <article className="cb-card">
              <header className="cb-card-head"><div><h3>Accepted projects at those organizations</h3><p>Per cycle</p></div></header>
              <ColumnChart labels={YEARS} series={{ label: "Projects", values: slotsPerYear }} caption={`Projects at organizations listing ${name} per cycle`} height={180} />
            </article>
          </section>
        ) : null}

        {related.length ? (
          <section aria-labelledby="cb-tp-with">
            <SectionHead id="cb-tp-with" eyebrow="OFTEN LISTED WITH" title={`Topics these organizations also list`} />
            <div className="cb-chip-cloud">
              {related.map((topic) => <Link key={topic.slug} href={`/topics/${topic.slug}`}>{topicLabel(topic.name)}<span>{topic.orgs}</span></Link>)}
            </div>
          </section>
        ) : null}

        {stack.length ? (
          <section aria-labelledby="cb-tp-stack">
            <SectionHead id="cb-tp-stack" eyebrow="COMMON STACK" title={`What ${name} organizations build with`} />
            <div className="cb-chip-cloud">
              {stack.map((tech) => <Link key={tech.slug} href={`/tech-stack/${tech.slug}`}>{techLabel(tech.name)}<span>{tech.orgs}</span></Link>)}
            </div>
          </section>
        ) : null}

        {current.length ? (
          <section aria-labelledby="cb-tp-current">
            <SectionHead id="cb-tp-current" eyebrow={`GSOC ${CURRENT_YEAR}`} title={`${plural(current.length, "organization")} in ${name}`} quiet="this cycle." action={{ label: "Filter the directory", href: directoryHref }} />
            <OrgTable orgs={current.slice(0, TABLE)} maxCurrent={maxCurrent} caption={`${CURRENT_YEAR} organizations listing ${name}`} />
            <MoreOrgs orgs={current.slice(TABLE)} />
          </section>
        ) : null}

        {earlier.length ? (
          <section aria-labelledby="cb-tp-earlier">
            <SectionHead id="cb-tp-earlier" eyebrow="EARLIER CYCLES" title={`${plural(earlier.length, "organization")}`} quiet={`not in ${CURRENT_YEAR}.`} />
            <OrgTable orgs={earlier.slice(0, TABLE)} maxCurrent={maxCurrent} caption={`Earlier organizations listing ${name}`} />
            <MoreOrgs orgs={earlier.slice(TABLE)} />
          </section>
        ) : null}

        <p className="cb-results-note">
          Organizations count toward every topic they list. Participation history is not a prediction of selection. <a className="cb-inline-link" href="https://summerofcode.withgoogle.com/archive" target="_blank" rel="noreferrer noopener">Official GSoC archive <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        </p>
      </div>
    </main>
  );
}

/** The rest of a long organization list as plain links (still crawlable, much shorter). */
export function MoreOrgs({ orgs }: { orgs: CobaltOrg[] }) {
  if (!orgs.length) return null;
  return (
    <div className="cb-more-orgs">
      <p>{plural(orgs.length, "more organization")}</p>
      <ul>{orgs.map((org) => <li key={org.slug}><Link href={`/organizations/${org.slug}`}>{org.name}</Link></li>)}</ul>
    </div>
  );
}
