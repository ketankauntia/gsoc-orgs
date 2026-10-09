"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { IconArrowRight, IconCornerDownLeft, IconFileText, IconMoon, IconSearch, IconSun } from "@tabler/icons-react";
import type { SearchIndex } from "./data";
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Search index: fetched on first use, then kept for the session       */

interface IndexState { status: "idle" | "loading" | "ready" | "error"; index: SearchIndex | null }
const IDLE: IndexState = { status: "idle", index: null };
let indexState = IDLE;
const indexListeners = new Set<() => void>();

function setIndexState(next: IndexState) {
  indexState = next;
  for (const listener of indexListeners) listener();
}

function subscribeIndex(listener: () => void) {
  indexListeners.add(listener);
  return () => { indexListeners.delete(listener); };
}

/** Starts loading the search index once (again after a failure). Cheap to call on hover and focus. */
export function preloadSearchIndex() {
  if (indexState.status === "loading" || indexState.status === "ready") return;
  setIndexState({ status: "loading", index: null });
  fetch("/organizations/search-index.json")
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`Search index: ${response.status}`))))
    .then((index: SearchIndex) => setIndexState({ status: "ready", index }), () => setIndexState({ status: "error", index: null }));
}

/** The search index; `load` starts fetching it. */
export function useSearchIndex(load: boolean) {
  const state = useSyncExternalStore(subscribeIndex, () => indexState, () => IDLE);
  useEffect(() => { if (load) preloadSearchIndex(); }, [load]);
  return state;
}

/* ------------------------------------------------------------------ */
/* Shell: ⌘K dialog, theme and the page's one tooltip                  */

interface ShellValue { openSearch: () => void }
const ShellContext = createContext<ShellValue | null>(null);

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("Cobalt components must render inside CobaltShell.");
  return value;
}

/**
 * Wraps every Cobalt page. Owns the ⌘K dialog and shows one tooltip for every element with
 * `data-tip` (title) and `data-tip-rows` ("key|label|value" per line; key a = accent,
 * m = muted, - = none). Instead of rows, an element can carry `data-tip-values`
 * ("v0|v1|…") that fill the `{0}`, `{1}`… of the closest `data-tip-template`.
 */
