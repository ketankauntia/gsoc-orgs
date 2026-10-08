"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";

export interface FinderItem { label: string; href: string; a: number; b: number }

/**
 * Searchable, sortable list of taxonomy pages (technologies, topics). Shows the first
 * `initial` items until expanded; the full set stays reachable through the A–Z list.
 */
export function Finder({ items, aLabel, bLabel, noun, initial = 60 }: { items: FinderItem[]; aLabel: string; bLabel: string; noun: string; initial?: number }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"a" | "b" | "name">("a");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("en");
    const list = q ? items.filter((item) => item.label.toLocaleLowerCase("en").includes(q)) : items;
    return [...list].sort((x, y) => (sort === "name" ? x.label.localeCompare(y.label, "en") : sort === "a" ? y.a - x.a || y.b - x.b : y.b - x.b || y.a - x.a));
  }, [items, query, sort]);
  const shown = expanded || query ? filtered : filtered.slice(0, initial);
  const sorts = [
    { id: "a" as const, label: `Most ${aLabel}` },
    { id: "b" as const, label: `Most ${bLabel}` },
    { id: "name" as const, label: "A–Z" },
  ];
  return (
    <div>
      <div className="cb-finder-bar">
        <label className="cb-finder-search">
          <IconSearch size={16} stroke={1.75} aria-hidden />
          <span className="cb-sr-only">Search {noun}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${items.length} ${noun}`} autoComplete="off" spellCheck={false} />
        </label>
        <div className="cb-segmented" role="group" aria-label="Sort">
          {sorts.map((option) => (
            <button key={option.id} type="button" aria-pressed={sort === option.id} data-on={sort === option.id || undefined} onClick={() => setSort(option.id)}>{option.label}</button>
          ))}
        </div>
      </div>
      {shown.length ? (
        <div className="cb-finder-grid">
          {shown.map((item) => (
            <Link key={item.href} href={item.href}>
              <span>{item.label}</span>
              <small>{item.a.toLocaleString("en-US")} {aLabel} · {item.b.toLocaleString("en-US")} {bLabel}</small>
            </Link>
          ))}
        </div>
      ) : (
        <p className="cb-card-note">No {noun} match “{query}”.</p>
      )}
      {!query && filtered.length > initial ? (
        <div className="cb-finder-more">
          <button type="button" className="cb-button cb-button-outline" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show fewer" : `Show all ${filtered.length.toLocaleString("en-US")} ${noun}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
