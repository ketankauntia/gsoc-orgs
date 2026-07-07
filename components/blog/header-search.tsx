"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { useSearch } from "@/lib/blog/use-search";

/** Inline expanding header search — the icon reveals an input in place, results drop down below. No route change. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, ready } = useSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field as soon as it expands.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Collapse on click-outside or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const trimmed = query.trim();

  if (!open) {
    return (
      <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpen(true)}>
        <IconSearch className="size-4" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="h-9 w-44 pl-8 sm:w-72"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Close search" onClick={close}>
          <IconX className="size-4" />
        </Button>
      </div>

      {trimmed.length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,26rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          {!ready ? (
            <p className="p-4 text-sm text-muted-foreground">Loading search…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No results for &ldquo;{trimmed}&rdquo;.
            </p>
          ) : (
            <ul className="max-h-[min(70vh,28rem)] divide-y overflow-y-auto">
              {results.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/post/${post.slug}`}
                    onClick={close}
                    className="block px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <Badge variant="secondary" className="mb-1">
                      {post.category}
                    </Badge>
                    <p className="font-heading text-sm font-semibold leading-tight">{post.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {post.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
