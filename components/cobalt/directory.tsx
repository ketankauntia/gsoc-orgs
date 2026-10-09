import Link from "next/link";
import { IconArrowLeft, IconArrowRight, IconCheck, IconLayoutGrid, IconSearch, IconTable, IconX } from "@tabler/icons-react";
import { DirectorySearch, FacetList, FilterButton, FilterRail, SaveButton, SortMenu } from "./controls";
import { capBuckets, cobaltOrganizations, CURRENT_YEAR, getCobaltDirectory, recordFilters, sortOptions, YEARS, type CobaltOrg, type SearchParams } from "./data";
import { techLabel, topicLabel } from "./labels";
import { cobaltLinks, pageWindow } from "./links";
import { AZList, OrgTable } from "./page";
import { Eyebrow, fmt, Logo, plural, Sparkline } from "./ui";

export const DIRECTORY_PAGE_SIZE = 24;

function Check({ href, label, count, active, detail }: { href: string; label: string; count: number; active: boolean; detail?: string }) {
  return (
    <Link href={href} scroll={false} className="cb-check" aria-current={active || undefined} data-empty={!count && !active ? "" : undefined}>
      <span className="cb-check-box" aria-hidden="true">{active ? <IconCheck size={12} stroke={3} /> : null}</span>
      <span className="cb-check-copy">
        <span className="cb-truncate">{label}</span>
        {detail ? <small>{detail}</small> : null}
      </span>
      <span className="cb-check-count">{count}</span>
    </Link>
  );
}

function Stack({ org, limit = 3 }: { org: CobaltOrg; limit?: number }) {
  const shown = org.technologies.slice(0, limit);
  const more = org.technologies.length - shown.length;
  return (
    <span className="cb-tags">
      {shown.map((tech) => <span key={tech} className="cb-tag">{techLabel(tech)}</span>)}
      {more > 0 ? <span className="cb-tag cb-tag-more">+{more}</span> : null}
    </span>
  );
}

