"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconBuilding, IconCheck, IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";
import { initials } from "../labels";

export interface ExplorerProject {
  /** Project id (routes to /organizations/{o}/projects/{i}). */
  i: string;
  t: string;
  c: string;
  m: string[];
  /** Organization slug. */
  o: string;
  /** Short abstract, when the archive has one. */
  d?: string;
}
export interface ExplorerOrg { name: string; logo: string | null; logoDark?: boolean; count: number }

const STEP = 30;
const norm = (value: string) => value.toLocaleLowerCase("en");

function OrgMark({ org }: { org: ExplorerOrg }) {
  return (
    <span className="cb-logo cb-logo-xs" data-dark={org.logoDark || undefined} aria-hidden="true">
      {org.logo ? <Image src={org.logo} alt="" width={20} height={20} /> : <span className="cb-monogram">{initials(org.name)}</span>}
    </span>
  );
}

/** Search and organization filter over one year's projects. The first page is server-rendered. */
export function ProjectExplorer({ year, projects, orgs }: { year: number; projects: ExplorerProject[]; orgs: Record<string, ExplorerOrg> }) {
  const [query, setQuery] = useState("");
  const [org, setOrg] = useState<string | null>(null);
  const [limit, setLimit] = useState(STEP);
  const [open, setOpen] = useState(false);
  const [orgQuery, setOrgQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!wrap.current?.contains(event.target as Node)) setOpen(false); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const options = useMemo(() => Object.entries(orgs).sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name, "en")), [orgs]);
  const visibleOptions = useMemo(() => {
    const q = norm(orgQuery.trim());
    return q ? options.filter(([, entry]) => norm(entry.name).includes(q)) : options;
  }, [options, orgQuery]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return projects.filter((project) => {
      if (org && project.o !== org) return false;
      if (!q) return true;
      return norm(project.t).includes(q) || norm(project.c).includes(q) || norm(orgs[project.o]?.name ?? "").includes(q) || project.m.some((mentor) => norm(mentor).includes(q));
    });
  }, [projects, orgs, query, org]);

  const shown = filtered.slice(0, limit);
  const selected = org ? orgs[org] : null;

  function pick(slug: string | null) {
    setOrg(slug);
    setLimit(STEP);
    setOpen(false);
    setOrgQuery("");
  }

  return (
    <div>
      <div className="cb-pj-tools">
        <label className="cb-finder-search">
          <IconSearch size={16} stroke={1.75} aria-hidden />
          <span className="cb-sr-only">Search {year} projects</span>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(STEP); }} placeholder="Search titles, contributors, mentors, organizations" autoComplete="off" spellCheck={false} />
        </label>
        <div className="cb-popover-wrap cb-pj-filter" ref={wrap}>
          <button type="button" className="cb-button cb-button-outline" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
            {selected ? <OrgMark org={selected} /> : <IconBuilding size={16} stroke={1.75} aria-hidden />}
            <span className="cb-truncate">{selected ? selected.name : "All organizations"}</span>
            <IconChevronDown size={14} stroke={2} aria-hidden />
          </button>
          {open ? (
            <div className="cb-popover cb-pj-pop" role="dialog" aria-label="Filter by organization">
              <label className="cb-facet-filter">
                <span className="cb-sr-only">Find an organization</span>
                <input type="search" value={orgQuery} onChange={(event) => setOrgQuery(event.target.value)} placeholder={`Find one of ${options.length} organizations`} autoComplete="off" spellCheck={false} autoFocus />
              </label>
              <div className="cb-pj-pop-list cb-scroll-autohide" role="group" aria-label="Organizations">
                {!orgQuery ? (
                  <button type="button" className="cb-check" aria-pressed={!org} onClick={() => pick(null)}>
                    <span className="cb-pj-pop-all" aria-hidden="true"><IconBuilding size={13} stroke={1.75} /></span>
                    <span className="cb-truncate">All organizations</span>
                    {!org ? <IconCheck size={14} stroke={2.25} aria-hidden /> : <span className="cb-check-count">{projects.length}</span>}
                  </button>
                ) : null}
                {visibleOptions.map(([slug, entry]) => (
                  <button key={slug} type="button" className="cb-check" aria-pressed={org === slug} onClick={() => pick(slug)}>
                    <OrgMark org={entry} />
                    <span className="cb-truncate">{entry.name}</span>
                    {org === slug ? <IconCheck size={14} stroke={2.25} aria-hidden /> : <span className="cb-check-count">{entry.count}</span>}
                  </button>
                ))}
                {!visibleOptions.length ? <p className="cb-facet-none">No organization matches “{orgQuery}”.</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="cb-pj-status" aria-live="polite">
        <span>{filtered.length === projects.length ? `${projects.length.toLocaleString("en-US")} projects` : `${filtered.length.toLocaleString("en-US")} of ${projects.length.toLocaleString("en-US")} projects`}</span>
        {selected ? <button type="button" className="cb-pj-clear" onClick={() => pick(null)}>{selected.name}<span className="cb-sr-only">(clear)</span><IconX size={13} stroke={2} aria-hidden /></button> : null}
        {query ? <button type="button" className="cb-pj-clear" onClick={() => setQuery("")}>“{query}”<span className="cb-sr-only">(clear)</span><IconX size={13} stroke={2} aria-hidden /></button> : null}
      </div>

      {shown.length ? (
        <ol className="cb-project-list">
          {shown.map((project) => {
            const owner = orgs[project.o];
            return (
              <li key={`${project.o}-${project.i}`} className="cb-project">
                <div className="cb-project-main">
                  {owner ? (
                    <p className="cb-pj-org-line">
                      <OrgMark org={owner} />
                      <Link href={`/organizations/${project.o}`} className="cb-truncate">{owner.name}</Link>
                    </p>
                  ) : null}
                  <h3><Link href={`/organizations/${project.o}/projects/${project.i}`} className="cb-project-title">{project.t}</Link></h3>
                  <p className="cb-project-people">
                    <span>{project.c || "Contributor not listed"}</span>
                    {project.m.length ? <span>Mentored by {project.m.slice(0, 3).join(", ")}{project.m.length > 3 ? ` +${project.m.length - 3}` : ""}</span> : null}
                  </p>
                  {project.d ? <p className="cb-project-desc">{project.d}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="cb-empty">
          <span className="cb-empty-icon" aria-hidden="true"><IconSearch size={20} stroke={1.75} /></span>
          <h2>No projects match</h2>
          <p>Try a shorter search or another organization.</p>
          <div><button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => { setQuery(""); pick(null); }}>Clear filters</button></div>
        </div>
      )}

      {filtered.length > limit ? (
        <div className="cb-finder-more cb-pj-more">
          <button type="button" className="cb-button cb-button-outline" onClick={() => setLimit(limit + STEP * 2)}>Show {Math.min(STEP * 2, filtered.length - limit)} more</button>
          {filtered.length - limit > STEP * 2 ? <button type="button" className="cb-button cb-button-outline" onClick={() => setLimit(filtered.length)}>Show all {filtered.length.toLocaleString("en-US")}</button> : null}
        </div>
      ) : null}
    </div>
  );
}
