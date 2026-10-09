import Image from "next/image";
import Link from "next/link";
import {
  IconArrowLeft, IconArrowRight, IconArrowUpRight, IconBook, IconBrandGithub, IconCode, IconDownload, IconFileText,
  IconMail, IconPlugConnectedX, IconSearch, IconShieldCheck, IconX,
} from "@tabler/icons-react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { SOCIAL_LINKS } from "@/components/footer-common";
import type { ChangelogEntry } from "@/lib/changelog-data";
import type { ContributorBlog } from "@/lib/contributor-blogs";
import type { ArchiveFacets, ArchiveResult, ArchiveSearchResponse } from "@/lib/proposals/archive-search";
import { filterArchiveOrganizationsByYear } from "@/lib/proposals/archive-search-core";
import type { PublicProposal } from "@/lib/proposals/queries";
import { technologyHref } from "@/lib/vocabulary/catalog";
import { cobaltOrganization, cobaltOrganizations, CURRENT_YEAR, programSeries, YEARS } from "../data";
import { techLabel } from "../labels";
import { pageWindow } from "../links";
import { PageHead, SectionHead } from "../page";
import { SearchPanel } from "../shell";
import { Eyebrow, fmt, Logo, plural, StatTile } from "../ui";
import { AdminNav, FilterMenu, type MenuOption } from "./community-client";
import "../community.css";

const CONTACT_EMAIL = "gsocorganizationsguide@gmail.com";

/** Logo for an organization slug, falling back to initials when the slug is not in the snapshot. */
function OrgLogo({ slug, name, size = "sm" }: { slug: string; name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const org = cobaltOrganization(slug);
  return <Logo org={org ?? { name, logo: null }} size={size} />;
}

function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="cb-pagination" aria-label="Result pages">
      {page > 1 ? <Link href={href(page - 1)} className="cb-button cb-button-outline cb-button-sm"><IconArrowLeft size={14} stroke={2} aria-hidden />Previous</Link> : <span className="cb-button cb-button-outline cb-button-sm" aria-disabled="true"><IconArrowLeft size={14} stroke={2} aria-hidden />Previous</span>}
      <ol>
        {pageWindow(page, pages).map((value, index) => (
          <li key={value ?? `gap-${index}`}>
            {value === null ? <span className="cb-page-gap">…</span> : <Link href={href(value)} aria-current={value === page ? "page" : undefined}>{fmt(value)}</Link>}
          </li>
        ))}
      </ol>
      {page < pages ? <Link href={href(page + 1)} className="cb-button cb-button-outline cb-button-sm">Next<IconArrowRight size={14} stroke={2} aria-hidden /></Link> : <span className="cb-button cb-button-outline cb-button-sm" aria-disabled="true">Next<IconArrowRight size={14} stroke={2} aria-hidden /></span>}
    </nav>
  );
}

/* ================================================================== */
/* Proposal archive                                                    */

export type ProposalParams = { q?: string; year?: string; organization?: string; technology?: string; page?: string };
type FacetKey = "q" | "year" | "organization" | "technology";

