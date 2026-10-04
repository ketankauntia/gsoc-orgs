import type { CapBucket, CobaltFilters, CobaltSort, RecordFilter } from "./data";

// Directory URLs from the parsed filter state (q, scope, tech, topic, year, category, new,
// cap, rec, sort, page, view). Every filter change resets the page; view changes keep it.

const EMPTY: Pick<CobaltFilters, "q" | "tech" | "topic" | "years" | "category" | "isNew" | "cap" | "rec"> = {
  q: "", tech: [], topic: [], years: [], category: "", isNew: false, cap: [], rec: "",
};

/** Page numbers to show, with null for a gap: 1 … 4 5 6 … 20. */
export function pageWindow(page: number, pages: number): Array<number | null> {
  const wanted = [...new Set([1, pages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pages))].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  wanted.forEach((value, index) => {
    if (index && value - wanted[index - 1] > 1) out.push(null);
    out.push(value);
  });
  return out;
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
const same = (a: string, b: string) => a.toLocaleLowerCase("en") === b.toLocaleLowerCase("en");

export function cobaltLinks(path: string, filters: CobaltFilters) {
  function href(next: CobaltFilters) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.scope === "current") params.set("scope", "current");
    if (next.tech.length) params.set("tech", next.tech.join(","));
    if (next.topic.length) params.set("topic", next.topic.join(","));
    if (next.years.length) params.set("year", next.years.join(","));
    if (next.category) params.set("category", next.category);
    if (next.isNew) params.set("new", "1");
    if (next.cap.length) params.set("cap", next.cap.join(","));
    if (next.rec) params.set("rec", next.rec);
    if (next.sortSet) params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    if (next.view === "cards") params.set("view", "cards");
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }
  const filter = (change: Partial<CobaltFilters>) => href({ ...filters, page: 1, ...change });
  const preset = (change: Partial<CobaltFilters>) => href({ ...filters, ...EMPTY, page: 1, ...change });
  const facetCount = filters.tech.length + filters.topic.length + filters.years.length + filters.cap.length + (filters.category ? 1 : 0) + (filters.isNew ? 1 : 0) + (filters.rec ? 1 : 0);

  return {
    self: href(filters),
    /** Current query string without "?", for LiveSearch. */
    query: href(filters).split("?")[1] ?? "",
    tech: (value: string) => filter({ tech: toggle(filters.tech, value) }),
    topic: (value: string) => filter({ topic: toggle(filters.topic, value) }),
    year: (value: number) => filter({ years: toggle(filters.years, value) }),
    cap: (value: CapBucket) => filter({ cap: toggle(filters.cap, value) }),
    rec: (value: RecordFilter) => filter({ rec: filters.rec === value ? "" : value }),
    category: (value: string) => filter({ category: same(filters.category, value) ? "" : value }),
    isNew: () => filter({ isNew: !filters.isNew }),
    search: () => filter({ q: "" }),
    scope: (value: CobaltFilters["scope"]) => filter({ scope: value }),
    sort: (value: CobaltSort) => filter({ sort: value, sortSet: true }),
    view: (value: CobaltFilters["view"]) => href({ ...filters, view: value }),
    page: (value: number) => href({ ...filters, page: value }),
    clear: () => preset({}),
    preset,
    /** True when the facets equal exactly this preset (search ignored). */
    isPreset: (change: Partial<CobaltFilters>) => {
      const target = { ...EMPTY, ...change };
      return filters.tech.join() === target.tech.join() && filters.topic.join() === target.topic.join() && filters.years.join() === target.years.join()
        && filters.category === target.category && filters.isNew === target.isNew && filters.cap.join() === target.cap.join() && filters.rec === target.rec;
    },
    isCategory: (value: string) => same(filters.category, value),
    facetCount,
    hasFilters: facetCount > 0 || Boolean(filters.q),
  };
}