export function CobaltDirectory({ params }: { params: SearchParams }) {
  const data = getCobaltDirectory(params, DIRECTORY_PAGE_SIZE);
  const { filters: f, facets } = data;
  const path = `/organizations`;
  const links = cobaltLinks(path, f);
  const profile = (slug: string) => `${path}/${slug}`;
  const first = data.total ? (f.page - 1) * data.pageSize + 1 : 0;
  const lastShown = Math.min(f.page * data.pageSize, data.total);
  const sorts = sortOptions.filter((option) => option.value !== "relevance" || f.q);
  const activeSort = sorts.find((option) => option.value === f.sort) ?? sorts[0];

  const chips: Array<{ label: string; href: string }> = [
    ...(f.q ? [{ label: `“${f.q}”`, href: links.search() }] : []),
    ...f.tech.map((value) => ({ label: techLabel(value), href: links.tech(value) })),
    ...f.topic.map((value) => ({ label: topicLabel(value), href: links.topic(value) })),
    ...f.cap.map((value) => ({ label: `${capBuckets.find((bucket) => bucket.value === value)?.label} contributors`, href: links.cap(value) })),
    ...(f.rec ? [{ label: recordFilters.find((filter) => filter.value === f.rec)?.label ?? f.rec, href: links.rec(f.rec) }] : []),
    ...(f.category ? [{ label: f.category, href: links.category(f.category) }] : []),
    ...f.years.map((year) => ({ label: `Took part in ${year}`, href: links.year(year) })),
    ...(f.isNew ? [{ label: `First time in ${CURRENT_YEAR}`, href: links.isNew() }] : []),
  ];

  const presets = [
    { label: "All", params: {} },
    ...data.collections.filter((collection) => collection.id !== "python").map((collection) => ({ label: collection.title, params: collection.params, count: collection.count })),
  ];

  return (
    <main>
      <section className="cb-dir-head">
        <div className="cb-page">
          <nav className="cb-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Organizations</span>
          </nav>
          <div className="cb-dir-title">
            <div>
              <Eyebrow>DIRECTORY</Eyebrow>
              <h1>{f.scope === "current" ? <>{data.scopeCounts.current} organizations <span className="cb-quiet">in GSoC {CURRENT_YEAR}</span></> : <>{data.scopeCounts.archive} organizations <span className="cb-quiet">since 2016</span></>}</h1>
              <p>Filter by stack, capacity and track record. Every number comes from Google&apos;s public archive.</p>
            </div>
            <div className="cb-segmented" role="group" aria-label="Which organizations">
              <Link href={links.scope("archive")} scroll={false} aria-current={f.scope === "archive" || undefined}>Since 2016 <span>{data.scopeCounts.archive}</span></Link>
              <Link href={links.scope("current")} scroll={false} aria-current={f.scope === "current" || undefined}>GSoC {CURRENT_YEAR} <span>{data.scopeCounts.current}</span></Link>
            </div>
          </div>
          <DirectorySearch action={path} query={links.query} value={f.q} placeholder="Search by name, technology or topic" />
          <div className="cb-presets" aria-label="Collections">
            {presets.map((preset) => (
              <Link key={preset.label} href={links.preset(preset.params)} scroll={false} aria-current={links.isPreset(preset.params) || undefined}>
                {preset.label}
                {"count" in preset ? <span>{preset.count}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="cb-page cb-dir-body">
        <FilterRail total={data.total}>
          <div className="cb-rail-head">
            <p>Filters</p>
            {links.facetCount ? <Link href={links.clear()} scroll={false}>Clear all</Link> : null}
          </div>

          <fieldset className="cb-facet">
            <legend>Technology</legend>
            <FacetList name="technologies" options={facets.tech.map((option) => ({ label: option.label, count: option.count, href: links.tech(option.value), active: f.tech.includes(option.value) }))} />
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Contributors in {CURRENT_YEAR}</legend>
            <ul>{facets.cap.map((option) => <li key={option.value}><Check href={links.cap(option.value)} label={option.label} count={option.count} active={f.cap.includes(option.value)} /></li>)}</ul>
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Track record</legend>
            <ul>{facets.rec.map((option) => <li key={option.value}><Check href={links.rec(option.value)} label={option.label} detail={option.detail} count={option.count} active={f.rec === option.value} /></li>)}</ul>
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Category</legend>
            <ul>{facets.category.map((option) => <li key={option.value}><Check href={links.category(option.label)} label={option.label} count={option.count} active={links.isCategory(option.label)} /></li>)}</ul>
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Topic</legend>
            <FacetList name="topics" initial={6} options={facets.topic.map((option) => ({ label: option.label, count: option.count, href: links.topic(option.value), active: f.topic.includes(option.value) }))} />
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Took part in</legend>
            <div className="cb-years">
              {facets.years.map((option) => (
                <Link key={option.year} href={links.year(option.year)} scroll={false} aria-current={f.years.includes(option.year) || undefined} data-empty={!option.count || undefined} data-tip={String(option.year)} data-tip-rows={`-|Organizations|${option.count}`}>
                  {option.year}
                </Link>
              ))}
            </div>
          </fieldset>

          <fieldset className="cb-facet">
            <legend>Newcomers</legend>
            <Link href={links.isNew()} scroll={false} className="cb-switch-row" aria-current={f.isNew || undefined}>
              <span>First time in {CURRENT_YEAR}<small>{facets.isNew} organizations</small></span>
              <span className="cb-switch" aria-hidden="true"><i /></span>
            </Link>
          </fieldset>
        </FilterRail>

        <div className="cb-results">
          <div className="cb-results-bar">
            <p className="cb-results-count" aria-live="polite">
              {data.total ? <>Showing <strong>{first}–{lastShown}</strong> of <strong>{plural(data.total, "organization")}</strong></> : "No organizations"}
            </p>
            <div className="cb-results-tools">
              <FilterButton count={links.facetCount} />
              <SortMenu label={activeSort.label} short={activeSort.short} options={sorts.map((option) => ({ label: option.label, href: links.sort(option.value), active: option.value === f.sort }))} />
              <div className="cb-segmented cb-segmented-icons" role="group" aria-label="View">
                <Link href={links.view("table")} scroll={false} aria-current={f.view === "table" || undefined} aria-label="Table view" title="Table"><IconTable size={16} stroke={1.75} aria-hidden /></Link>
                <Link href={links.view("cards")} scroll={false} aria-current={f.view === "cards" || undefined} aria-label="Card view" title="Cards"><IconLayoutGrid size={16} stroke={1.75} aria-hidden /></Link>
              </div>
            </div>
          </div>
          {chips.length ? (
            <div className="cb-chips" aria-label="Active filters">
              {chips.map((chip) => (
                <Link key={chip.label} href={chip.href} scroll={false} className="cb-chip" aria-label={`Remove ${chip.label}`}>
                  {chip.label}<IconX size={12} stroke={2.25} aria-hidden />
                </Link>
              ))}
              <Link href={links.clear()} scroll={false} className="cb-chip-clear">Clear all</Link>
            </div>
          ) : null}

          {!data.items.length ? (
            <div className="cb-empty">
              <span className="cb-empty-icon" aria-hidden="true"><IconSearch size={20} stroke={1.75} /></span>
              <h2>No organizations match</h2>
              <p>{f.scope === "current" ? `Try every organization since 2016, or remove a filter.` : "Remove a filter or try a broader search."}</p>
              <div>
                {f.scope === "current" ? <Link href={links.scope("archive")} className="cb-button cb-button-outline cb-button-sm">Search since 2016</Link> : null}
                <Link href={links.clear()} className="cb-button cb-button-ink cb-button-sm">Clear filters</Link>
              </div>
            </div>
          ) : f.view === "table" ? (
            <OrgTable orgs={data.items} maxCurrent={data.maxCurrent} caption="Organizations matching the filters" />
          ) : (
            <ul className="cb-cards">
              {data.items.map((org) => (
                <li key={org.slug}>
                  <article className="cb-org-card">
                    <div className="cb-org-card-head">
                      <Logo org={org} size="lg" />
                      <SaveButton slug={org.slug} name={org.name} />
                    </div>
                    <h2><Link href={profile(org.slug)} className="cb-row-link">{org.name}</Link></h2>
                    <p className="cb-org-card-meta">{org.category}{org.isNew ? <span className="cb-badge" data-tone="accent">New in {CURRENT_YEAR}</span> : null}</p>
                    <p className="cb-org-card-desc">{org.description.split(/\n\s*\n/)[0]}</p>
                    <dl className="cb-org-card-stats">
                      <div><dt>{CURRENT_YEAR}</dt><dd>{org.current || "–"}</dd></div>
                      <div><dt>Cycles</dt><dd>{org.cycles}</dd></div>
                      <div><dt>Projects</dt><dd>{fmt(org.totalProjects)}</dd></div>
                      <div className="cb-org-card-spark"><dt className="cb-sr-only">Trend</dt><dd><Sparkline values={org.slots} years={YEARS} name={org.name} width={104} height={30} /></dd></div>
                    </dl>
                    <Stack org={org} limit={4} />
                  </article>
                </li>
              ))}
            </ul>
          )}

          {data.pages > 1 ? (
            <nav className="cb-pagination" aria-label="Pages">
              {f.page > 1 ? <Link href={links.page(f.page - 1)} className="cb-button cb-button-outline cb-button-sm"><IconArrowLeft size={14} stroke={2} aria-hidden />Previous</Link> : <span className="cb-button cb-button-outline cb-button-sm" aria-disabled="true"><IconArrowLeft size={14} stroke={2} aria-hidden />Previous</span>}
              <ol>
                {pageWindow(f.page, data.pages).map((value, index) => (
                  <li key={value ?? `gap-${index}`}>
                    {value === null ? <span className="cb-page-gap">…</span> : <Link href={links.page(value)} aria-current={value === f.page ? "page" : undefined}>{value}</Link>}
                  </li>
                ))}
              </ol>
              {f.page < data.pages ? <Link href={links.page(f.page + 1)} className="cb-button cb-button-outline cb-button-sm">Next<IconArrowRight size={14} stroke={2} aria-hidden /></Link> : <span className="cb-button cb-button-outline cb-button-sm" aria-disabled="true">Next<IconArrowRight size={14} stroke={2} aria-hidden /></span>}
            </nav>
          ) : null}
          <p className="cb-results-note">Contributor counts are accepted projects per cycle. Participation history is not a prediction of selection.</p>
        </div>
      </div>
      <AToZ />
    </main>
  );
}

/** Every organization as a plain server-rendered link, grouped by first letter. */
function AToZ() {
  return <AZList id="cb-az" eyebrow="A TO Z" title="Every organization since 2016" items={cobaltOrganizations().map((org) => ({ label: org.name, href: `/organizations/${org.slug}` }))} />;
}
