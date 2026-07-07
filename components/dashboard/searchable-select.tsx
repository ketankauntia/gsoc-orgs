"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { Input } from "@/components/blog-ui/input";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; hint?: string };

/**
 * Searchable dropdown that reveals options in pages of `pageSize` (default 20),
 * loading more as you scroll. Search is debounced. Empty value === "All".
 */
export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  pageSize = 20,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  pageSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 200);
  const [visible, setVisible] = useState(pageSize);
  const ref = useRef<HTMLDivElement>(null);

  // Reset the visible window when the query changes or the panel opens.
  useEffect(() => setVisible(pageSize), [debounced, pageSize, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    return s ? options.filter((o) => o.label.toLowerCase().includes(s)) : options;
  }, [options, debounced]);

  const shown = filtered.slice(0, visible);
  const current = options.find((o) => o.value === value);
  const allLabel = `All ${label.toLowerCase()}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm"
      >
        <span className={cn("truncate", !current && "text-muted-foreground")}>
          {current ? current.label : allLabel}
        </span>
        <IconChevronDown className="size-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          <div className="p-1.5">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-8"
            />
          </div>
          <ul
            className="max-h-64 overflow-y-auto p-1"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                setVisible((v) => Math.min(v + pageSize, filtered.length));
              }
            }}
          >
            <li>
              <Row selected={value === ""} onClick={() => { onChange(""); setOpen(false); }}>
                {allLabel}
              </Row>
            </li>
            {shown.map((o) => (
              <li key={o.value}>
                <Row selected={value === o.value} onClick={() => { onChange(o.value); setOpen(false); }}>
                  <span className="truncate">
                    {o.label}
                    {o.hint && <span className="ml-1 text-xs text-muted-foreground">{o.hint}</span>}
                  </span>
                </Row>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-4 text-center text-xs text-muted-foreground">No matches</li>
            )}
            {shown.length < filtered.length && (
              <li className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                Scroll for {filtered.length - shown.length} more…
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
    >
      {children}
      {selected && <IconCheck className="size-4 shrink-0 text-primary" />}
    </button>
  );
}
