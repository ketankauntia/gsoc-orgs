import "server-only";

import indexData from "@/new-api-details/organizations/index.json";
import insightsData from "@/new-api-details/insights.json";
import { loadOrganizationData } from "@/lib/organizations-page-types";
import { loadOrganizationProjects } from "@/lib/projects-page-types";
import { getAllPosts } from "@/lib/blog/content";
import { technologyHref, topicHref } from "@/lib/vocabulary/catalog";
import { techLabel, topicLabel } from "./labels";
import { squarify, type Rect } from "./treemap";

// Site data for the Cobalt UI: the organization index merged with per-year contributor slots
// and mentors (new-api-details/insights.json, from scripts/generate-insights.mjs). Profiles add
// contacts and projects from the organization file and the per-year project files.

interface Insights {
  version: number;
  years: number[];
  programs: Array<{ year: number; slots: number; mentors: number | null }>;
  organizations: Array<{ slug: string; slots: number[]; mentors: Array<number | null>; logo: string | null; logoDark?: boolean }>;
}

interface IndexOrganization {
  id: string; slug: string; name: string; category: string; description: string; url: string;
  active_years: number[]; withdrawn_years?: number[]; first_year: number; last_year: number;
  technologies: string[]; topics: string[]; total_projects: number; first_time: boolean | null;
}

export interface OrganizationSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  website: string | null;
  activeYears: number[];
  withdrawnYears: number[];
  firstYear: number;
  lastYear: number;
  technologies: string[];
  topics: string[];
  totalProjects: number;
  firstTime: boolean | null;
}

export type SearchParams = Record<string, string | string[] | undefined>;

