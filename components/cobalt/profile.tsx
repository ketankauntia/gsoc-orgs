import Link from "next/link";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBook2,
  IconBrandDiscord,
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandMastodon,
  IconBrandMedium,
  IconBrandReddit,
  IconBrandSlack,
  IconBrandStackoverflow,
  IconBrandTwitch,
  IconBrandX,
  IconBrandYoutube,
  IconCode,
  IconMail,
  IconMessages,
  IconRss,
  IconSchool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import type { ContributorWork } from "@/lib/hub/public";
import { technologyHref, topicHref } from "@/lib/vocabulary/catalog";
import { workProductShortLabel } from "@/lib/work-product";
import { ContributorWorkSection } from "./contributor-work";
import { techLabel, topicLabel } from "./labels";
import { CopyLink, ProjectYears, SaveButton } from "./controls";
import { CURRENT_YEAR, getCobaltProfile, YEARS } from "./data";
import { ColumnChart, Eyebrow, fmt, Logo, plural, Sparkline, StatTile } from "./ui";

const SOCIAL: Record<string, { label: string; icon: typeof IconBrandGithub }> = {
  github: { label: "GitHub", icon: IconBrandGithub },
  gitlab: { label: "GitLab", icon: IconBrandGitlab },
  twitter: { label: "X", icon: IconBrandX },
  mastodon: { label: "Mastodon", icon: IconBrandMastodon },
  discord: { label: "Discord", icon: IconBrandDiscord },
  slack: { label: "Slack", icon: IconBrandSlack },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin },
  youtube: { label: "YouTube", icon: IconBrandYoutube },
  reddit: { label: "Reddit", icon: IconBrandReddit },
  facebook: { label: "Facebook", icon: IconBrandFacebook },
  instagram: { label: "Instagram", icon: IconBrandInstagram },
  medium: { label: "Medium", icon: IconBrandMedium },
  stackoverflow: { label: "Stack Overflow", icon: IconBrandStackoverflow },
  twitch: { label: "Twitch", icon: IconBrandTwitch },
  blog: { label: "Blog", icon: IconRss },
};