export function ProposalsView({ params, facets, results, latest, page }: {
  params: ProposalParams;
  facets: ArchiveFacets;
  results: ArchiveSearchResponse | null;
  latest: { data: PublicProposal[]; total: number } | null;
  page: number;
}) {
  const year = Number.parseInt(params.year ?? "", 10);
  const selectedYear = Number.isFinite(year) ? year : undefined;
  const hasQuery = Boolean(params.q || params.year || params.organization || params.technology);
  const pageCount = results ? Math.max(1, Math.ceil(results.total / results.limit)) : 1;
  const offline = !facets.years.length;

  /** Current filters with some keys replaced; a facet change always returns to page one. */
  const hrefWith = (changes: Partial<Record<FacetKey, string | undefined>>) => {
    const query = new URLSearchParams();
    for (const key of ["q", "year", "organization", "technology"] as const) {
      const value = key in changes ? changes[key] : params[key];
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/proposals?${qs}` : "/proposals";
  };
  const pageHref = (next: number) => {
    const query = new URLSearchParams();
    for (const key of ["q", "year", "organization", "technology"] as const) if (params[key]) query.set(key, params[key]!);
    query.set("page", String(next));
    return `/proposals?${query}`;
  };

  const yearOptions: MenuOption[] = facets.years.map((value) => {
    // Picking a year drops an organization that did not take part that year.
    const keepOrg = params.organization && facets.organizations.some((org) => org.slug === params.organization && org.years.includes(value));
    return { label: `GSoC ${value}`, href: hrefWith({ year: String(value), organization: keepOrg ? params.organization : undefined }), active: params.year === String(value) };
  });
  const organizationOptions: MenuOption[] = filterArchiveOrganizationsByYear(facets.organizations, selectedYear).map((org) => ({
    label: org.name,
    hint: plural(org.projectCount, "archived project"),
    keywords: org.slug,
    href: hrefWith({ organization: org.slug }),
    active: params.organization === org.slug,
  }));
  const technologyOptions: MenuOption[] = facets.technologies.map((group) => ({
    label: group.name,
    hint: plural(group.orgCount, "organization"),
    keywords: group.aliases.join(" "),
    href: hrefWith({ technology: group.key }),
    active: params.technology === group.key,
  }));

  const orgName = facets.organizations.find((org) => org.slug === params.organization)?.name ?? params.organization;
  const techName = facets.technologies.find((group) => group.key === params.technology)?.name ?? params.technology;
  const chips = [
    params.q ? { label: `“${params.q}”`, href: hrefWith({ q: undefined }) } : null,
    params.year ? { label: `GSoC ${params.year}`, href: hrefWith({ year: undefined }) } : null,
    params.organization ? { label: orgName ?? "", href: hrefWith({ organization: undefined }) } : null,
    params.technology ? { label: techName ?? "", href: hrefWith({ technology: undefined }) } : null,
  ].filter((chip): chip is { label: string; href: string } => Boolean(chip));

  const { projects, firstYear, lastYear } = facets.totals;

  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Proposals" }]}
        eyebrow="PROPOSAL ARCHIVE"
        title={<>Find a past GSoC project <span className="cb-serif">and the proposal behind it.</span></>}
        lede={<>Search {projects ? <>{fmt(projects)} accepted projects{firstYear && lastYear ? ` from ${firstYear} to ${lastYear}` : ""}</> : "accepted projects"} by title, year, organization or technology. Reading needs no account. If a project is yours, you can share the proposal that won it.</>}
        aside={<Link href="/share-proposal" className="cb-button cb-button-ink">Share your proposal <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-cm-search-block">
          <form role="search" action="/proposals" className="cb-dir-search cb-cm-search">
            <IconSearch className="cb-dir-search-icon" size={18} stroke={1.75} aria-hidden />
            <input className="cb-dir-search-input" name="q" type="search" defaultValue={params.q ?? ""} maxLength={80} aria-label="Search project titles" placeholder="Search words in a project title" autoComplete="off" spellCheck={false} />
            {params.year ? <input type="hidden" name="year" value={params.year} /> : null}
            {params.organization ? <input type="hidden" name="organization" value={params.organization} /> : null}
            {params.technology ? <input type="hidden" name="technology" value={params.technology} /> : null}
            <button type="submit" className="cb-button cb-button-ink cb-button-sm">Search</button>
          </form>
          {offline ? null : (
            <div className="cb-cm-filters" aria-label="Filters">
              <FilterMenu label="Year" anyLabel="Any year" anyHref={hrefWith({ year: undefined })} options={yearOptions} />
              <FilterMenu label="Organization" anyLabel="Any organization" anyHref={hrefWith({ organization: undefined })} options={organizationOptions} searchPlaceholder={`Search ${fmt(organizationOptions.length)} organizations`} />
              <FilterMenu label="Technology" anyLabel="Any technology" anyHref={hrefWith({ technology: undefined })} options={technologyOptions} searchPlaceholder="Python, Rust, React" note="Matches the organization's stack, not the single project." />
              <span className="cb-cm-filters-note">Every filter is optional.</span>
            </div>
          )}
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        {offline ? (
          <p className="cb-cm-notice"><IconPlugConnectedX size={18} stroke={1.75} aria-hidden /><span>The archive search is unavailable right now. Every organization page still lists its accepted projects. <Link href="/organizations" className="cb-inline-link">Browse organizations</Link></span></p>
        ) : null}

        {results ? (
          <section aria-labelledby="cb-cm-results">
            <div className="cb-results-bar">
              <h2 id="cb-cm-results" className="cb-results-count"><strong>{fmt(results.total)}</strong> {results.total === 1 ? "project" : "projects"}{pageCount > 1 ? <> · page {fmt(page)} of {fmt(pageCount)}</> : null}</h2>
            </div>
            {chips.length ? (
              <div className="cb-chips" aria-label="Active filters">
                {chips.map((chip) => <Link key={chip.label} href={chip.href} className="cb-chip" aria-label={`Remove ${chip.label}`}>{chip.label}<IconX size={12} stroke={2.25} aria-hidden /></Link>)}
                <Link href="/proposals" className="cb-chip-clear">Clear all</Link>
              </div>
            ) : null}
            {results.technologyOrganizations ? (
              <p className="cb-cm-notice">
                <IconCode size={18} stroke={1.75} aria-hidden />
                <span>GSoC lists technologies on the organization, not on each project. These are all projects at the {plural(results.technologyOrganizations, "organization")} that list {techName}{results.technologyOrganizations > facets.organizations.length / 3 ? ". That is a large share of the archive, so add a year or an organization to narrow it." : "."}</span>
              </p>
            ) : null}
            {results.data.length ? (
              <>
                <ol className="cb-cm-results">{results.data.map((result) => <li key={result.projectId}><ArchiveRow result={result} /></li>)}</ol>
                <Pagination page={page} pages={pageCount} href={pageHref} />
              </>
            ) : (
              <div className="cb-empty">
                <span className="cb-empty-icon" aria-hidden="true"><IconSearch size={20} stroke={1.75} /></span>
                <h2>Nothing matched those filters</h2>
                <p>Remove words from the title or widen the year. Organizations and technologies come from the archive, so those two are never misspelled.</p>
                <div><Link href="/proposals" className="cb-button cb-button-ink cb-button-sm">Start over</Link></div>
              </div>
            )}
          </section>
        ) : (
          <section aria-labelledby="cb-cm-latest">
            <SectionHead id="cb-cm-latest" eyebrow="RECENTLY SHARED" title="Proposals from past contributors" action={hasQuery ? undefined : { label: "Share yours", href: "/share-proposal" }} />
            <p className="cb-cm-section-note">Every document is matched to an archived GSoC selection and published only with the contributor&apos;s submission or recorded permission, after a moderator review.</p>
            {latest?.data.length ? (
              <ul className="cb-cm-cards">{latest.data.map((proposal) => <li key={proposal.id}><ProposalCard proposal={proposal} /></li>)}</ul>
            ) : (
              <div className="cb-empty">
                <span className="cb-empty-icon" aria-hidden="true"><IconFileText size={20} stroke={1.75} /></span>
                <h2>No proposals shared yet</h2>
                <p>Only verified submissions are published. Search the archive above for your own project and share the proposal behind it.</p>
                <div><Link href="/share-proposal" className="cb-button cb-button-ink cb-button-sm">Share a proposal</Link></div>
              </div>
            )}
          </section>
        )}

        <p className="cb-results-note">Projects come from Google&apos;s public GSoC archive. Shared proposals are published under CC BY 4.0 by their authors and are not endorsed by Google or the organizations.</p>
      </div>
    </main>
  );
}

function ArchiveRow({ result }: { result: ArchiveResult }) {
  const claimHref = `/share-proposal?project=${encodeURIComponent(result.externalId)}&year=${result.year}`;
  return (
    <article className="cb-cm-result">
      <OrgLogo slug={result.organizationSlug} name={result.organizationName} size="md" />
      <div className="cb-cm-result-body">
        <p className="cb-cm-meta">
          <span>GSoC {result.year}</span>
          <Link href={`/organizations/${result.organizationSlug}`}>{result.organizationName}</Link>
          {result.proposalSlug ? <span className="cb-badge" data-tone="accent">Proposal shared</span> : null}
        </p>
        <h3>{result.title}</h3>
        {result.contributors.length ? (
          <p className="cb-project-people">
            <span>{result.contributors.map((person) => person.name).join(", ")}</span>
            {result.mentors.length ? <span>Mentored by {result.mentors.join(", ")}</span> : null}
          </p>
        ) : null}
        {result.abstract ? <p className="cb-cm-clamp">{result.abstract}</p> : null}
      </div>
      <div className="cb-cm-result-action">
        {result.proposalSlug ? (
          <Link href={`/proposals/${result.proposalSlug}`} className="cb-button cb-button-ink cb-button-sm">Read the proposal <IconArrowRight size={14} stroke={2} aria-hidden /></Link>
        ) : (
          <>
            <Link href={claimHref} className="cb-button cb-button-outline cb-button-sm">This is mine, share it</Link>
            <small>No proposal shared yet</small>
          </>
        )}
      </div>
    </article>
  );
}

function ProposalCard({ proposal }: { proposal: PublicProposal }) {
  return (
    <article className="cb-post-card cb-cm-card">
      <p className="cb-post-meta"><span>GSoC {proposal.year}</span><span>PDF</span></p>
      <h3><Link href={`/proposals/${proposal.public_slug}`} className="cb-row-link">{proposal.project_title}</Link></h3>
      <p className="cb-cm-card-org"><OrgLogo slug={proposal.organization_slug} name={proposal.organization_name} size="xs" /><span className="cb-truncate">{proposal.organization_name}</span></p>
      {proposal.abstract_short ? <p className="cb-post-desc">{proposal.abstract_short}</p> : null}
      <p className="cb-cm-card-foot"><span>Shared by</span> {proposal.display_name}</p>
    </article>
  );
}

/* ================================================================== */
/* One approved proposal                                               */

const fileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function ProposalDetailView({ proposal, jsonLd }: { proposal: PublicProposal; jsonLd: Record<string, unknown> }) {
  const org = cobaltOrganization(proposal.organization_slug);
  const pdf = `/api/v2/proposals/${proposal.id}/pdf`;
  const curated = proposal.submission_source === "admin_curated";
  const technologies = org?.technologies.slice(0, 10) ?? [];
  const approved = new Date(proposal.approved_at);
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Proposals", href: "/proposals" }, { label: `GSoC ${proposal.year}` }]}
        eyebrow={`GSOC ${proposal.year} PROPOSAL`}
        title={proposal.project_title}
        lede={proposal.abstract_short ?? undefined}
        aside={<a href={pdf} className="cb-button cb-button-ink"><IconDownload size={16} stroke={2} aria-hidden />Open PDF</a>}
      />

      <div className="cb-page cb-page-body">
        <div className="cb-cm-article">
          <div className="cb-cm-article-main">
            <div className="cb-cm-pdf">
              <iframe title={`${proposal.project_title} proposal PDF`} src={`${pdf}#toolbar=1`} sandbox="allow-same-origin allow-downloads" />
            </div>
            <p className="cb-card-note">The PDF preview is sandboxed. If your browser does not show it, use Open PDF.</p>
            <p className="cb-cm-back"><Link href="/proposals" className="cb-text-link"><IconArrowLeft size={16} stroke={2} aria-hidden />All proposals</Link></p>
          </div>

          <aside className="cb-cm-side" aria-label="About this proposal">
            <article className="cb-card">
              <Eyebrow>ORGANIZATION</Eyebrow>
              <div className="cb-cm-side-org">
                <Logo org={org ?? { name: proposal.organization_name, logo: null }} size="md" />
                <div>
                  <Link href={`/organizations/${proposal.organization_slug}`} className="cb-cm-side-name">{proposal.organization_name}</Link>
                  {org?.category ? <span>{org.category}</span> : null}
                </div>
              </div>
              {technologies.length ? (
                <div className="cb-tags cb-cm-side-tags">
                  {technologies.map((tech) => <Link key={tech} href={technologyHref(tech)} className="cb-tag">{techLabel(tech)}</Link>)}
                </div>
              ) : null}
              <dl className="cb-cm-facts">
                <div><dt>Year</dt><dd><Link href={`/projects/${proposal.year}`} className="cb-inline-link">GSoC {proposal.year}</Link></dd></div>
                <div><dt>Contributor</dt><dd>{proposal.archived_contributor_name}</dd></div>
                <div><dt>Published</dt><dd><time dateTime={proposal.approved_at}>{approved.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time></dd></div>
                {proposal.pdf_byte_size ? <div><dt>File</dt><dd>PDF, {fileSize(proposal.pdf_byte_size)}</dd></div> : null}
                <div><dt>License</dt><dd><a className="cb-inline-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a></dd></div>
              </dl>
              <a href={pdf} className="cb-button cb-button-outline cb-cm-wide"><IconDownload size={16} stroke={2} aria-hidden />Open PDF</a>
            </article>

            <article className="cb-card">
              <Eyebrow>SHARED BY</Eyebrow>
              <div className="cb-cm-side-person">
                {proposal.avatar_r2_key ? <Image src={`/api/v2/proposals/${proposal.id}/avatar`} width={44} height={44} alt="" unoptimized /> : null}
                <div>
                  <p className="cb-cm-side-name">{proposal.display_name}</p>
                  <span>Archived contributor: {proposal.archived_contributor_name}</span>
                </div>
              </div>
              {proposal.bio ? <p className="cb-cm-side-text">{proposal.bio}</p> : null}
              {proposal.profile_links.length ? (
                <div className="cb-tags cb-cm-side-tags">
                  {proposal.profile_links.map((link) => <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" className="cb-tag">{link.label || link.platform}<IconArrowUpRight size={12} stroke={2} aria-hidden /></a>)}
                </div>
              ) : null}
            </article>

            <article className="cb-card">
              <p className="cb-cm-verified"><IconShieldCheck size={18} stroke={1.75} aria-hidden />{curated ? "Curated with permission" : "Verified submission"}</p>
              <p className="cb-cm-side-text">{curated ? "An administrator matched this document to the archived contributor record and recorded a publication-rights basis before publishing it." : "A moderator matched this submission to the archived contributor record."} It is not an official endorsement by Google or the organization.</p>
              <p className="cb-cm-side-fine">The rights holder keeps copyright and publishes this document under <a className="cb-inline-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a>.</p>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ================================================================== */
/* Contributor blogs                                                   */

export function ContributorBlogsView({ params, blogs, facets }: { params: { year?: string; organization?: string }; blogs: ContributorBlog[]; facets: ArchiveFacets }) {
  const year = Number.parseInt(params.year ?? "", 10);
  const hrefWith = (changes: { year?: string; organization?: string }) => {
    const query = new URLSearchParams();
    for (const key of ["year", "organization"] as const) {
      const value = key in changes ? changes[key] : params[key];
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/contributor-blogs?${qs}` : "/contributor-blogs";
  };
  const yearOptions: MenuOption[] = facets.years.map((value) => {
    const keepOrg = params.organization && facets.organizations.some((org) => org.slug === params.organization && org.years.includes(value));
    return { label: `GSoC ${value}`, href: hrefWith({ year: String(value), organization: keepOrg ? params.organization : undefined }), active: params.year === String(value) };
  });
  const organizationOptions: MenuOption[] = filterArchiveOrganizationsByYear(facets.organizations, Number.isFinite(year) ? year : undefined).map((org) => ({
    label: org.name, keywords: org.slug, href: hrefWith({ organization: org.slug }), active: params.organization === org.slug,
  }));
  const filtered = Boolean(params.year || params.organization);
  const orgCount = new Set(blogs.map((blog) => blog.organization_slug)).size;

  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Contributor blogs" }]}
        eyebrow="CONTRIBUTOR BLOGS"
        title={<>Project blogs <span className="cb-serif">written by GSoC contributors.</span></>}
        lede="Weekly updates, technical decisions and final reports from accepted contributors, in their own words. Each blog is linked to its archived project and added by hand."
        aside={<Link href="/proposals" className="cb-button cb-button-outline">Read proposals <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        {facets.years.length ? (
          <div className="cb-cm-filters" aria-label="Filters">
            <FilterMenu label="Year" anyLabel="All years" anyHref={hrefWith({ year: undefined })} options={yearOptions} />
            <FilterMenu label="Organization" anyLabel="All organizations" anyHref={hrefWith({ organization: undefined })} options={organizationOptions} searchPlaceholder={`Search ${fmt(organizationOptions.length)} organizations`} />
            {filtered ? <Link href="/contributor-blogs" className="cb-chip-clear">Clear filters</Link> : null}
          </div>
        ) : null}
      </PageHead>

      <div className="cb-page cb-page-body">
        <section aria-labelledby="cb-cm-blogs">
          <div className="cb-results-bar">
            <h2 id="cb-cm-blogs" className="cb-results-count"><strong>{fmt(blogs.length)}</strong> public {blogs.length === 1 ? "blog" : "blogs"}{orgCount > 1 ? <> from {plural(orgCount, "organization")}</> : null}</h2>
          </div>
          {blogs.length ? (
            <ul className="cb-cm-cards">
              {blogs.map((blog) => (
                <li key={blog.id}>
                  <article className="cb-post-card cb-cm-card">
                    <p className="cb-post-meta"><span>GSoC {blog.year}</span><span>Blog</span></p>
                    <h3><a href={blog.url} target="_blank" rel="noopener noreferrer" className="cb-row-link">{blog.project_title}</a></h3>
                    <p className="cb-cm-card-org"><OrgLogo slug={blog.organization_slug} name={blog.organization_name} size="xs" /><span className="cb-truncate">{blog.organization_name}</span></p>
                    <p className="cb-cm-card-foot"><span>By</span> {blog.contributor_name}</p>
                    <div className="cb-cm-card-links">
                      <a href={blog.url} target="_blank" rel="noopener noreferrer" className="cb-button cb-button-ink cb-button-sm"><IconBook size={15} stroke={1.75} aria-hidden /><span className="cb-truncate">{blog.title || "Read the blog"}</span><IconArrowUpRight size={14} stroke={2} aria-hidden /></a>
                      {blog.code_url ? <a href={blog.code_url} target="_blank" rel="noopener noreferrer" className="cb-button cb-button-outline cb-button-sm"><IconCode size={15} stroke={1.75} aria-hidden />Code</a> : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cb-empty">
              <span className="cb-empty-icon" aria-hidden="true"><IconBook size={20} stroke={1.75} /></span>
              <h2>{filtered ? "No blogs match these filters" : "No contributor blogs listed yet"}</h2>
              <p>Blogs are added by hand after review. {filtered ? "Try a wider filter." : "Accepted proposals from past contributors are already searchable."}</p>
              <div>{filtered ? <Link href="/contributor-blogs" className="cb-button cb-button-ink cb-button-sm">Clear filters</Link> : <Link href="/proposals" className="cb-button cb-button-outline cb-button-sm">Search proposals</Link>}</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ================================================================== */
/* Editorial pages                                                     */

export function AboutView() {
  const orgs = cobaltOrganizations();
  const series = programSeries();
  const projects = series.reduce((sum, entry) => sum + entry.slots, 0);
  const current = series.at(-1);
  const technologies = new Set(orgs.flatMap((org) => org.technologies.map((tech) => tech.trim().toLocaleLowerCase("en")))).size;
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow="ABOUT"
        title={<>An independent guide <span className="cb-serif">to GSoC organizations.</span></>}
        lede={`GSoC Organizations Guide covers every organization that has taken part in Google Summer of Code since ${YEARS[0]}: how many contributors each one accepted, what they worked on and which technologies they use.`}
        aside={<Link href="/organizations" className="cb-button cb-button-ink">Browse organizations <IconArrowRight size={16} stroke={2} aria-hidden /></Link>}
      >
        <div className="cb-kpis">
          <StatTile label="Organizations" value={fmt(orgs.length)} context={`Since ${YEARS[0]}`} accent />
          <StatTile label="Cycles covered" value={YEARS.length} context={`${YEARS[0]} to ${CURRENT_YEAR}`} />
          <StatTile label="Accepted projects" value={fmt(projects)} context="All cycles" />
          {current ? <StatTile label={`In GSoC ${CURRENT_YEAR}`} value={fmt(current.orgs)} context={`${fmt(current.slots)} contributors`} /> : null}
          <StatTile label="Technologies listed" value={fmt(technologies)} context="By organizations" />
        </div>
      </PageHead>

      <div className="cb-page cb-page-body">
        <div className="cb-cm-editorial">
          <article className="cb-cm-prose">
            <h2>What the guide is for</h2>
            <p>Picking an organization is the first real decision in a GSoC application. The official archive lists who took part each year, but comparing organizations across cycles means opening hundreds of pages. This site puts that history in one place so you can see which organizations return every year, how many contributors they take and what kind of work they mentor.</p>
            <h2>Where the data comes from</h2>
            <p>Organization profiles, accepted projects and contributor counts come from Google&apos;s public <a className="cb-inline-link" href="https://summerofcode.withgoogle.com/archive" target="_blank" rel="noreferrer noopener">GSoC program archive</a>. Technology and topic pages group the labels organizations give themselves, so similar spellings are counted together.</p>
            <h2>What it does not do</h2>
            <ul>
              <li>It is not affiliated with or endorsed by Google. Google Summer of Code is a trademark of Google LLC.</li>
              <li>It does not predict selection. An organization that took many contributors in the past may take fewer next year.</li>
              <li>It does not rank your chances. The numbers describe what happened, and the decision stays yours.</li>
            </ul>
            <h2>Proposals and contributor blogs</h2>
            <p>Past contributors can share the proposal that got them accepted. Each one is matched to its archived project and reviewed before it is published. <Link className="cb-inline-link" href="/proposals">Search the proposal archive</Link> or read <Link className="cb-inline-link" href="/contributor-blogs">contributor blogs</Link>.</p>
            <h2>Open source</h2>
            <p>The code is public on <a className="cb-inline-link" href={SOCIAL_LINKS.github.href} target="_blank" rel="noreferrer noopener">GitHub</a>. Issues and pull requests are welcome, and so are corrections to organization data through the <Link className="cb-inline-link" href="/contact">contact page</Link>.</p>
          </article>

          <aside className="cb-cm-side" aria-label="Start here">
            <article className="cb-card">
              <Eyebrow>START HERE</Eyebrow>
              <ul className="cb-cm-linklist">
                <li><Link href="/organizations">Organization directory<IconArrowRight size={15} stroke={2} aria-hidden /></Link></li>
                <li><Link href="/tech-stack">Technologies<IconArrowRight size={15} stroke={2} aria-hidden /></Link></li>
                <li><Link href="/proposals">Proposal archive<IconArrowRight size={15} stroke={2} aria-hidden /></Link></li>
                <li><Link href="/changelog">Changelog<IconArrowRight size={15} stroke={2} aria-hidden /></Link></li>
                <li><Link href="/contact">Contact<IconArrowRight size={15} stroke={2} aria-hidden /></Link></li>
              </ul>
            </article>
            <a href={SOCIAL_LINKS.github.href} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-outline cb-cm-wide"><IconBrandGithub size={16} stroke={1.75} aria-hidden />Source on GitHub</a>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function ContactView({ form }: { form: React.ReactNode }) {
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        eyebrow="CONTACT"
        title={<>Write to us <span className="cb-quiet">about the guide.</span></>}
        lede="Questions, corrections to organization data, feature ideas or feedback. We usually reply within one or two days."
      />
      <div className="cb-page cb-page-body">
        <div className="cb-cm-editorial">
          <article className="cb-card cb-cm-form-card">
            <header className="cb-card-head"><div><h2>Send a message</h2><p>All fields are required.</p></div></header>
            {form}
          </article>
          <aside className="cb-cm-side" aria-label="Other ways to reach us">
            <article className="cb-card">
              <Eyebrow>EMAIL</Eyebrow>
              <a className="cb-cm-mail" href={`mailto:${CONTACT_EMAIL}`}><IconMail size={17} stroke={1.75} aria-hidden />{CONTACT_EMAIL}</a>
            </article>
            <article className="cb-card">
              <Eyebrow>WHAT TO WRITE ABOUT</Eyebrow>
              <dl className="cb-cm-topics">
                <div><dt>Corrections</dt><dd>A wrong count, link or description on an organization page. Include the page address.</dd></div>
                <div><dt>Questions</dt><dd>How GSoC works, or how to use a part of this site.</dd></div>
                <div><dt>Proposals</dt><dd>Sharing, updating or removing a proposal you published.</dd></div>
                <div><dt>Partnerships</dt><dd>Working together or featuring your organization.</dd></div>
              </dl>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}

const CHANGE_LABEL: Record<ChangelogEntry["changes"][number]["type"], string> = {
  feat: "New", fix: "Fix", perf: "Speed", docs: "Docs", style: "Design", refactor: "Refactor", test: "Tests", chore: "Upkeep",
};

/** Turns [text](url) in a change line into links. */
function withLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="cb-inline-link">{match[1]}</a>);
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const anchor = (version: string) => `release-${version.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLocaleLowerCase("en")}`;

export function ChangelogView({ entries }: { entries: ChangelogEntry[] }) {
  const latest = entries[0];
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Changelog" }]}
        eyebrow="CHANGELOG"
        title={<>What changed <span className="cb-quiet">and when.</span></>}
        lede="Every release of GSoC Organizations Guide, newest first: features, data refreshes and fixes."
        aside={<a href={SOCIAL_LINKS.github.href} target="_blank" rel="noreferrer noopener" className="cb-button cb-button-outline"><IconBrandGithub size={16} stroke={1.75} aria-hidden />Source on GitHub</a>}
      >
        {latest ? <p className="cb-pill" data-tone="accent"><span className="cb-dot" aria-hidden="true" />Latest {latest.version}, {latest.date}</p> : null}
      </PageHead>

      <div className="cb-page cb-page-body">
        <ol className="cb-cm-timeline">
          {entries.map((entry) => (
            <li key={entry.version} id={anchor(entry.version)} className="cb-cm-release">
              <div className="cb-cm-release-when">
                <time>{entry.date}</time>
                <a href={`#${anchor(entry.version)}`} className="cb-badge">{entry.version}</a>
                {entry.prLinks.length ? (
                  <span className="cb-cm-release-prs">
                    {entry.prLinks.map((pr) => <a key={pr.link} href={pr.link} target="_blank" rel="noopener noreferrer"><IconBrandGithub size={13} stroke={1.75} aria-hidden />{pr.number}</a>)}
                  </span>
                ) : null}
              </div>
              <span className="cb-cm-release-dot" aria-hidden="true" />
              <article className="cb-cm-release-body">
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
                <ul>
                  {entry.changes.map((change, index) => (
                    <li key={index}><span className="cb-cm-change" data-type={change.type}>{CHANGE_LABEL[change.type]}</span><span>{withLinks(change.text)}</span></li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

export interface LegalSection { title: string; content: string[] }

const slug = (value: string) => value.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Turns the contact address inside a legal line into a mail link. */
function withMail(text: string) {
  const at = text.indexOf(CONTACT_EMAIL);
  if (at === -1) return text;
  return <>{text.slice(0, at)}<a className="cb-inline-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{text.slice(at + CONTACT_EMAIL.length)}</>;
}

export function LegalView({ title, updated, intro, sections, closing }: { title: string; updated: string; intro: string; sections: LegalSection[]; closing: string }) {
  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: title }]}
        eyebrow="LEGAL"
        title={title}
        lede={<>Last updated {updated}.</>}
        aside={<Link href="/contact" className="cb-button cb-button-outline">Questions? Contact us</Link>}
      />
      <div className="cb-page cb-page-body">
        <div className="cb-cm-legal">
          <nav className="cb-cm-toc" aria-labelledby="cb-cm-toc-title">
            <p id="cb-cm-toc-title" className="cb-eyebrow">ON THIS PAGE</p>
            <ol>{sections.map((section, index) => <li key={section.title}><a href={`#${slug(section.title)}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}</ol>
          </nav>
          <article className="cb-cm-prose">
            <p className="cb-cm-intro">{intro}</p>
            {sections.map((section, index) => (
              <section key={section.title} id={slug(section.title)} aria-labelledby={`${slug(section.title)}-h`}>
                <h2 id={`${slug(section.title)}-h`}><span className="cb-cm-num">{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
                <ul>{section.content.map((item) => <li key={item}>{withMail(item)}</li>)}</ul>
              </section>
            ))}
            <p className="cb-cm-closing">{closing}</p>
          </article>
        </div>
      </div>
    </main>
  );
}

/* ================================================================== */
/* Sign in, 404, signed-in areas                                       */

export function LoginView({ configured, next, error }: { configured: boolean; next: string; error: boolean }) {
  return (
    <main className="cb-cm-center">
      <div className="cb-hero-grid" aria-hidden="true" />
      <div className="cb-card cb-cm-login">
        <Eyebrow>CONTRIBUTOR ACCESS</Eyebrow>
        <h1>Share an accepted GSoC proposal</h1>
        <p className="cb-cm-login-lede">Sign in with the Google account you want attached to your submission. Your email is used privately for sign-in and is never published.</p>
        <div className="cb-cm-login-action">
          {configured ? <GoogleSignIn next={next} /> : <p className="cb-cm-notice"><IconPlugConnectedX size={18} stroke={1.75} aria-hidden /><span>Sign-in is not available right now.</span></p>}
        </div>
        {error ? <p role="alert" className="cb-cm-alert">Google sign-in could not be completed. Please try again.</p> : null}
        <p className="cb-cm-login-fine">By continuing, you agree to the <Link className="cb-inline-link" href="/terms-and-conditions">terms</Link> and acknowledge the <Link className="cb-inline-link" href="/privacy-policy">privacy policy</Link>.</p>
      </div>
    </main>
  );
}

export function NotFoundView() {
  return (
    <main>
      <section className="cb-hero cb-not-found">
        <div className="cb-hero-grid" aria-hidden="true" />
        <div className="cb-page">
          <div className="cb-hero-copy">
            <p className="cb-eyebrow">404</p>
            <h1>This page does not exist. <span className="cb-serif">Search for it instead.</span></h1>
            <p className="cb-hero-lede">The link may be old or mistyped. Search organizations, technologies and topics, or start from the directory.</p>
            <div className="cb-not-found-search"><SearchPanel variant="hero" /></div>
            <div className="cb-cm-actions">
              <Link href="/organizations" className="cb-button cb-button-ink">Browse organizations <IconArrowRight size={16} stroke={2} aria-hidden /></Link>
              <Link href="/" className="cb-button cb-button-outline">Go to the home page</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AccountFrame({ children }: { children: React.ReactNode }) {
  return <div className="cb-page cb-cm-app">{children}</div>;
}

export function AdminFrame({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  const links = [
    { label: "Proposal queue", href: "/admin/proposals" },
    ...(isAdmin ? [{ label: "Imports & blogs", href: "/admin/content" }, { label: "Roles", href: "/admin/roles" }] : []),
  ];
  return (
    <div className="cb-page cb-cm-app">
      <div className="cb-cm-admin-bar">
        <AdminNav links={links} />
        <Link href="/account" className="cb-button cb-button-outline cb-button-sm">Contributor account <IconArrowRight size={14} stroke={2} aria-hidden /></Link>
      </div>
      {children}
    </div>
  );
}