const insights = insightsData as Insights;
const index = indexData as unknown as { published_at: string; organizations: IndexOrganization[] };
export const YEARS = insights.years;
export const CURRENT_YEAR = YEARS[YEARS.length - 1];
export const SNAPSHOT_LABEL = new Date(index.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const CUR = YEARS.length - 1;
const PREV = YEARS.length - 2;

function getAllOrganizations(): OrganizationSummary[] {
  return index.organizations.map((org) => ({
    id: org.id,
    slug: org.slug,
    name: org.name,
    category: org.category,
    description: org.description ?? "",
    website: org.url || null,
    activeYears: org.active_years,
    withdrawnYears: org.withdrawn_years ?? [],
    firstYear: org.first_year,
    lastYear: org.last_year,
    technologies: org.technologies ?? [],
    topics: org.topics ?? [],
    totalProjects: org.total_projects,
    firstTime: org.first_time,
  }));
}

export interface CobaltOrg extends OrganizationSummary {
  /** Contributor slots per archive year, oldest first (0 when absent or withdrawn). */
  slots: number[];
  /** Mentors per year where every project lists them, otherwise null. */
  mentors: Array<number | null>;
  logo: string | null;
  /** White-on-transparent logo: render it on a dark plate. */
  logoDark: boolean;
  /** Cycles taken part in (withdrawn years excluded). */
  cycles: number;
  /** Consecutive cycles ending with the latest one the organization took part in. */
  streak: number;
  current: number;
  previous: number;
  /** Contributors per cycle taken part in. */
  average: number;
  inCurrent: boolean;
  isNew: boolean;
  everyYear: boolean;
  growing: boolean;
  /** Back in the current cycle after missing the previous one. */
  returning: boolean;
}

function active(org: OrganizationSummary, year: number) {
  return org.activeYears.includes(year) && !org.withdrawnYears.includes(year);
}

let cache: CobaltOrg[] | null = null;

export function cobaltOrganizations(): CobaltOrg[] {
  if (cache) return cache;
  const extra = new Map(insights.organizations.map((entry) => [entry.slug, entry]));
  cache = getAllOrganizations().map((org) => {
    const data = extra.get(org.slug);
    const slots = data?.slots ?? YEARS.map(() => 0);
    const flags = YEARS.map((year) => active(org, year));
    const cycles = flags.filter(Boolean).length;
    let last = flags.lastIndexOf(true);
    let streak = 0;
    while (last >= 0 && flags[last]) { streak += 1; last -= 1; }
    const total = slots.reduce((sum, value) => sum + value, 0);
    const recent = slots.slice(CUR - 5, CUR).filter((value, index) => flags[CUR - 5 + index] && value > 0);
    const recentAverage = recent.length ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
    const inCurrent = flags[CUR];
    return {
      ...org,
      slots,
      mentors: data?.mentors ?? YEARS.map(() => null),
      logo: data?.logo ?? null,
      logoDark: Boolean(data?.logoDark),
      cycles,
      streak,
      current: inCurrent ? slots[CUR] : 0,
      previous: slots[PREV],
      average: cycles ? Math.round((total / cycles) * 10) / 10 : 0,
      inCurrent,
      isNew: inCurrent && flags.slice(0, CUR).every((flag) => !flag),
      everyYear: flags.every(Boolean),
      growing: inCurrent && recent.length >= 2 && slots[CUR] > slots[PREV] && slots[CUR] >= recentAverage * 1.25 && slots[CUR] - recentAverage >= 2,
      returning: inCurrent && !flags[PREV] && flags.slice(0, PREV).some(Boolean),
    };
  });
  return cache;
}

export function cobaltOrganization(slug: string) {
  return cobaltOrganizations().find((org) => org.slug === slug) ?? null;
}

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const norm = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

/** One row per archive year: organizations, contributors, mentors, first-timers, median. */
export function programSeries() {
  const orgs = cobaltOrganizations();
  return YEARS.map((year, index) => {
    const taking = orgs.filter((org) => active(org, year));
    return {
      year,
      orgs: taking.length,
      slots: insights.programs[index].slots,
      mentors: insights.programs[index].mentors,
      firstTime: index === 0 ? null : taking.filter((org) => YEARS.slice(0, index).every((earlier) => !active(org, earlier))).length,
      median: median(taking.map((org) => org.slots[index]).filter((value) => value > 0)),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Collections: data-defined shortlists shared by landing and directory */

export type RecordFilter = "every" | "five" | "growing" | "returning";
export type CapBucket = "1-2" | "3-5" | "6-9" | "10+";

export const capBuckets: Array<{ value: CapBucket; label: string; test: (n: number) => boolean }> = [
  { value: "1-2", label: "1–2", test: (n) => n >= 1 && n <= 2 },
  { value: "3-5", label: "3–5", test: (n) => n >= 3 && n <= 5 },
  { value: "6-9", label: "6–9", test: (n) => n >= 6 && n <= 9 },
  { value: "10+", label: "10 or more", test: (n) => n >= 10 },
];

export const recordFilters: Array<{ value: RecordFilter; label: string; detail: string; test: (org: CobaltOrg) => boolean }> = [
  { value: "every", label: "Every cycle since 2016", detail: "Selected in all eleven cycles", test: (org) => org.everyYear },
  { value: "five", label: "Five or more cycles", detail: "A long record in the program", test: (org) => org.cycles >= 5 },
  { value: "growing", label: `Growing in ${CURRENT_YEAR}`, detail: "More than last cycle and well above its recent average", test: (org) => org.growing },
  { value: "returning", label: "Back after a break", detail: `Returned in ${CURRENT_YEAR} after missing ${CURRENT_YEAR - 1}`, test: (org) => org.returning },
];

export interface Collection {
  id: string;
  title: string;
  rule: string;
  count: number;
  params: Partial<CobaltFilters>;
  sample: CobaltOrg[];
}

export function collections(): Collection[] {
  const current = cobaltOrganizations().filter((org) => org.inCurrent);
  const bySlots = (list: CobaltOrg[]) => [...list].sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));
  const make = (id: string, title: string, rule: string, list: CobaltOrg[], params: Partial<CobaltFilters>): Collection => ({ id, title, rule, count: list.length, params, sample: bySlots(list).slice(0, 5) });
  const python = current.filter((org) => org.technologies.some((tech) => norm(tech) === "python"));
  return [
    make("every", "Every cycle since 2016", "Selected in all eleven cycles, 2016 to 2026.", current.filter((org) => org.everyYear), { rec: "every" }),
    make("new", `First time in ${CURRENT_YEAR}`, `New to the program in ${CURRENT_YEAR}.`, current.filter((org) => org.isNew), { isNew: true }),
    make("large", "Ten or more contributors", `Took at least ten contributors in ${CURRENT_YEAR}.`, current.filter((org) => org.current >= 10), { cap: ["10+"] }),
    make("growing", `Growing in ${CURRENT_YEAR}`, `More contributors than in ${CURRENT_YEAR - 1}, and at least 25% above their 2021–2025 average.`, current.filter((org) => org.growing), { rec: "growing" }),
    make("returning", "Back after a break", `In ${CURRENT_YEAR} after sitting out ${CURRENT_YEAR - 1}.`, current.filter((org) => org.returning), { rec: "returning" }),
    make("python", "Python organizations", `List Python in their stack. They took ${python.reduce((sum, org) => sum + org.current, 0).toLocaleString("en-US")} of this year's slots.`, python, { tech: ["python"] }),
  ];
}

/* ------------------------------------------------------------------ */
/* Landing */

export interface TreemapTile extends Rect { slug: string; name: string; category: string; value: number; isNew: boolean; cycles: number; logo: string | null; logoDark: boolean }
export interface TreemapGroup extends Rect { category: string; value: number; orgs: number; labelled: boolean; tiles: TreemapTile[] }

/** Two-level treemap of current contributor slots: categories, then organizations. Percent units. */
function fieldTreemap(width: number, height: number): TreemapGroup[] {
  const current = cobaltOrganizations().filter((org) => org.inCurrent && org.current > 0);
  const byCategory = new Map<string, CobaltOrg[]>();
  for (const org of current) byCategory.set(org.category, [...(byCategory.get(org.category) ?? []), org]);
  const groups = squarify(
    [...byCategory.entries()].map(([category, orgs]) => ({ value: orgs.reduce((sum, org) => sum + org.current, 0), data: { category, orgs } })),
    { x: 0, y: 0, w: width, h: height },
  );
  return groups.map((group) => {
    const labelled = group.w >= 150 && group.h >= 90;
    const band = labelled ? 22 : 0;
    const tiles = squarify(
      group.data.orgs.map((org) => ({ value: org.current, data: org })),
      { x: group.x, y: group.y + band, w: group.w, h: group.h - band },
    );
    const pct = (rect: Rect): Rect => ({ x: (rect.x / width) * 100, y: (rect.y / height) * 100, w: (rect.w / width) * 100, h: (rect.h / height) * 100 });
    return {
      ...pct(group),
      category: group.data.category,
      value: group.value,
      orgs: group.data.orgs.length,
      labelled,
      tiles: tiles.map((tile) => ({
        ...pct(tile),
        slug: tile.data.slug,
        name: tile.data.name,
        category: tile.data.category,
        value: tile.data.current,
        isNew: tile.data.isNew,
        cycles: tile.data.cycles,
        logo: tile.data.logo,
        logoDark: tile.data.logoDark,
      })),
    };
  });
}

/** Contributor slots at organizations listing each technology, this cycle and five cycles earlier. */
export function technologyDemand(limit = 12) {
  const orgs = cobaltOrganizations();
  const then = CUR - 5;
  const rows = new Map<string, { now: number; nowOrgs: number; then: number; thenOrgs: number }>();
  for (const org of orgs) {
    for (const tech of new Set(org.technologies.map(norm))) {
      if (tech === "c/c++") continue;
      const row = rows.get(tech) ?? { now: 0, nowOrgs: 0, then: 0, thenOrgs: 0 };
      if (org.inCurrent) { row.now += org.current; row.nowOrgs += 1; }
      if (active(org, YEARS[then])) { row.then += org.slots[then]; row.thenOrgs += 1; }
      rows.set(tech, row);
    }
  }
  return {
    then: YEARS[then],
    rows: [...rows.entries()]
      .map(([value, row]) => ({ value, label: techLabel(value), ...row }))
      .sort((a, b) => b.now - a.now)
      .slice(0, limit),
  };
}

/** Organizations, technologies, topics and articles for the search palette (served by /organizations/search-index.json). */
export function searchIndex() {
  const orgs = cobaltOrganizations();
  const count = (select: (org: CobaltOrg) => string[], label: (value: string) => string, href: (value: string) => string) => {
    const map = new Map<string, number>();
    for (const org of orgs.filter((item) => item.inCurrent)) for (const value of new Set(select(org).map(norm))) if (value.length <= 30) map.set(value, (map.get(value) ?? 0) + 1);
    return [...map.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 80).map(([value, n]) => ({ v: value, l: label(value), n, h: href(value) }));
  };
  return {
    orgs: orgs.map((org) => ({ s: org.slug, n: org.name, c: org.category, k: org.current, y: org.cycles, l: org.logo, d: org.logoDark, a: org.inCurrent })),
    tech: count((org) => org.technologies, techLabel, technologyHref),
    topic: count((org) => org.topics, topicLabel, topicHref),
    posts: getAllPosts().filter((post) => !post.noindex).map((post) => ({ s: post.slug, t: post.title, c: post.category })),
  };
}
export type SearchIndex = ReturnType<typeof searchIndex>;

export async function getCobaltLanding() {
  const orgs = cobaltOrganizations();
  const current = orgs.filter((org) => org.inCurrent);
  const series = programSeries();
  const now = series[CUR];
  const slots = current.map((org) => org.current);
  const buckets = [
    { label: "1", test: (n: number) => n === 1 },
    { label: "2", test: (n: number) => n === 2 },
    { label: "3–5", test: (n: number) => n >= 3 && n <= 5 },
    { label: "6–10", test: (n: number) => n >= 6 && n <= 10 },
    { label: "11–20", test: (n: number) => n >= 11 && n <= 20 },
    { label: "21+", test: (n: number) => n > 20 },
  ].map((bucket) => ({ label: bucket.label, value: slots.filter(bucket.test).length }));
  const top = [...current].sort((a, b) => b.current - a.current || a.name.localeCompare(b.name)).slice(0, 10);
  const strip = ["python-software-foundation", "the-linux-foundation", "apache-software-foundation", "libreoffice", "numfocus", "the-julia-language", "git"]
    .map((slug) => cobaltOrganization(slug))
    .filter((org): org is CobaltOrg => Boolean(org));
  const blender = cobaltOrganization("blender-foundation");
  const announced = current.length + orgs.filter((org) => org.withdrawnYears.includes(CURRENT_YEAR)).length;
  return {
    totals: {
      orgs: orgs.length,
      current: current.length,
      announced,
      withdrawn: announced - current.length,
      slots: now.slots,
      projectsAllTime: insights.programs.reduce((sum, entry) => sum + entry.slots, 0),
      firstTime: current.filter((org) => org.isNew).length,
      median: median(slots),
      returningShare: Math.round((current.filter((org) => org.previous > 0).length / current.length) * 100),
      everyYear: current.filter((org) => org.everyYear).length,
      over20: slots.filter((n) => n > 20).length,
      threeToFive: slots.filter((n) => n >= 3 && n <= 5).length,
      topTenShare: Math.round((top.reduce((sum, org) => sum + org.current, 0) / now.slots) * 100),
    },
    series,
    buckets,
    top,
    tech: technologyDemand(),
    field: { desktop: fieldTreemap(1100, 540), mobile: fieldTreemap(360, 640) },
    collections: collections(),
    strip,
    blender,
    blenderContacts: blender ? await contactsFor(blender.slug) : null,
  };
}
export type CobaltLanding = Awaited<ReturnType<typeof getCobaltLanding>>;

/* ------------------------------------------------------------------ */
/* Directory */

export type CobaltSort = "relevance" | "slots" | "cycles" | "total" | "growth" | "name" | "newest";
export const sortOptions: Array<{ value: CobaltSort; label: string; short: string }> = [
  { value: "relevance", label: "Best match", short: "Best match" },
  { value: "slots", label: `Most contributors in ${CURRENT_YEAR}`, short: `Most in ${CURRENT_YEAR}` },
  { value: "growth", label: `Biggest change since ${CURRENT_YEAR - 1}`, short: "Biggest change" },
  { value: "cycles", label: "Most cycles", short: "Most cycles" },
  { value: "total", label: "Most projects since 2016", short: "Most projects" },
  { value: "newest", label: "Newest to the program", short: "Newest" },
  { value: "name", label: "Name A–Z", short: "A–Z" },
];

export interface CobaltFilters {
  q: string;
  scope: "current" | "archive";
  tech: string[];
  topic: string[];
  years: number[];
  category: string;
  isNew: boolean;
  cap: CapBucket[];
  rec: RecordFilter | "";
  sort: CobaltSort;
  /** True when the sort came from the URL rather than the default. */
  sortSet: boolean;
  page: number;
  view: "table" | "cards";
}

const scalar = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? "" : value ?? "");
const list = (value: string | string[] | undefined) => [...new Set((Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")).map(norm).filter(Boolean))];

export function parseFilters(params: SearchParams): CobaltFilters {
  const q = scalar(params.q).trim().slice(0, 100);
  // Every organization since 2016 by default; ?scope=current narrows to this cycle.
  const scope = scalar(params.scope) === "current" ? "current" : "archive";
  const rawSort = scalar(params.sort) as CobaltSort;
  const sortSet = sortOptions.some((option) => option.value === rawSort) && (rawSort !== "relevance" || Boolean(q));
  const rec = scalar(params.rec) as RecordFilter;
  const page = Number.parseInt(scalar(params.page), 10);
  return {
    q,
    scope,
    tech: list(params.tech ?? params.techs),
    topic: list(params.topic ?? params.topics),
    years: list(params.year ?? params.years).map(Number).filter((year) => YEARS.includes(year)),
    category: (scalar(params.category) || scalar(params.categories).split(",")[0] || "").trim().slice(0, 80),
    isNew: scalar(params.new) === "1" || scalar(params.firstTimeOnly) === "true",
    cap: list(params.cap).filter((value): value is CapBucket => capBuckets.some((bucket) => bucket.value === value)),
    rec: recordFilters.some((filter) => filter.value === rec) ? rec : "",
    sort: sortSet ? rawSort : q ? "relevance" : "name",
    sortSet,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    view: scalar(params.view) === "cards" ? "cards" : "table",
  };
}

type FacetKey = "tech" | "topic" | "years" | "category" | "isNew" | "cap" | "rec";

function matchesQuery(org: CobaltOrg, terms: string[]) {
  if (!terms.length) return true;
  const haystack = norm([org.name, org.category, org.description, ...org.technologies, ...org.topics].join(" "));
  return terms.every((term) => haystack.includes(term));
}

function relevance(org: CobaltOrg, q: string) {
  const name = norm(org.name);
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (org.technologies.some((tech) => norm(tech) === q) || org.topics.some((topic) => norm(topic) === q)) return 3;
  return 4;
}

function filterOrgs(orgs: CobaltOrg[], filters: CobaltFilters, except?: FacetKey) {
  const terms = norm(filters.q).split(" ").filter(Boolean);
  return orgs.filter((org) => {
    if (filters.scope === "current" && !org.inCurrent) return false;
    if (!matchesQuery(org, terms)) return false;
    if (except !== "category" && filters.category && norm(org.category) !== norm(filters.category)) return false;
    if (except !== "tech" && filters.tech.length && !filters.tech.some((tech) => org.technologies.some((value) => norm(value) === tech))) return false;
    if (except !== "topic" && filters.topic.length && !filters.topic.some((topic) => org.topics.some((value) => norm(value) === topic))) return false;
    if (except !== "years" && filters.years.length && !filters.years.some((year) => active(org, year))) return false;
    if (except !== "isNew" && filters.isNew && !org.isNew) return false;
    if (except !== "cap" && filters.cap.length && !capBuckets.some((bucket) => filters.cap.includes(bucket.value) && bucket.test(org.current))) return false;
    if (except !== "rec" && filters.rec && !recordFilters.find((filter) => filter.value === filters.rec)?.test(org)) return false;
    return true;
  });
}

function sortOrgs(orgs: CobaltOrg[], filters: CobaltFilters) {
  const q = norm(filters.q);
  const byName = (a: CobaltOrg, b: CobaltOrg) => a.name.localeCompare(b.name, "en");
  const sorters: Record<CobaltSort, (a: CobaltOrg, b: CobaltOrg) => number> = {
    relevance: (a, b) => relevance(a, q) - relevance(b, q) || b.current - a.current || byName(a, b),
    slots: (a, b) => b.current - a.current || b.cycles - a.cycles || byName(a, b),
    growth: (a, b) => (b.current - b.previous) - (a.current - a.previous) || b.current - a.current || byName(a, b),
    cycles: (a, b) => b.cycles - a.cycles || b.totalProjects - a.totalProjects || byName(a, b),
    total: (a, b) => b.totalProjects - a.totalProjects || byName(a, b),
    newest: (a, b) => b.firstYear - a.firstYear || b.current - a.current || byName(a, b),
    name: byName,
  };
  return [...orgs].sort(sorters[filters.sort]);
}

function countValues(orgs: CobaltOrg[], select: (org: CobaltOrg) => string[]) {
  const counts = new Map<string, number>();
  for (const org of orgs) for (const value of new Set(select(org).map(norm).filter((item) => item && item.length <= 40))) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export interface Facet { value: string; label: string; count: number }

function facetList(counts: Map<string, number>, selected: string[], label: (value: string) => string): Facet[] {
  const items = [...counts.entries()].map(([value, count]) => ({ value, label: label(value), count }));
  for (const value of selected) if (!counts.has(value)) items.push({ value, label: label(value), count: 0 });
  return items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getCobaltDirectory(params: SearchParams, pageSize: number) {
  const filters = parseFilters(params);
  const orgs = cobaltOrganizations();
  const matched = sortOrgs(filterOrgs(orgs, filters), filters);
  const pages = Math.max(1, Math.ceil(matched.length / pageSize));
  const page = Math.min(filters.page, pages);
  const without = (key: FacetKey) => filterOrgs(orgs, filters, key);

  const categoryCounts = countValues(without("category"), (org) => [org.category]);
  const yearBase = without("years");
  const capBase = without("cap");
  const recBase = without("rec");
  return {
    filters: { ...filters, page },
    items: matched.slice((page - 1) * pageSize, page * pageSize),
    total: matched.length,
    pages,
    pageSize,
    scopeCounts: { current: orgs.filter((org) => org.inCurrent).length, archive: orgs.length },
    maxCurrent: Math.max(1, ...orgs.map((org) => org.current)),
    facets: {
      category: [...categoryCounts.entries()].map(([value, count]) => ({ value, label: orgs.find((org) => norm(org.category) === value)?.category ?? value, count })).sort((a, b) => b.count - a.count),
      tech: facetList(countValues(without("tech"), (org) => org.technologies), filters.tech, techLabel),
      topic: facetList(countValues(without("topic"), (org) => org.topics), filters.topic, topicLabel),
      years: YEARS.map((year) => ({ year, count: yearBase.filter((org) => active(org, year)).length })),
      cap: capBuckets.map((bucket) => ({ value: bucket.value, label: bucket.label, count: capBase.filter((org) => bucket.test(org.current)).length })),
      rec: recordFilters.map((filter) => ({ value: filter.value, label: filter.label, detail: filter.detail, count: recBase.filter(filter.test).length })),
      isNew: without("isNew").filter((org) => org.isNew).length,
    },
    collections: collections(),
  };
}
export type CobaltDirectory = ReturnType<typeof getCobaltDirectory>;

/* ------------------------------------------------------------------ */
/* Profile */

export interface CobaltProject {
  t: string;
  c: string | null;
  m: string[];
  d: string;
  /** Official program page. */
  u: string | null;
  g: string | null;
  /** Routed project page on this site, when the archive has one. */
  href: string | null;
}
export interface Contacts { contact: Record<string, string | null>; social: Record<string, string> }

interface OrganizationFile {
  contact?: Record<string, string | null>;
  social?: Record<string, string | null>;
  years?: Record<string, { projects?: Array<{ title?: string; student_name?: string | null; short_description?: string | null; description?: string | null; project_url?: string | null; code_url?: string | null }> } | null>;
}

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
function excerpt(value: unknown, max = 300) {
  const text = clean(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}…`;
}

function contactsOf(file: OrganizationFile | null): Contacts {
  return {
    contact: file?.contact ?? {},
    social: Object.fromEntries(Object.entries(file?.social ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1]))),
  };
}

export async function contactsFor(slug: string): Promise<Contacts> {
  return contactsOf((await loadOrganizationData(slug)) as OrganizationFile | null);
}

/** One year's projects: titles and descriptions from the organization file, mentors and routed ids from the year file. */
function projectsFor(slug: string, year: number, file: OrganizationFile | null, all: Awaited<ReturnType<typeof loadOrganizationProjects>>): CobaltProject[] {
  const routed = all.filter((project) => project.year === year);
  const byId = new Map(routed.map((project) => [project.project_id, project]));
  const source = file?.years?.[`year_${year}`]?.projects ?? [];
  if (!source.length) {
    return routed.map((project) => ({
      t: clean(project.project_title),
      c: clean(project.contributor) || null,
      m: project.mentors ?? [],
      d: excerpt(project.project_abstract_short ?? project.project_description),
      u: project.project_url ?? null,
      g: project.project_code_url ?? null,
      href: `/organizations/${slug}/projects/${project.project_id}`,
    }));
  }
  return source.map((project) => {
    const id = clean(project.project_url).split("/").filter(Boolean).pop() ?? "";
    const match = byId.get(id);
    return {
      t: clean(project.title),
      c: clean(project.student_name) || null,
      m: match?.mentors ?? [],
      d: excerpt(project.short_description || project.description),
      u: project.project_url ?? null,
      g: project.code_url ?? null,
      href: match ? `/organizations/${slug}/projects/${match.project_id}` : null,
    };
  });
}

export async function getCobaltProfile(slug: string) {
  const org = cobaltOrganization(slug);
  if (!org) return null;
  const [file, routedAll] = await Promise.all([loadOrganizationData(slug) as Promise<OrganizationFile | null>, loadOrganizationProjects(slug)]);
  const series = programSeries();
  const yearTabs = YEARS.map((year, i) => ({ year, count: org.slots[i] })).filter((tab) => tab.count > 0).reverse();
  const current = cobaltOrganizations().filter((other) => other.inCurrent);
  const rank = org.inCurrent ? current.filter((other) => other.current > org.current).length + 1 : null;
  const techs = new Set(org.technologies.map(norm));
  const topics = new Set(org.topics.map(norm));
  const related = current
    .filter((other) => other.slug !== org.slug)
    .map((other) => ({
      other,
      score: other.technologies.filter((tech) => techs.has(norm(tech))).length * 2 + other.topics.filter((topic) => topics.has(norm(topic))).length + (other.category === org.category ? 3 : 0),
    }))
    .filter((entry) => entry.score > 2)
    .sort((a, b) => b.score - a.score || b.other.current - a.other.current)
    .slice(0, 4)
    .map((entry) => entry.other);
  const lastMentors = [...YEARS.keys()].reverse().find((i) => org.mentors[i] !== null);
  return {
    org,
    contacts: contactsOf(file),
    series,
    yearTabs,
    /** Every year with projects, newest first; all rendered so the page can be cached and crawled. */
    yearPanels: yearTabs.map((tab) => ({ year: tab.year, projects: projectsFor(slug, tab.year, file, routedAll) })),
    projectTotal: org.slots.reduce((sum, value) => sum + value, 0),
    rank,
    currentCount: current.length,
    share: org.inCurrent ? org.current / series[CUR].slots : 0,
    mentors: lastMentors === undefined ? null : { year: YEARS[lastMentors], count: org.mentors[lastMentors] as number, slots: org.slots[lastMentors] },
    related,
  };
}
export type CobaltProfile = NonNullable<Awaited<ReturnType<typeof getCobaltProfile>>>;
