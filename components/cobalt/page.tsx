import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { SaveButton } from "./controls";
import { CURRENT_YEAR, YEARS, type CobaltOrg } from "./data";
import { techLabel } from "./labels";
import { Eyebrow, fmt, Logo, Sparkline } from "./ui";

// Building blocks shared by every Cobalt page beyond the home, directory and profile.

export interface Crumb { label: string; href?: string }

/** Breadcrumbs, eyebrow, title (pass a .cb-quiet or .cb-serif span for the second tone), lede, aside. */
export function PageHead({ crumbs, eyebrow, title, lede, aside, children }: {
  crumbs: Crumb[];
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="cb-dir-head cb-page-head">
      <div className="cb-page">
        <nav className="cb-crumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={crumb.label} className="cb-crumb">
              {index ? <span aria-hidden="true">/</span> : null}
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
            </span>
          ))}
        </nav>
        <div className="cb-dir-title">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1>{title}</h1>
            {lede ? <p className="cb-page-lede">{lede}</p> : null}
          </div>
          {aside ? <div className="cb-page-aside">{aside}</div> : null}
        </div>
        {children ? <div className="cb-page-head-extra">{children}</div> : null}
      </div>
    </section>
  );
}

export function SectionHead({ id, eyebrow, title, quiet, action }: { id?: string; eyebrow?: string; title: string; quiet?: string; action?: { label: string; href: string } }) {
  return (
    <div className="cb-related-head cb-section-head">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 id={id}>{title}{quiet ? <> <span className="cb-quiet">{quiet}</span></> : null}</h2>
      </div>
      {action ? <Link href={action.href} className="cb-text-link">{action.label} <IconArrowRight size={16} stroke={2} aria-hidden /></Link> : null}
    </div>
  );
}

function Stack({ org, limit = 2 }: { org: CobaltOrg; limit?: number }) {
  const shown = org.technologies.slice(0, limit);
  const more = org.technologies.length - shown.length;
  return (
    <span className="cb-tags">
      {shown.map((tech) => <span key={tech} className="cb-tag">{techLabel(tech)}</span>)}
      {more > 0 ? <span className="cb-tag cb-tag-more">+{more}</span> : null}
    </span>
  );
}

/** Organizations as the directory table: logo, stack, current contributors, eleven-cycle trend, cycles, projects, save. */
export function OrgTable({ orgs, maxCurrent, caption }: { orgs: CobaltOrg[]; maxCurrent?: number; caption?: string }) {
  const max = maxCurrent ?? Math.max(1, ...orgs.map((org) => org.current));
  return (
    <div className="cb-table-card">
      <table className="cb-table">
        {caption ? <caption className="cb-sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">Organization</th>
            <th scope="col" className="cb-col-stack">Stack</th>
            <th scope="col" className="cb-num">{CURRENT_YEAR}</th>
            <th scope="col" className="cb-col-trend">{YEARS[0]}–{String(CURRENT_YEAR).slice(2)}</th>
            <th scope="col" className="cb-num cb-col-cycles">Cycles</th>
            <th scope="col" className="cb-num cb-col-total">Projects</th>
            <th scope="col"><span className="cb-sr-only">Save</span></th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((org) => (
            <tr key={org.slug}>
              <td>
                <div className="cb-org-cell">
                  <Logo org={org} size="md" />
                  <div>
                    <Link href={`/organizations/${org.slug}`} className="cb-row-link">{org.name}</Link>
                    <span className="cb-org-meta">
                      <span className="cb-truncate">{org.category}</span>
                      {org.isNew ? <span className="cb-badge" data-tone="accent">New</span> : !org.inCurrent ? <span className="cb-badge">Last in {org.lastYear}</span> : null}
                    </span>
                  </div>
                </div>
              </td>
              <td className="cb-col-stack"><Stack org={org} /></td>
              <td className="cb-num">
                <span className="cb-cap">
                  <strong>{org.current || "–"}</strong>
                  <span className="cb-cap-bar" aria-hidden="true"><i style={{ width: `${(org.current / max) * 100}%` }} /></span>
                </span>
              </td>
              <td className="cb-col-trend"><Sparkline values={org.slots} years={YEARS} name={org.name} /></td>
              <td className="cb-num cb-col-cycles">{org.cycles}<small>/{YEARS.length}</small></td>
              <td className="cb-num cb-col-total">{fmt(org.totalProjects)}</td>
              <td className="cb-col-save"><SaveButton slug={org.slug} name={org.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Plain server-rendered links grouped by first letter, so crawlers reach every page. */
export function AZList({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: Array<{ label: string; href: string }> }) {
  const groups = new Map<string, Array<{ label: string; href: string }>>();
  for (const item of [...items].sort((a, b) => a.label.localeCompare(b.label, "en"))) {
    const letter = /^[a-z]/i.test(item.label) ? item.label[0].toUpperCase() : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), item]);
  }
  return (
    <section className="cb-band cb-az" aria-labelledby={id}>
      <div className="cb-page cb-az-inner">
        <div className="cb-az-head">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={id}>{title}</h2>
          <nav className="cb-az-letters" aria-label="Jump to letter">
            {[...groups.keys()].map((letter) => <a key={letter} href={`#${id}-${letter}`}>{letter}</a>)}
          </nav>
        </div>
        <div className="cb-az-groups">
          {[...groups.entries()].map(([letter, list]) => (
            <div key={letter} id={`${id}-${letter}`} className="cb-az-group">
              <p>{letter}</p>
              <ul>{list.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