export function CobaltShell({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openSearch = useCallback(() => {
    dialogRef.current?.showModal();
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else openSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  // Tooltip delegation.
  useEffect(() => {
    const root = rootRef.current;
    const tip = tipRef.current;
    if (!root || !tip) return;
    let current: HTMLElement | null = null;

    function render(target: HTMLElement) {
      if (!tip) return;
      tip.replaceChildren();
      const title = document.createElement("p");
      title.className = "cb-tip-title";
      title.textContent = target.dataset.tip ?? "";
      tip.append(title);
      const values = target.dataset.tipValues?.split("|");
      const rows = values ? (target.closest<HTMLElement>("[data-tip-template]")?.dataset.tipTemplate ?? "").replace(/\{(\d+)\}/g, (_, i: string) => values[Number(i)] ?? "") : target.dataset.tipRows;
      for (const line of (rows ?? "").split("\n").filter(Boolean)) {
        const [key, label, value] = line.split("|");
        const row = document.createElement("p");
        row.className = "cb-tip-row";
        if (key && key !== "-") {
          const swatch = document.createElement("i");
          swatch.dataset.key = key;
          row.append(swatch);
        }
        const strong = document.createElement("strong");
        strong.textContent = value ?? "";
        const span = document.createElement("span");
        span.textContent = label ?? "";
        row.append(strong, span);
        tip.append(row);
      }
      tip.dataset.show = "";
    }

    function place(x: number, y: number) {
      if (!tip) return;
      const width = tip.offsetWidth;
      const height = tip.offsetHeight;
      const left = Math.min(Math.max(8, x + 14), window.innerWidth - width - 8);
      const top = y + 18 + height > window.innerHeight ? y - height - 12 : y + 18;
      tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(Math.max(8, top))}px)`;
    }

    function hide() {
      current = null;
      if (tip) delete tip.dataset.show;
    }

    function onOver(event: PointerEvent) {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-tip]");
      if (!target || !root?.contains(target)) return hide();
      if (target !== current) { current = target; render(target); }
      place(event.clientX, event.clientY);
    }
    function onFocus(event: FocusEvent) {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-tip]");
      if (!target) return;
      current = target;
      render(target);
      const rect = target.getBoundingClientRect();
      place(rect.left + rect.width / 2 - 20, rect.bottom - 6);
    }
    root.addEventListener("pointermove", onOver);
    root.addEventListener("pointerleave", hide);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", hide);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      root.removeEventListener("pointermove", onOver);
      root.removeEventListener("pointerleave", hide);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", hide);
    };
  }, []);

  const value = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <ShellContext.Provider value={value}>
      <div ref={rootRef} className="cb-shell">
        {children}
      </div>
      <div ref={tipRef} className="cb-tip" role="tooltip" aria-hidden="true" />
      <dialog ref={dialogRef} className="cb-dialog" aria-label="Search" onClose={() => setDialogOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
        {dialogOpen ? <SearchPanel variant="dialog" onDone={() => dialogRef.current?.close()} /> : null}
      </dialog>
    </ShellContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Theme (next-themes; class "dark" on <html>)                         */

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button type="button" className="cb-icon-button" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
      {dark ? <IconSun size={17} stroke={1.75} aria-hidden /> : <IconMoon size={17} stroke={1.75} aria-hidden />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */

export function SearchButton({ label = "Search" }: { label?: string }) {
  const { openSearch } = useShell();
  return (
    <button type="button" className="cb-search-button" onClick={openSearch} onPointerEnter={preloadSearchIndex} onFocus={preloadSearchIndex} aria-label="Search organizations (Ctrl K)">
      <IconSearch size={16} stroke={1.75} aria-hidden />
      <span>{label}</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

interface Option { id: string; href: string; kind: "org" | "tech" | "topic" | "post" | "query"; label: string; meta: string; slug?: string; logo?: string | null; dark?: boolean }

function useResults(index: SearchIndex | null, query: string): { groups: Array<{ title: string; options: Option[] }>; flat: Option[] } {
  return useMemo(() => {
    const q = query.trim().toLocaleLowerCase("en");
    const directory = `/organizations`;
    const all: Option = { id: "query", href: `${directory}?q=${encodeURIComponent(query.trim())}`, kind: "query", label: `Search every organization for “${query.trim()}”`, meta: "All 522 since 2016" };
    if (!index) return q ? { groups: [{ title: "", options: [all] }], flat: [all] } : { groups: [], flat: [] };
    const orgOption = (org: SearchIndex["orgs"][number]): Option => ({
      id: `org-${org.s}`,
      href: `/organizations/${org.s}`,
      kind: "org",
      label: org.n,
      meta: org.a ? `${org.k} contributor${org.k === 1 ? "" : "s"} in 2026` : `${org.y} cycle${org.y === 1 ? "" : "s"} · not in 2026`,
      slug: org.s,
      logo: org.l,
      dark: org.d,
    });
    const facetOption = (kind: "tech" | "topic", facet: SearchIndex["tech"][number]): Option => ({
      id: `${kind}-${facet.v}`,
      href: facet.h,
      kind,
      label: facet.l,
      meta: `${facet.n} organizations in 2026`,
    });
    if (!q) {
      const popular = [...index.orgs].filter((org) => org.a).sort((a, b) => b.k - a.k).slice(0, 5).map(orgOption);
      const tech = index.tech.slice(0, 5).map((facet) => facetOption("tech", facet));
      const groups = [
        { title: "Most contributors in 2026", options: popular },
        { title: "Technologies", options: tech },
      ];
      return { groups, flat: groups.flatMap((group) => group.options) };
    }
    const score = (name: string) => {
      const lower = name.toLocaleLowerCase("en");
      if (lower.startsWith(q)) return 0;
      if (lower.split(/[\s(-]+/).some((word) => word.startsWith(q))) return 1;
      return lower.includes(q) ? 2 : 9;
    };
    const orgs = index.orgs
      .map((org) => ({ org, score: score(org.n) }))
      .filter((entry) => entry.score < 9)
      .sort((a, b) => a.score - b.score || Number(b.org.a) - Number(a.org.a) || b.org.k - a.org.k)
      .slice(0, 6)
      .map((entry) => orgOption(entry.org));
    const tech = index.tech.filter((facet) => facet.l.toLocaleLowerCase("en").includes(q)).slice(0, 4).map((facet) => facetOption("tech", facet));
    const topic = index.topic.filter((facet) => facet.l.toLocaleLowerCase("en").includes(q)).slice(0, 3).map((facet) => facetOption("topic", facet));
    const posts: Option[] = index.posts
      .filter((post) => post.t.toLocaleLowerCase("en").includes(q))
      .slice(0, 3)
      .map((post) => ({ id: `post-${post.s}`, href: `/blog/post/${post.s}`, kind: "post", label: post.t, meta: `Article · ${post.c}` }));
    const groups = [
      { title: "Organizations", options: orgs },
      { title: "Technologies", options: tech },
      { title: "Topics", options: topic },
      { title: "Articles", options: posts },
      { title: "", options: [all] },
    ].filter((group) => group.options.length);
    return { groups, flat: groups.flatMap((group) => group.options) };
  }, [index, query]);
}

/**
 * Typeahead over organizations, technologies and topics. `hero` drops a panel under the
 * input while focused; `dialog` lists results below the input inside the ⌘K dialog.
 */
export function SearchPanel({ variant, onDone, placeholder }: { variant: "hero" | "dialog"; onDone?: () => void; placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(variant === "dialog");
  const [active, setActive] = useState(0);
  const showList = variant === "dialog" || open;
  const { status, index } = useSearchIndex(showList);
  const { groups, flat } = useResults(index, query);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeIndex = Math.min(active, flat.length - 1);

  useEffect(() => {
    if (variant === "dialog") inputRef.current?.focus();
  }, [variant]);

  function go(option?: Option) {
    const target = option?.href ?? `/organizations${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`;
    setOpen(false);
    onDone?.();
    router.push(target);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((value) => Math.min(value + 1, flat.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter") { event.preventDefault(); go(showList ? flat[activeIndex] : undefined); }
    else if (event.key === "Escape" && variant === "hero") { setOpen(false); }
  }

  return (
    <div className={`cb-search cb-search-${variant}`} data-open={showList || undefined}>
      <form
        className="cb-search-field"
        role="search"
        action={`/organizations`}
        onSubmit={(event) => { event.preventDefault(); go(); }}
        onPointerEnter={preloadSearchIndex}
      >
        <IconSearch className="cb-search-icon" size={variant === "hero" ? 20 : 18} stroke={1.75} aria-hidden />
        <input
          ref={inputRef}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && flat[activeIndex] ? `${listId}-${flat[activeIndex].id}` : undefined}
          aria-label="Search organizations, technologies and topics"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? "Organization, language or topic"}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { if (variant === "hero") window.setTimeout(() => setOpen(false), 120); }}
          onKeyDown={onKeyDown}
        />
        {variant === "hero" ? (
          <button type="submit" className="cb-button cb-button-ink cb-search-submit">
            Search <IconArrowRight size={16} stroke={2} aria-hidden />
          </button>
        ) : (
          <kbd className="cb-search-esc">Esc</kbd>
        )}
      </form>
      {showList ? (
        <div className="cb-search-results">
          {!index ? <p className="cb-search-status" role="status">{status === "error" ? "Suggestions are unavailable. Press Enter to search the directory." : "Loading suggestions…"}</p> : null}
          <div id={listId} role="listbox" aria-label="Suggestions">
            {groups.map((group) => (
              <div key={group.title || "all"} role="group" aria-label={group.title || "Search everything"} className="cb-search-group">
                {group.title ? <p className="cb-search-group-title" aria-hidden="true">{group.title}</p> : null}
                {group.options.map((option) => {
                  const position = flat.indexOf(option);
                  return (
                    <div
                      key={option.id}
                      id={`${listId}-${option.id}`}
                      role="option"
                      aria-selected={position === activeIndex}
                      className="cb-search-option"
                      data-kind={option.kind}
                      onPointerMove={() => setActive(position)}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => go(option)}
                    >
                      {option.kind === "org" ? (
                        <span className="cb-logo cb-logo-sm" data-dark={option.dark || undefined} aria-hidden="true">
                          {option.logo ? <Image src={option.logo} alt="" width={28} height={28} /> : option.label.slice(0, 2)}
                        </span>
                      ) : (
                        <span className="cb-search-glyph" aria-hidden="true">{option.kind === "tech" ? "</>" : option.kind === "topic" ? "#" : option.kind === "post" ? <IconFileText size={14} stroke={2} /> : <IconSearch size={14} stroke={2} />}</span>
                      )}
                      <span className="cb-search-copy">
                        <strong>{option.label}</strong>
                        <small>{option.meta}</small>
                      </span>
                      <IconCornerDownLeft className="cb-search-enter" size={14} stroke={2} aria-hidden />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
