"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  /** Stable value submitted with the form. */
  value: string;
  /** Text shown in the trigger and the list. */
  label: string;
  /** Secondary line — contributor names, org counts, aliases folded into this option. */
  hint?: string;
  /** Extra text matched by the search box but never displayed (aliases, slugs). */
  keywords?: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** How many options render before the "Show all" affordance. */
  visibleCount?: number;
  emptyText?: string;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Rendered under the trigger — e.g. "10,951 archived projects". */
  description?: string;
  className?: string;
  name?: string;
};

/** Rank: exact, then prefix, then word-boundary, then substring. Keeps "vue" above "revuejs". */
function rank(option: ComboboxOption, query: string): number {
  const haystack = `${option.label} ${option.hint ?? ""} ${option.keywords ?? ""}`.toLowerCase();
  const label = option.label.toLowerCase();
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) return 2;
  if (label.includes(query)) return 3;
  return haystack.includes(query) ? 4 : -1;
}

/**
 * Searchable single-select. Users pick from real data instead of typing a value
 * that has to match exactly — a misspelled organization or technology can no
 * longer produce an empty result set.
 */
export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  visibleCount = 20,
  emptyText = "No matches",
  clearable = true,
  disabled = false,
  loading = false,
  description,
  className,
  name,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options
      .map((option) => ({ option, score: rank(option, trimmed) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label))
      .map((entry) => entry.option);
  }, [options, query]);

  // Searching always looks at the whole list; the cap only limits what renders.
  const capped = showAll || query.trim() ? matches : matches.slice(0, visibleCount);
  const hiddenCount = matches.length - capped.length;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setShowAll(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => setActiveIndex(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function pick(option: ComboboxOption) {
    onChange(option.value);
    close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!capped.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + delta + capped.length) % capped.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = capped[activeIndex];
      if (option) pick(option);
    }
  }

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <span className="mb-1.5 block text-sm font-medium" id={`${listId}-label`}>
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${listId}-label`}
          aria-haspopup="listbox"
          disabled={disabled || loading}
          onClick={() => (open ? close() : setOpen(true))}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left text-sm transition-colors",
            clearable && selected ? "pr-16" : "",
            "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled || loading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          <span className={cn("truncate", selected ? "" : "text-muted-foreground")}>
            {loading ? "Loading…" : (selected?.label ?? placeholder)}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
        {clearable && selected && !disabled ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange("")}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}

      {open ? (
        <div className="absolute z-50 mt-1 w-full min-w-56 overflow-hidden rounded-xl border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-labelledby={`${listId}-label`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={capped.length ? optionId(activeIndex) : undefined}
              aria-autocomplete="list"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul id={listId} role="listbox" aria-labelledby={`${listId}-label`} ref={listRef} className="max-h-72 overflow-auto p-1">
            {capped.map((option, index) => (
              <li key={option.value} id={optionId(index)} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => pick(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                    index === activeIndex ? "bg-accent" : "",
                    option.value === value ? "font-medium text-primary" : "",
                  )}
                >
                  <Check className={cn("mt-0.5 size-4 shrink-0", option.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.hint}</span> : null}
                  </span>
                </button>
              </li>
            ))}
            {!capped.length ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</li> : null}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full border-t px-3 py-2.5 text-center text-xs font-medium text-primary hover:bg-accent"
            >
              Show all {matches.length.toLocaleString("en-IN")} — or type to search
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
