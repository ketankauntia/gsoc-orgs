"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import type { SearchRecord } from "@/lib/blog/content";

/**
 * Loads the static search index once and returns a debounced Fuse search.
 * ~200ms debounce (Algolia's guidance for local search); no network per keystroke.
 */
export function useSearch(query: string, debounceMs = 200) {
  const [index, setIndex] = useState<SearchRecord[] | null>(null);
  const [debounced, setDebounced] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch the index once, lazily.
  useEffect(() => {
    let alive = true;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchRecord[]) => {
        if (alive) setIndex(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Debounce the query.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(timer.current);
  }, [query, debounceMs]);

  const fuse = useMemo(
    () =>
      index
        ? new Fuse(index, {
            keys: [
              { name: "title", weight: 3 },
              { name: "tldr", weight: 2 },
              { name: "description", weight: 2 },
              { name: "tags", weight: 2 },
              { name: "category", weight: 1 },
              { name: "body", weight: 1 },
            ],
            threshold: 0.38, // typo tolerance without noise
            ignoreLocation: true,
            minMatchCharLength: 2,
          })
        : null,
    [index],
  );

  const results = useMemo(() => {
    const q = debounced.trim();
    if (!fuse || q.length < 2) return [];
    return fuse.search(q, { limit: 12 }).map((r) => r.item);
  }, [fuse, debounced]);

  return { results, ready: index !== null };
}
