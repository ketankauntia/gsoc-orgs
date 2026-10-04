import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBook2,
  IconBrandGit,
  IconChartBar,
  IconCode,
  IconLayoutDashboard,
  IconMessages,
  IconTimeline,
  IconUsers,
} from "@tabler/icons-react";
import { StageTabs } from "./controls";
import { CURRENT_YEAR, getCobaltLanding, getCobaltProfile, YEARS, type CobaltFilters } from "./data";
import { technologyHref } from "@/lib/vocabulary/catalog";
import { countWord } from "./labels";
import { PostCards } from "./posts";
import type { Post } from "@/lib/blog/types";
import { SearchPanel } from "./shell";
import { BarList, ColumnChart, Dumbbell, Eyebrow, fmt, Histogram, Logo, plural, StatTile, Treemap } from "./ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** What the GSoC year usually looks like in a given month (recent cycles; Google sets exact dates). */
function seasonLine(month: number) {
  if (month === 0) return "Organizations are applying.";
  if (month === 1) return "Organizations are announced this month.";
  if (month === 2 || month === 3) return "Proposals are open.";
  if (month === 4) return "Results, then community bonding.";
  if (month >= 5 && month <= 7) return "Coding is underway.";
  return "A good time to start contributing.";
}

function collectionHref(directory: string, params: Partial<CobaltFilters>) {
  const query = new URLSearchParams({ scope: "current" });
  if (params.rec) query.set("rec", params.rec);
  if (params.isNew) query.set("new", "1");
  if (params.cap?.length) query.set("cap", params.cap.join(","));
  if (params.tech?.length) query.set("tech", params.tech.join(","));
  const qs = query.toString();
  return qs ? `${directory}?${qs}` : directory;
}

