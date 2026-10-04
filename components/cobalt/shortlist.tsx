"use client";

import { useSyncExternalStore } from "react";

export interface ShortlistItem { slug: string; name: string }

// Key kept from the design-review prototype so shortlists saved there survive.
const KEY = "gsoc-studio-shortlist";
const EVENT = "gsoc-studio-shortlist";
const EMPTY: ShortlistItem[] = [];
let cacheRaw: string | null = null;
let cacheItems: ShortlistItem[] = EMPTY;

function read(): ShortlistItem[] {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { return EMPTY; }
  if (raw === cacheRaw) return cacheItems;
  cacheRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    cacheItems = Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.slug === "string" && typeof item.name === "string") : EMPTY;
  } catch {
    cacheItems = EMPTY;
  }
  return cacheItems;
}

function write(items: ShortlistItem[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage disabled: shortlist lasts for this render only */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}

/** Shortlist saved in this browser. */
export function useShortlist() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (slug: string) => items.some((item) => item.slug === slug),
    toggle: (item: ShortlistItem) => write(items.some((entry) => entry.slug === item.slug) ? items.filter((entry) => entry.slug !== item.slug) : [...items, item]),
    remove: (slug: string) => write(items.filter((item) => item.slug !== slug)),
    clear: () => write([]),
  };
}