function host(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value.replace(/^[a-z]+:\/\//i, "").split("/")[0]; }
}
const isUrl = (value: string | null | undefined): value is string => Boolean(value && /^https?:\/\//i.test(value));

export async function CobaltProfile({ slug, work }: { slug: string; work: ContributorWork }) {
  const data = await getCobaltProfile(slug);
  if (!data) return null;
  const { org, contacts, series } = data;
  const directory = `/organizations`;
  const contact = contacts.contact;
  const withdrew = org.withdrawnYears.includes(CURRENT_YEAR);
  const lastTook = org.activeYears.filter((year) => !org.withdrawnYears.includes(year)).pop();
  const change = org.current - org.previous;
  const peakIndex = org.slots.indexOf(Math.max(...org.slots));
  const firstParagraph = org.description.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  const more = org.description.split(/\n\s*\n/).slice(1).map((part) => part.replace(/\s+/g, " ").trim()).filter(Boolean);

  const start = [
    isUrl(contact.ideas_url) ? { label: "Ideas list", detail: "Project ideas for applicants", href: contact.ideas_url, icon: IconBook2, primary: true } : null,
    isUrl(contact.guide_url) ? { label: "Contributor guide", detail: "How they want you to start", href: contact.guide_url, icon: IconSchool } : null,
    contact.irc_channel ? { label: "Chat", detail: host(contact.irc_channel), href: isUrl(contact.irc_channel) ? contact.irc_channel : null, icon: IconMessages } : null,
    contact.mailing_list ? { label: "Mailing list or forum", detail: host(contact.mailing_list), href: isUrl(contact.mailing_list) ? contact.mailing_list : null, icon: IconUsers } : null,
    contact.email ? { label: "Email", detail: contact.email, href: `mailto:${contact.email}`, icon: IconMail } : null,
    isUrl(org.website) ? { label: "Website", detail: host(org.website), href: org.website, icon: IconWorld } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const socials = Object.entries(contacts.social).filter(([key, value]) => SOCIAL[key] && isUrl(value));

  const status = org.inCurrent
    ? { label: `In GSoC ${CURRENT_YEAR}`, tone: "accent" }
    : withdrew ? { label: `Withdrew from ${CURRENT_YEAR}`, tone: "warn" } : { label: `Last took part in ${org.lastYear}`, tone: undefined };
  const badges = [
    org.isNew ? `First time in ${CURRENT_YEAR}` : null,
    org.everyYear ? "Every cycle since 2016" : null,
    org.growing ? `Growing in ${CURRENT_YEAR}` : null,
    org.returning ? "Back after a break" : null,
  ].filter(Boolean) as string[];

  const answers = [
    {
      q: `Is ${org.name} in GSoC ${CURRENT_YEAR}?`,
      a: org.inCurrent ? `Yes, with ${plural(org.current, "contributor")}${org.isNew ? ", in its first cycle" : ""}.` : withdrew ? `It was announced for ${CURRENT_YEAR} but withdrew.${lastTook ? ` It last took contributors in ${lastTook}.` : ""}` : `No. It last took part in ${org.lastYear}.`,
    },
    {
      q: "How long has it taken part?",
      a: `${org.cycles} of ${YEARS.length} cycles since 2016, first in ${org.firstYear}${org.streak > 1 && org.inCurrent ? `, with a ${org.streak}-cycle streak running` : ""}.`,
    },
    {
      q: "How many contributors does it usually take?",
      a: org.totalProjects ? `${org.average} a cycle on average, ${fmt(org.totalProjects)} in total. Its largest cycle was ${YEARS[peakIndex]}, with ${org.slots[peakIndex]}.` : "The archive lists no accepted projects for it yet.",
    },
    org.technologies.length ? { q: "What does it build with?", a: `${org.technologies.slice(0, 6).map(techLabel).join(", ")}${org.technologies.length > 6 ? ` and ${org.technologies.length - 6} more` : ""}.` } : null,
  ].filter((item): item is { q: string; a: string } => Boolean(item));

  return (
    <main className="cb-profile">
        <section className="cb-profile-head">
          <div className="cb-page">
            <nav className="cb-crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href={directory}>Organizations</Link>
              <span aria-hidden="true">/</span>
              <Link href={`${directory}?category=${encodeURIComponent(org.category)}`}>{org.category}</Link>
            </nav>
            <div className="cb-profile-hero">
              <Logo org={org} size="xl" />
              <div className="cb-profile-title">
                <div className="cb-profile-status">
                  <span className="cb-pill" data-tone={status.tone}><span className="cb-dot" aria-hidden="true" />{status.label}</span>
                  {badges.map((badge) => <span key={badge} className="cb-pill">{badge}</span>)}
                </div>
                <h1>{org.name}</h1>
                <p>{firstParagraph}</p>
              </div>
              <div className="cb-profile-actions">
                {isUrl(contact.ideas_url) ? (
                  <a href={contact.ideas_url} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-ink">Ideas list <IconArrowUpRight size={16} stroke={2} aria-hidden /></a>
                ) : null}
                {isUrl(org.website) ? (
                  <a href={org.website} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-outline">Website <IconArrowUpRight size={16} stroke={2} aria-hidden /></a>
                ) : null}
                <SaveButton slug={org.slug} name={org.name} variant="button" />
                <span className="cb-copy-link"><CopyLink /></span>
              </div>
            </div>
          </div>
        </section>

        <div className="cb-page cb-profile-body">
          <div className="cb-kpis cb-kpis-profile">
            <StatTile
              label={`Contributors in ${CURRENT_YEAR}`}
              value={org.inCurrent ? org.current : "–"}
              context={org.inCurrent ? (org.previous ? (change === 0 ? `Same as ${CURRENT_YEAR - 1}` : `${change > 0 ? "+" : "−"}${Math.abs(change)} from ${CURRENT_YEAR - 1}`) : org.isNew ? "First cycle" : `Not in ${CURRENT_YEAR - 1}`) : withdrew ? "Withdrew" : "Not taking part"}
              accent={org.inCurrent}
            />
            <StatTile label="Projects since 2016" value={fmt(org.totalProjects)} context={`${org.average} a cycle on average`} />
            <StatTile label="Cycles" value={<>{org.cycles}<small> of {YEARS.length}</small></>} context={org.inCurrent && org.streak > 1 ? `${org.streak}-cycle streak` : `First in ${org.firstYear}`} />
            <StatTile label={`Rank in ${CURRENT_YEAR}`} value={data.rank ? `#${data.rank}` : "–"} context={data.rank ? `of ${data.currentCount}, ${(data.share * 100).toFixed(1)}% of slots` : "By contributors"} />
            <StatTile label="Mentors" value={data.mentors ? data.mentors.count : "–"} context={data.mentors ? `for ${plural(data.mentors.slots, "project")} in ${data.mentors.year}` : "Not published"} />
          </div>

          <div className="cb-profile-grid">
            <div className="cb-profile-main">
              <article className="cb-card">
                <header className="cb-card-head">
                  <div>
                    <h2>Contributors per cycle</h2>
                    <p>Accepted projects each year, against the median organization that year</p>
                  </div>
                </header>
                <ColumnChart
                  labels={YEARS}
                  series={{ label: org.name, values: org.slots }}
                  compare={{ label: "Median organization", values: series.map((row) => row.median) }}
                  caption={`${org.name} contributors per cycle`}
                />
                {org.withdrawnYears.length ? <p className="cb-card-note">Withdrew in {org.withdrawnYears.join(", ")}; shown as zero.</p> : null}
              </article>

              <article className="cb-card">
                <header className="cb-card-head"><div><h2>Stack and topics</h2><p>Each one has its own page of organizations and trends</p></div></header>
                <div className="cb-taglists">
                  <div>
                    <p className="cb-taglist-title"><IconCode size={14} stroke={1.75} aria-hidden /> Technologies</p>
                    <div className="cb-tags cb-tags-lg">{org.technologies.length ? org.technologies.map((tech) => <Link key={tech} className="cb-tag" href={technologyHref(tech)}>{techLabel(tech)}</Link>) : <span className="cb-quiet">None listed</span>}</div>
                  </div>
                  <div>
                    <p className="cb-taglist-title"># Topics</p>
                    <div className="cb-tags cb-tags-lg">{org.topics.length ? org.topics.map((topic) => <Link key={topic} className="cb-tag" href={topicHref(topic)}>{topicLabel(topic)}</Link>) : <span className="cb-quiet">None listed</span>}</div>
                  </div>
                </div>
                {more.length ? (
                  <details className="cb-more-about">
                    <summary>More about {org.name}</summary>
                    {more.slice(0, 4).map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
                  </details>
                ) : null}
              </article>

              <div className="cb-card cb-answers">
                <header className="cb-card-head"><div><h2>Quick answers</h2></div></header>
                <dl>
                  {answers.map((answer) => (
                    <div key={answer.q}><dt>{answer.q}</dt><dd>{answer.a}</dd></div>
                  ))}
                </dl>
              </div>

              <section className="cb-projects" aria-labelledby="cb-projects-title">
                <ProjectYears
                  title="Accepted projects"
                  summary={data.projectTotal ? <Link href={`/organizations/${org.slug}/projects`} className="cb-inline-link">All {fmt(data.projectTotal)} projects since 2016</Link> : null}
                  years={data.yearPanels.map((panel) => ({ year: panel.year, count: panel.projects.length }))}
                >
                  {data.yearPanels.map((panel) => (
                    <div key={panel.year}>
                      <ol className="cb-project-list">
                        {panel.projects.slice(0, 8).map((project, index) => <ProjectItem key={`${project.t}-${index}`} project={project} />)}
                      </ol>
                      {panel.projects.length > 8 ? (
                        <details className="cb-project-more">
                          <summary>Show {plural(panel.projects.length - 8, "more project")}</summary>
                          <ol className="cb-project-list">
                            {panel.projects.slice(8).map((project, index) => <ProjectItem key={`${project.t}-more-${index}`} project={project} />)}
                          </ol>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </ProjectYears>
                {!data.yearPanels.length ? <p className="cb-card-note">Google has not published projects for this organization in the archive.</p> : null}
              </section>
            </div>

            <aside className="cb-profile-side">
              <div className="cb-card cb-start">
                <header className="cb-card-head"><div><h2>Where to start</h2><p>Official links from the program listing</p></div></header>
                {start.length ? (
                  <ul className="cb-start-list">
                    {start.map((item) => {
                      const Icon = item.icon;
                      const body = (
                        <>
                          <span className="cb-start-icon" aria-hidden="true"><Icon size={16} stroke={1.75} /></span>
                          <span className="cb-start-copy"><strong>{item.label}</strong><small className="cb-truncate">{item.detail}</small></span>
                          {item.href ? <IconArrowUpRight className="cb-start-go" size={14} stroke={2} aria-hidden /> : null}
                        </>
                      );
                      return (
                        <li key={item.label} data-primary={"primary" in item || undefined}>
                          {item.href ? <a href={item.href} target={item.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer noopener">{body}</a> : <span>{body}</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="cb-card-note">No contact links were published for this organization.</p>}
                {socials.length ? (
                  <div className="cb-socials">
                    {socials.map(([key, value]) => {
                      const Icon = SOCIAL[key].icon;
                      return <a key={key} href={value} target="_blank" rel="noreferrer noopener" className="cb-icon-button cb-icon-button-bordered" aria-label={SOCIAL[key].label} title={SOCIAL[key].label}><Icon size={16} stroke={1.75} aria-hidden /></a>;
                    })}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>

          <ContributorWorkSection
            id="cb-cw-org"
            eyebrow="FROM PAST CONTRIBUTORS"
            title="Learn from past contributors"
            work={work}
            proposalsHref={`/proposals?organization=${encodeURIComponent(org.slug)}`}
            postsHref={`/contributor-blogs?organization=${encodeURIComponent(org.slug)}`}
            emptyText={`No accepted proposals or progress posts from ${org.name} contributors yet. Contributed here? Share yours.`}
          />

          {data.related.length ? (
            <section className="cb-related" aria-labelledby="cb-related-title">
              <div className="cb-related-head">
                <div>
                  <Eyebrow>ALSO IN GSOC {CURRENT_YEAR}</Eyebrow>
                  <h2 id="cb-related-title">Organizations with a similar stack</h2>
                </div>
                <Link href={`${directory}?tech=${encodeURIComponent((org.technologies[0] ?? "").toLocaleLowerCase("en"))}`} className="cb-text-link">More like this <IconArrowRight size={16} stroke={2} aria-hidden /></Link>
              </div>
              <ul className="cb-related-grid">
                {data.related.map((other) => {
                  const shared = other.technologies.filter((tech) => org.technologies.some((mine) => mine.toLocaleLowerCase("en") === tech.toLocaleLowerCase("en"))).slice(0, 3);
                  return (
                    <li key={other.slug}>
                      <article className="cb-related-card">
                        <div className="cb-related-top">
                          <Logo org={other} size="md" />
                          <Sparkline values={other.slots} years={YEARS} name={other.name} width={80} height={24} />
                        </div>
                        <h3><Link href={`${directory}/${other.slug}`} className="cb-row-link">{other.name}</Link></h3>
                        <p>{plural(other.current, "contributor")} in {CURRENT_YEAR} · {other.cycles} cycles</p>
                        {shared.length ? <p className="cb-related-shared">Shares {shared.map(techLabel).join(", ")}</p> : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <p className="cb-results-note">Data: Google Summer of Code public archive. Contributor counts are accepted projects.</p>
        </div>
    </main>
  );
}

function ProjectItem({ project }: { project: { t: string; c: string | null; m: string[]; d: string; u: string | null; g: string | null; href: string | null } }) {
  return (
    <li className="cb-project">
      <div className="cb-project-main">
        <h3>{project.href ? <Link href={project.href} prefetch={false} className="cb-project-title">{project.t}</Link> : project.t}</h3>
        <p className="cb-project-people">
          <span>{project.c ?? "Contributor not listed"}</span>
          {project.m.length ? <span>Mentored by {project.m.slice(0, 3).join(", ")}{project.m.length > 3 ? ` +${project.m.length - 3}` : ""}</span> : null}
        </p>
        {project.d ? <p className="cb-project-desc">{project.d}</p> : null}
      </div>
      <div className="cb-project-links">
        {project.href ? <Link href={project.href} prefetch={false} className="cb-arrow">Project</Link> : project.u ? <a href={project.u} target="_blank" rel="noreferrer noopener" className="cb-arrow-out">Project</a> : null}
        {project.g ? <a href={project.g} target="_blank" rel="noreferrer noopener" className="cb-arrow-out">{workProductShortLabel(project.g)}</a> : null}
      </div>
    </li>
  );
}