export async function CobaltLanding({ posts }: { posts: Post[] }) {
  const data = await getCobaltLanding();
  const { totals, series } = data;
  const directory = `/organizations`;
  const profile = (slug: string) => `${directory}/${slug}`;
  const now = series[series.length - 1];
  const last = series[series.length - 2];
  const python = data.tech.rows.find((row) => row.value === "python");
  const blender = await getCobaltProfile("blender-foundation");
  const avgOrgs = Math.round(series.reduce((sum, row) => sum + row.orgs, 0) / series.length / 10) * 10;
  const avgSlots = Math.round(series.reduce((sum, row) => sum + row.slots, 0) / series.length / 100) * 100;
  // Twelve months starting now, so "Now" is always the first column.
  const month = new Date().getMonth();
  const timelineMonths = Array.from({ length: 12 }, (_, index) => (month + index) % 12);
  const col = (calendarMonth: number) => (calendarMonth - month + 12) % 12;
  const phases = [
    { label: "Explore and contribute", detail: "Pick organizations, read their code, land small fixes", from: 9, to: 0 },
    { label: "Organizations apply", detail: "Google reviews mentoring organizations", from: 0, to: 1 },
    { label: "Proposals", detail: "Organizations announced late February; applications open in March", from: 2, to: 3 },
    { label: "Results and bonding", detail: "Accepted contributors announced, then community bonding", from: 4, to: 4 },
    { label: "Coding", detail: "Standard projects end in late summer; extended ones run longer", from: 5, to: 7 },
  ].map((phase) => {
    // A phase that wraps past the first column contains the current month: start it now.
    const wraps = col(phase.to) < col(phase.from);
    return { ...phase, start: wraps ? 0 : col(phase.from), end: col(phase.to) };
  });
  const quick = [
    { label: "Python", href: `${directory}?tech=python` },
    { label: "JavaScript", href: `${directory}?tech=javascript` },
    { label: "C++", href: `${directory}?tech=c%2B%2B` },
    { label: "Rust", href: `${directory}?tech=rust` },
    { label: "Machine learning", href: `${directory}?tech=machine+learning` },
    { label: `New in ${CURRENT_YEAR}`, href: `${directory}?scope=current&new=1` },
  ];
  const faqs = [
    {
      q: `How many organizations are in GSoC ${CURRENT_YEAR}?`,
      a: `${totals.current} organizations took ${fmt(totals.slots)} contributors in ${CURRENT_YEAR}. Google announced ${totals.announced}; ${totals.withdrawn} withdrew before the program started.`,
    },
    {
      q: "How many contributors does a typical organization take?",
      a: `The median organization took ${totals.median} in ${CURRENT_YEAR}. ${totals.threeToFive} of ${totals.current} took three to five, and ${totals.over20} took more than twenty. The ten largest took ${totals.topTenShare}% of all slots.`,
    },
    {
      q: "Which organizations take the most contributors?",
      a: `${data.top.slice(0, 3).map((org) => `${org.name} (${org.current})`).join(", ")} took the most in ${CURRENT_YEAR}. Sort the directory by contributors to see the rest.`,
    },
    {
      q: "Which organizations have taken part every year?",
      a: `${totals.everyYear} organizations have been selected in all eleven cycles from 2016 to ${CURRENT_YEAR}, including Blender Foundation, KDE Community and the Python Software Foundation.`,
    },
    {
      q: "Does a long record mean an organization will be selected again?",
      a: "No. Google selects organizations every year, and a strong record is not a guarantee. Treat participation history as context, and check the official list when it is published.",
    },
    {
      q: "Where does the data come from?",
      a: `Google's public Google Summer of Code archive, ${YEARS[0]} to ${CURRENT_YEAR}. Contributor counts are accepted projects. Mentor counts are published after each cycle ends, so ${CURRENT_YEAR} has none yet. This guide is independent and not affiliated with Google.`,
    },
  ];

  return (
    <main className="cb-landing">
      {/* Hero ------------------------------------------------------------ */}
      <section className="cb-hero">
        <div className="cb-hero-grid" aria-hidden="true" />
        <div className="cb-page">
          <div className="cb-hero-copy">
            <Link href={`${directory}?scope=current`} className="cb-announce">
              <span className="cb-dot" aria-hidden="true" />
              GSoC {CURRENT_YEAR}: {totals.current} organizations took {fmt(totals.slots)} contributors
              <IconArrowRight size={14} stroke={2} aria-hidden />
            </Link>
            <h1>
              Choose your GSoC organization
              <br />
              <span className="cb-serif">with eleven years of data.</span>
            </h1>
            <p className="cb-hero-lede">
              Every organization since 2016: how many contributors each one took, what they built, and where their community talks. Independent and free.
            </p>
            <div className="cb-hero-search">
              <SearchPanel variant="hero" />
            </div>
            <div className="cb-quick" aria-label="Popular searches">
              <span>Popular</span>
              {quick.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
            </div>
          </div>

          <figure className="cb-preview">
            <StageTabs
              tabs={[
                { id: "field", label: `The ${CURRENT_YEAR} field`, icon: <IconLayoutDashboard size={16} stroke={1.75} aria-hidden /> },
                { id: "years", label: "Eleven cycles", icon: <IconTimeline size={16} stroke={1.75} aria-hidden /> },
                { id: "tech", label: "Technologies", icon: <IconCode size={16} stroke={1.75} aria-hidden /> },
              ]}
            >
              {[
                <div key="field" className="cb-panel">
                  <div className="cb-panel-head">
                    <div>
                      <p className="cb-panel-kicker">GSoC {CURRENT_YEAR} · {totals.current} organizations</p>
                      <h2>Where the {fmt(totals.slots)} contributor slots went</h2>
                    </div>
                    <div className="cb-legend" aria-hidden="true">
                      <span><i data-key="tile" />Returning</span>
                      <span><i data-key="a" />First time in {CURRENT_YEAR}</span>
                    </div>
                  </div>
                  <Treemap desktop={data.field.desktop} mobile={data.field.mobile} hrefFor={profile} caption={`Contributors per organization in GSoC ${CURRENT_YEAR}`} />
                  <p className="cb-panel-foot">Each block is one organization, sized by its {CURRENT_YEAR} contributors and grouped by category. Select one to open its page.</p>
                </div>,
                <div key="years" className="cb-panel">
                  <div className="cb-panel-head">
                    <div>
                      <p className="cb-panel-kicker">{YEARS[0]}–{CURRENT_YEAR} · every cycle in the archive</p>
                      <h2>A steady program: about {avgOrgs} organizations and {fmt(avgSlots)} contributors a year</h2>
                    </div>
                  </div>
                  <div className="cb-multiples">
                    {[
                      { title: "Organizations", values: series.map((row) => row.orgs), value: now.orgs, context: `in ${CURRENT_YEAR}` },
                      { title: "Contributors", values: series.map((row) => row.slots), value: now.slots, context: `in ${CURRENT_YEAR}, ${fmt(last.slots)} in ${last.year}` },
                      { title: "Mentors", values: series.map((row) => row.mentors), value: last.mentors ?? 0, context: `in ${last.year}; ${CURRENT_YEAR} not published yet`, accentIndex: series.length - 2 },
                    ].map((chart) => (
                      <div key={chart.title} className="cb-multiple">
                        <p className="cb-multiple-title">{chart.title}</p>
                        <p className="cb-multiple-value">{fmt(chart.value)} <small>{chart.context}</small></p>
                        <ColumnChart compact height={132} labels={YEARS} series={{ label: chart.title, values: chart.values }} accent={chart.accentIndex ?? "last"} caption={`${chart.title} per cycle`} labelValues="none" />
                      </div>
                    ))}
                  </div>
                  <p className="cb-panel-foot">Contributors are accepted projects. {now.firstTime} organizations were new in {CURRENT_YEAR}; {last.firstTime} were new in {last.year}.</p>
                </div>,
                <div key="tech" className="cb-panel">
                  <div className="cb-panel-head">
                    <div>
                      <p className="cb-panel-kicker">Contributor slots at organizations using each technology</p>
                      <h2>{python ? `Organizations using Python took ${fmt(python.now)} of ${fmt(totals.slots)} slots` : "Slots by technology"}</h2>
                    </div>
                  </div>
                  <Dumbbell rows={data.tech.rows} nowLabel={String(CURRENT_YEAR)} thenLabel={String(data.tech.then)} unit="slots" caption="Contributor slots by technology" hrefFor={(value) => technologyHref(value)} />
                  <p className="cb-panel-foot">An organization counts toward every technology it lists, so rows overlap. Select a technology to see its organizations.</p>
                </div>,
              ]}
            </StageTabs>
            <figcaption>
              <span>Source: Google Summer of Code public archive, {YEARS[0]}–{CURRENT_YEAR}.</span>
            </figcaption>
          </figure>

          <div className="cb-strip">
            <p>{totals.orgs} organizations in the archive, including</p>
            <ul>
              {data.strip.map((org) => (
                <li key={org.slug}>
                  <Link href={profile(org.slug)} title={org.name}>
                    {org.logo ? <Image src={org.logo} alt={org.name} width={120} height={48} /> : org.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <a className="cb-press" href="https://gdg.community.dev/events/details/google-gdg-cloud-nagpur-presents-gsoc-2026-complete-guide-live-session-on-google-summer-of-code/" target="_blank" rel="noreferrer noopener">
            <span className="cb-press-logo"><Image src="/gdg-cloud-nagpur.webp" alt="" width={52} height={52} /></span>
            <span className="cb-press-copy">
              <small>Featured at</small>
              <strong>GDG Cloud Nagpur</strong>
              <span>GSoC 2026 complete guide, live session</span>
            </span>
            <IconArrowUpRight className="cb-press-go" size={16} stroke={2} aria-hidden />
          </a>
        </div>
      </section>

      {/* Anatomy ---------------------------------------------------------- */}
      {blender ? (
        <section className="cb-section cb-page cb-anatomy" id="product">
          <div className="cb-anatomy-copy">
            <Eyebrow>ONE PAGE PER ORGANIZATION</Eyebrow>
            <h2>
              Everything you would check before applying.
              <br />
              <span className="cb-quiet">On one page.</span>
            </h2>
            <p>Each of the {totals.orgs} organizations has a page built from its full record in the program, so you can judge fit in a minute instead of an evening.</p>
            <ol className="cb-points">
              {[
                ["Capacity", "Contributors accepted in every cycle, set against the median organization."],
                ["Track record", "Cycles taken part in, the current streak, and the years an organization sat out."],
                ["Past work", "Every accepted project since 2016, with the contributor and mentors behind it."],
                ["Where to talk", "Ideas list, contributor guide, chat and mailing list, linked from one place."],
              ].map(([title, body], index) => (
                <li key={title}>
                  <span className="cb-marker">{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={profile("blender-foundation")} className="cb-text-link">
              Open Blender Foundation&apos;s page <IconArrowRight size={16} stroke={2} aria-hidden />
            </Link>
          </div>
          <div className="cb-specimen" aria-label="Example: Blender Foundation's page">
            <div className="cb-specimen-head">
              <Logo org={blender.org} size="lg" />
              <div className="cb-specimen-title">
                <p>{blender.org.name}</p>
                <span>{blender.org.category}</span>
              </div>
              <span className="cb-pill" data-tone="accent"><span className="cb-dot" aria-hidden="true" />In GSoC {CURRENT_YEAR}</span>
            </div>
            <div className="cb-specimen-block">
              <span className="cb-marker">1</span>
              <div className="cb-specimen-stats">
                <p><strong>{blender.org.current}</strong><span>contributors in {CURRENT_YEAR}</span></p>
                <p><strong>{fmt(blender.org.totalProjects)}</strong><span>projects since 2016</span></p>
                <p><strong>{blender.org.average}</strong><span>a cycle on average</span></p>
              </div>
              <ColumnChart compact height={92} labels={YEARS} series={{ label: blender.org.name, values: blender.org.slots }} compare={{ label: "Median organization", values: series.map((row) => row.median) }} caption="Blender Foundation contributors per cycle" labelValues="none" />
            </div>
            <div className="cb-specimen-block">
              <span className="cb-marker">2</span>
              <div className="cb-record">
                <span className="cb-record-cells" aria-hidden="true">{YEARS.map((year, index) => <i key={year} data-on={blender.org.slots[index] > 0 || undefined} />)}</span>
                <p><strong>{blender.org.cycles} of {YEARS.length} cycles</strong> · {blender.org.streak}-cycle streak</p>
              </div>
            </div>
            <div className="cb-specimen-block">
              <span className="cb-marker">3</span>
              <ul className="cb-specimen-projects">
                {(blender.yearPanels[0]?.projects ?? []).slice(0, 2).map((project) => (
                  <li key={project.t}>
                    <p>{project.t}</p>
                    <span>{project.c ?? "Contributor not listed"}{project.m.length ? ` · mentored by ${project.m.slice(0, 2).join(", ")}` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cb-specimen-block">
              <span className="cb-marker">4</span>
              <div className="cb-specimen-links">
                {data.blenderContacts?.contact.ideas_url ? <span><IconBook2 size={14} stroke={1.75} aria-hidden />Ideas list</span> : null}
                {data.blenderContacts?.contact.guide_url ? <span><IconBrandGit size={14} stroke={1.75} aria-hidden />Contributor guide</span> : null}
                {data.blenderContacts?.contact.irc_channel ? <span><IconMessages size={14} stroke={1.75} aria-hidden />Chat</span> : null}
                {data.blenderContacts?.contact.mailing_list ? <span><IconUsers size={14} stroke={1.75} aria-hidden />Forum</span> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Insights --------------------------------------------------------- */}
      <section className="cb-band" id="insights">
        <div className="cb-page cb-section">
          <div className="cb-split-heading">
            <div>
              <Eyebrow>GSOC {CURRENT_YEAR} IN NUMBERS</Eyebrow>
              <h2>
                Most organizations take three to five contributors.
                <br />
                <span className="cb-serif">{countWord(totals.over20, true)} took more than twenty.</span>
              </h2>
            </div>
            <p>Capacity is the clearest signal in the archive. It shows how many people an organization can mentor in a summer, which is worth knowing before you put weeks into one.</p>
          </div>
          <div className="cb-kpis">
            <StatTile label="Organizations" value={totals.current} context={`${totals.announced} announced, ${totals.withdrawn} withdrew`} />
            <StatTile label="Contributors" value={fmt(totals.slots)} context={`${fmt(last.slots)} in ${last.year}`} />
            <StatTile label="Median per organization" value={totals.median} context={`Average ${(totals.slots / totals.current).toFixed(1)}`} accent />
            <StatTile label="First-time organizations" value={totals.firstTime} context={`${last.firstTime} in ${last.year}`} />
            <StatTile label={`Back from ${last.year}`} value={`${totals.returningShare}%`} context={`of ${totals.current} organizations`} />
          </div>
          <div className="cb-insight-grid">
            <article className="cb-card">
              <header className="cb-card-head">
                <div>
                  <h3>Most contributors in {CURRENT_YEAR}</h3>
                  <p>The ten largest took {totals.topTenShare}% of all slots</p>
                </div>
                <Link href={`${directory}?scope=current&sort=slots`} className="cb-card-action">All <IconArrowRight size={14} stroke={2} aria-hidden /></Link>
              </header>
              <BarList
                rows={data.top.map((org) => ({ key: org.slug, label: org.name, href: profile(org.slug), logo: org, now: org.current, then: org.previous, isNew: org.isNew }))}
                nowLabel={String(CURRENT_YEAR)}
                thenLabel={String(CURRENT_YEAR - 1)}
                caption={`Organizations with the most contributors in ${CURRENT_YEAR}`}
              />
            </article>
            <article className="cb-card">
              <header className="cb-card-head">
                <div>
                  <h3>Contributors per organization</h3>
                  <p>How many each of the {totals.current} organizations took in {CURRENT_YEAR}</p>
                </div>
                <Link href={`${directory}?scope=current&cap=3-5`} className="cb-card-action">Three to five <IconArrowRight size={14} stroke={2} aria-hidden /></Link>
              </header>
              <Histogram buckets={data.buckets} emphasis="3–5" unit="contributors" head={`Contributors in ${CURRENT_YEAR}`} caption={`Organizations by contributors in ${CURRENT_YEAR}`} />
              <p className="cb-card-note"><strong>{totals.threeToFive} organizations</strong> took three to five contributors. Larger ones usually run several sub-projects or umbrella teams.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Collections ------------------------------------------------------ */}
      <section className="cb-section cb-page" id="collections">
        <div className="cb-section-intro">
          <Eyebrow>START WITH A SHORTLIST</Eyebrow>
          <h2>
            Six ready-made lists.
            <br />
            <span className="cb-quiet">Each one defined by the record.</span>
          </h2>
          <p>Open any list in the directory, then narrow it by your languages and interests.</p>
        </div>
        <div className="cb-collections">
          {data.collections.map((collection) => (
            <Link key={collection.id} href={collectionHref(directory, collection.params)} className="cb-collection">
              <span className="cb-collection-count">{collection.count}</span>
              <span className="cb-collection-title">{collection.title}</span>
              <span className="cb-collection-rule">{collection.rule}</span>
              <span className="cb-collection-foot">
                <span className="cb-logo-stack" aria-hidden="true">{collection.sample.map((org) => <Logo key={org.slug} org={org} size="xs" />)}</span>
                <span className="cb-collection-open">Open <IconArrowRight size={14} stroke={2} aria-hidden /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline --------------------------------------------------------- */}
      <section className="cb-band cb-band-ink" id="timeline">
        <div className="cb-page cb-section">
          <div className="cb-split-heading">
            <div>
              <Eyebrow>THE GSOC YEAR</Eyebrow>
              <h2>
                It&apos;s {MONTHS[month]}.
                <br />
                <span className="cb-serif">{seasonLine(month)}</span>
              </h2>
            </div>
            <p>Google publishes exact dates each year. These months follow recent cycles: organizations are announced in late February and proposals open in March.</p>
          </div>
          <div className="cb-gantt" role="table" aria-label="The usual GSoC year">
            <div className="cb-gantt-row cb-gantt-months" role="row">
              <span role="columnheader" className="cb-gantt-corner"><span className="cb-sr-only">Phase</span></span>
              {timelineMonths.map((m, index) => <span key={m} role="columnheader" data-now={index === 0 || undefined}>{MONTHS[m].slice(0, 3)}</span>)}
            </div>
            {phases.map((phase) => (
              <div key={phase.label} className="cb-gantt-row" role="row">
                <span role="rowheader" className="cb-gantt-label"><strong>{phase.label}</strong><small>{phase.detail}</small></span>
                <span role="cell" className="cb-gantt-track">
                  <span className="cb-gantt-bar" data-current={phase.start === 0 || undefined} style={{ gridColumn: `${phase.start + 1} / ${phase.end + 2}` }}>
                    <span className="cb-sr-only">{MONTHS[timelineMonths[phase.start]]} to {MONTHS[timelineMonths[phase.end]]}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>
          <ol className="cb-steps">
            {[
              { title: "Shortlist three", body: "Pick organizations that use a language you already write. Depth beats breadth.", href: directory, cta: "Browse by technology" },
              { title: "Join the conversation", body: "Read their ideas list and say hello in their chat before you ask for help.", href: `${directory}?scope=current&rec=every`, cta: "Organizations with a long record" },
              { title: "Land a first fix", body: "A merged pull request gives mentors something concrete to read next to your proposal.", href: `${directory}?scope=current&new=1`, cta: `New in ${CURRENT_YEAR}` },
            ].map((step, index) => (
              <li key={step.title}>
                <span className="cb-step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <Link href={step.href}>{step.cta} <IconArrowRight size={14} stroke={2} aria-hidden /></Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* From the blog ---------------------------------------------------- */}
      <div className="cb-page cb-posts-wrap">
        <PostCards posts={posts} id="cb-posts-title" eyebrow="FROM THE BLOG" title="Guides for choosing" quiet="and applying." />
      </div>

      {/* FAQ -------------------------------------------------------------- */}
      <section className="cb-section cb-page cb-faq" id="faq">
        <div>
          <Eyebrow>QUESTIONS</Eyebrow>
          <h2>Straight answers<br /><span className="cb-quiet">from the archive.</span></h2>
          <p className="cb-faq-note"><IconChartBar size={16} stroke={1.75} aria-hidden /> {plural(totals.projectsAllTime, "accepted project")} across {YEARS.length} cycles.</p>
        </div>
        <div className="cb-faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.q} open={index === 0}>
              <summary>{faq.q}<span aria-hidden="true" /></summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA -------------------------------------------------------- */}
      <section className="cb-final">
        <div className="cb-page">
          <Eyebrow>START HERE</Eyebrow>
          <h2>
            Find the organization
            <br />
            <span className="cb-serif">you will build with this summer.</span>
          </h2>
          <p>{totals.current} organizations in {CURRENT_YEAR}, {totals.orgs} since 2016. Filter by stack, capacity and record, then shortlist the few that fit.</p>
          <div className="cb-final-actions">
            <Link href={`${directory}?scope=current`} className="cb-button cb-button-ink cb-button-lg">Browse {totals.current} organizations <IconArrowRight size={16} stroke={2} aria-hidden /></Link>
            <Link href={directory} className="cb-text-link">Every organization since 2016</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
