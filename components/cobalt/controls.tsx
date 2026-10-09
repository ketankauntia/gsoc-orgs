"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { IconAdjustmentsHorizontal, IconCheck, IconChevronDown, IconLink, IconSearch, IconStar, IconStarFilled, IconX } from "@tabler/icons-react";
import { initials } from "./labels";
import { useShortlist } from "./shortlist";
import { useShell } from "./shell";

/* ------------------------------------------------------------------ */
/* Tabs for the landing stage. Panels are server-rendered children.   */

export function StageTabs({ tabs, children }: { tabs: Array<{ id: string; label: string; icon: React.ReactNode }>; children: React.ReactNode[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    setSelected(next);
    refs.current[next]?.focus();
  }
  return (
    <div className="cb-stage-tabs">
      <div className="cb-stage-topline">
        <div className="cb-segmented cb-segmented-lg" role="tablist" aria-label="Explore the data">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(node) => { refs.current[index] = node; }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.id}`}
              aria-selected={selected === index}
              aria-controls={`${id}-panel-${tab.id}`}
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cb-stage">
        {tabs.map((tab, index) => (
          <div key={tab.id} role="tabpanel" id={`${id}-panel-${tab.id}`} aria-labelledby={`${id}-tab-${tab.id}`} hidden={selected !== index} className="cb-stage-panel">
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Popover helper: closes on outside pointer, Escape and navigation.  */

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) { setLastPath(pathname); setOpen(false); }
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!ref.current?.contains(event.target as Node)) setOpen(false); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

/* ------------------------------------------------------------------ */
/* Shortlist                                                           */

export function SaveButton({ slug, name, variant = "icon" }: { slug: string; name: string; variant?: "icon" | "button" }) {
  const { has, toggle } = useShortlist();
  const saved = has(slug);
  const label = `${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} your shortlist`;
  return (
    <button
      type="button"
      className={variant === "icon" ? "cb-save" : "cb-button cb-button-outline cb-save-button"}
      aria-pressed={saved}
      aria-label={label}
      title={variant === "icon" ? label : undefined}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle({ slug, name }); }}
    >
      {saved ? <IconStarFilled size={variant === "icon" ? 16 : 15} aria-hidden /> : <IconStar size={variant === "icon" ? 16 : 15} stroke={1.75} aria-hidden />}
      {variant === "button" ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}

export function ShortlistMenu() {
  const { items, remove, clear } = useShortlist();
  const { open, setOpen, ref } = usePopover();
  const { index } = useShell();
  const logos = new Map(index.orgs.map((org) => [org.s, org]));
  return (
    <div className="cb-popover-wrap" ref={ref}>
      <button type="button" className="cb-icon-button cb-shortlist-trigger" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Shortlist, ${items.length} saved`} title="Shortlist">
        <IconStar size={17} stroke={1.75} aria-hidden />
        {items.length ? <span className="cb-count">{items.length}</span> : null}
      </button>
      {open ? (
        <div className="cb-popover cb-shortlist" role="dialog" aria-label="Your shortlist">
          <div className="cb-popover-head">
            <p>Your shortlist</p>
            <span>{items.length ? `${items.length} saved in this browser` : "Saved in this browser"}</span>
          </div>
          {items.length ? (
            <>
              <ul>
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/organizations/${item.slug}`} onClick={() => setOpen(false)}>
                      <span className="cb-logo cb-logo-sm" data-dark={logos.get(item.slug)?.d || undefined} aria-hidden="true">{logos.get(item.slug)?.l ? <Image src={`/logos/${item.slug}.webp`} alt="" width={28} height={28} /> : <span className="cb-monogram">{initials(item.name)}</span>}</span>
                      <span className="cb-truncate">{item.name}</span>
                    </Link>
                    <button type="button" className="cb-icon-button cb-icon-button-sm" aria-label={`Remove ${item.name}`} onClick={() => remove(item.slug)}><IconX size={14} stroke={2} aria-hidden /></button>
                  </li>
                ))}
              </ul>
              <button type="button" className="cb-popover-foot" onClick={clear}>Clear shortlist</button>
            </>
          ) : (
            <p className="cb-popover-empty">Star an organization to keep it here while you compare. Nothing leaves your browser.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Directory controls                                                  */

export function SortMenu({ label, short, options }: { label: string; short: string; options: Array<{ label: string; href: string; active: boolean }> }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="cb-popover-wrap" ref={ref}>
      <button type="button" className="cb-button cb-button-outline cb-button-sm" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="cb-muted-label">Sort</span> <span className="cb-sort-long">{label}</span><span className="cb-sort-short">{short}</span>
        <IconChevronDown size={14} stroke={2} aria-hidden />
      </button>
      {open ? (
        <div className="cb-popover cb-menu" role="menu" aria-label="Sort organizations">
          {options.map((option) => (
            <Link key={option.href + option.label} role="menuitemradio" aria-checked={option.active} href={option.href} scroll={false} onClick={() => setOpen(false)}>
              <span>{option.label}</span>
              {option.active ? <IconCheck size={16} stroke={2.25} aria-hidden /> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const FILTERS_EVENT = "cb-open-filters";

/** Opens the filter sheet on small screens (hidden on desktop, where the rail is always visible). */
export function FilterButton({ count }: { count: number }) {
  return (
    <button type="button" className="cb-button cb-button-outline cb-button-sm cb-filter-open" onClick={() => window.dispatchEvent(new Event(FILTERS_EVENT))}>
      <IconAdjustmentsHorizontal size={16} stroke={1.75} aria-hidden />
      Filters{count ? <span className="cb-count cb-count-inline">{count}</span> : null}
    </button>
  );
}

/** Filter rail on desktop; a bottom sheet opened by FilterButton on small screens. */
export function FilterRail({ total, children }: { total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(FILTERS_EVENT, show);
    return () => window.removeEventListener(FILTERS_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <>
      <div className="cb-rail-scrim" data-open={open || undefined} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="cb-rail" data-open={open || undefined} aria-label="Filters">
        <div className="cb-rail-sheet-head">
          <p>Filters</p>
          <button type="button" className="cb-icon-button" onClick={() => setOpen(false)} aria-label="Close filters"><IconX size={18} stroke={1.75} aria-hidden /></button>
        </div>
        <div className="cb-rail-body cb-scroll-autohide">{children}</div>
        <div className="cb-rail-sheet-foot">
          <button type="button" className="cb-button cb-button-ink" onClick={() => setOpen(false)}>Show {total} {total === 1 ? "organization" : "organizations"}</button>
        </div>
      </aside>
    </>
  );
}

/** Long facet lists: the top few, a filter box, and "show all". */
export function FacetList({ name, options, initial = 8 }: { name: string; options: Array<{ label: string; count: number; href: string; active: boolean }>; initial?: number }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const q = query.trim().toLocaleLowerCase("en");
  const matching = q ? options.filter((option) => option.label.toLocaleLowerCase("en").includes(q)) : options;
  const pinned = matching.filter((option) => option.active);
  const rest = matching.filter((option) => !option.active);
  const visible = expanded || q ? [...pinned, ...rest].slice(0, 60) : [...pinned, ...rest.slice(0, Math.max(0, initial - pinned.length))];
  return (
    <div className="cb-facet-list">
      {options.length > initial ? (
        <label className="cb-facet-filter">
          <span className="cb-sr-only">Filter {name}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${options.length} ${name}`} autoComplete="off" spellCheck={false} />
        </label>
      ) : null}
      <ul>
        {visible.map((option) => (
          <li key={option.label}>
            <Link href={option.href} scroll={false} className="cb-check" aria-current={option.active || undefined}>
              <span className="cb-check-box" aria-hidden="true">{option.active ? <IconCheck size={12} stroke={3} /> : null}</span>
              <span className="cb-truncate">{option.label}</span>
              <span className="cb-check-count">{option.count}</span>
            </Link>
          </li>
        ))}
        {!visible.length ? <li className="cb-facet-none">No {name} match “{query}”.</li> : null}
      </ul>
      {!q && options.length > initial ? (
        <button type="button" className="cb-facet-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${options.length}`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Directory search: updates ?q= as you type (debounced) and follows the URL when a chip or
 * "Clear all" changes it from outside. "/" focuses it. Plain GET form without JavaScript.
 */
export function DirectorySearch({ action, query, value: urlValue, placeholder }: { action: string; query: string; value: string; placeholder: string }) {
  const router = useRouter();
  const [value, setValue] = useState(urlValue);
  const [sent, setSent] = useState(urlValue);
  const [seen, setSeen] = useState(urlValue);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (urlValue !== seen) {
    setSeen(urlValue);
    if (urlValue !== sent) { setValue(urlValue); setSent(urlValue); }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function go(next: string) {
    const params = new URLSearchParams(query);
    params.delete("page");
    const q = next.trim();
    if (q) params.set("q", q);
    else params.delete("q");
    setSent(q);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${action}?${qs}` : action, { scroll: false }));
  }

  return (
    <form role="search" action={action} className="cb-dir-search" data-pending={pending || undefined} onSubmit={(event) => { event.preventDefault(); if (timer.current) clearTimeout(timer.current); go(value); }}>
      <IconSearch className="cb-dir-search-icon" size={18} stroke={1.75} aria-hidden />
      <input
        ref={inputRef}
        className="cb-dir-search-input"
        name="q"
        type="search"
        aria-label="Search organizations"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => go(next), 220);
        }}
      />
      {value ? (
        <button type="button" className="cb-icon-button cb-icon-button-sm cb-dir-search-clear" aria-label="Clear search" onClick={() => { setValue(""); if (timer.current) clearTimeout(timer.current); go(""); inputRef.current?.focus(); }}>
          <IconX size={14} stroke={2} aria-hidden />
        </button>
      ) : <kbd className="cb-dir-search-kbd" aria-hidden="true">/</kbd>}
    </form>
  );
}

export function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="cb-icon-button cb-icon-button-bordered"
      aria-label={copied ? "Link copied" : "Copy link to this page"}
      title={copied ? "Copied" : "Copy link"}
      onClick={async () => {
        try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
      }}
    >
      {copied ? <IconCheck size={16} stroke={2} aria-hidden /> : <IconLink size={16} stroke={1.75} aria-hidden />}
    </button>
  );
}

/**
 * Project year tabs. Every panel is server-rendered (hidden ones stay in the HTML for
 * crawlers); the selected year follows ?year= and is written back with replaceState.
 */
export function ProjectYears({ title, summary, years, children }: { title: string; summary?: React.ReactNode; years: Array<{ year: number; count: number }>; children: React.ReactNode[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  useEffect(() => {
    const wanted = Number(new URLSearchParams(window.location.search).get("year"));
    const index = years.findIndex((entry) => entry.year === wanted);
    if (index > 0) setSelected(index);
  }, [years]);
  function choose(index: number) {
    setSelected(index);
    const url = new URL(window.location.href);
    if (index === 0) url.searchParams.delete("year");
    else url.searchParams.set("year", String(years[index].year));
    window.history.replaceState(null, "", url.toString());
  }
  const current = years[selected];
  return (
    <>
      <div className="cb-projects-head">
        <div>
          <h2 id="cb-projects-title">{title}</h2>
          <p>{current ? `${current.count} ${current.count === 1 ? "project" : "projects"} in ${current.year}` : "No projects in the archive yet"}{summary ? <> · {summary}</> : null}</p>
        </div>
        {years.length ? (
          <div className="cb-year-tabs cb-scroll-autohide" role="tablist" aria-label="Project year">
            {years.map((entry, index) => (
              <button key={entry.year} type="button" role="tab" id={`${id}-tab-${entry.year}`} aria-selected={index === selected} aria-controls={`${id}-panel-${entry.year}`} tabIndex={index === selected ? 0 : -1} onClick={() => choose(index)}
                onKeyDown={(event) => {
                  const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                  if (!delta) return;
                  event.preventDefault();
                  const next = (index + delta + years.length) % years.length;
                  choose(next);
                  document.getElementById(`${id}-tab-${years[next].year}`)?.focus();
                }}>
                {entry.year}<span>{entry.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {years.map((entry, index) => (
        <div key={entry.year} role="tabpanel" id={`${id}-panel-${entry.year}`} aria-labelledby={`${id}-tab-${entry.year}`} hidden={index !== selected}>
          {children[index]}
        </div>
      ))}
    </>
  );
}
