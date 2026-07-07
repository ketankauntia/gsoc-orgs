"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconEdit,
  IconFilter,
  IconPencilPlus,
  IconSearch,
  IconSettings,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { Label } from "@/components/blog-ui/label";
import { Switch } from "@/components/blog-ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/blog-ui/dialog";
import { SearchableSelect } from "@/components/dashboard/searchable-select";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";
import type { PostRow, PostStatus } from "@/lib/blog/dashboard";

const PER_PAGE = 20;

const STATUS_STYLE: Record<PostStatus, string> = {
  published: "bg-success/15 text-success border-success/30",
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-warning/15 text-warning border-warning/30",
};

function scoreTone(score: number) {
  return score >= 80 ? "text-success" : score >= 55 ? "text-warning" : "text-destructive";
}

type Filters = {
  status: "all" | PostStatus;
  category: string;
  author: string;
  featuredOnly: boolean;
  cornerstoneOnly: boolean;
  noindexOnly: boolean;
};

const EMPTY_FILTERS: Filters = {
  status: "all",
  category: "",
  author: "",
  featuredOnly: false,
  cornerstoneOnly: false,
  noindexOnly: false,
};

export function DashboardClient({ rows }: { rows: PostRow[] }) {
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounced(rawQuery, 250);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const categoryOptions = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort().map((c) => ({ value: c, label: c })),
    [rows],
  );
  const authorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.author, r.authorName);
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filters.status === "all" || r.status === filters.status) &&
        (filters.category === "" || r.category === filters.category) &&
        (filters.author === "" || r.author === filters.author) &&
        (!filters.featuredOnly || r.featured) &&
        (!filters.cornerstoneOnly || r.cornerstone) &&
        (!filters.noindexOnly || r.noindex) &&
        (q === "" || r.title.toLowerCase().includes(q) || r.slug.includes(q)),
    );
  }, [rows, query, filters]);

  // Reset to page 1 whenever the result set changes.
  useEffect(() => setPage(1), [query, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const activeCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.author ? 1 : 0) +
    (filters.featuredOnly ? 1 : 0) +
    (filters.cornerstoneOnly ? 1 : 0) +
    (filters.noindexOnly ? 1 : 0);

  const stats = useMemo(() => {
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.seoScore, 0) / rows.length) : 0;
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      drafts: rows.filter((r) => r.status === "draft").length,
      scheduled: rows.filter((r) => r.status === "scheduled").length,
      avgScore: avg,
    };
  }, [rows]);

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Content Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Every post at a glance — status, freshness, and SEO health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <IconSettings className="size-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/editor">
              <IconPencilPlus className="size-4" />
              New post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total posts" value={stats.total} />
        <StatTile label="Published" value={stats.published} tone="text-success" />
        <StatTile label="Drafts" value={stats.drafts} tone="text-muted-foreground" />
        <StatTile label="Scheduled" value={stats.scheduled} tone="text-warning" />
        <StatTile label="Avg SEO score" value={stats.avgScore} tone={scoreTone(stats.avgScore)} />
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search posts…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          <IconFilter className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            <IconX className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-230 text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-right font-medium">#</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Author</th>
              <th className="px-3 py-3 font-medium">Updated</th>
              <th className="px-3 py-3 text-right font-medium">Words</th>
              <th className="px-3 py-3 text-center font-medium">SEO</th>
              <th className="px-3 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.slug} className="border-b last:border-0 hover:bg-accent/30">
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                  {(current - 1) * PER_PAGE + i + 1}
                </td>
                <td className="max-w-xs px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {r.featured && <IconStarFilled className="size-3.5 shrink-0 text-warning" aria-label="Featured" />}
                    <span className="truncate font-medium">{r.title}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate">/{r.slug}</span>
                    {r.cornerstone && <Badge variant="outline" className="h-4 px-1 text-[10px]">cornerstone</Badge>}
                    {r.noindex && <Badge variant="outline" className="h-4 px-1 text-[10px]">noindex</Badge>}
                    {!r.hasKeyphrase && <span className="text-warning">no keyphrase</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-md border px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLE[r.status])}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.authorName}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.updatedAt || r.publishedAt}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.words.toLocaleString()}</td>
                <td className="px-3 py-3 text-center">
                  <span className={cn("font-semibold tabular-nums", scoreTone(r.seoScore))}>{r.seoScore}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/editor?slug=${r.slug}`}>
                        <IconEdit className="size-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/blog/post/${r.slug}`} target="_blank">
                        <IconArrowUpRight className="size-4" />
                        Preview
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No posts match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <span className="tabular-nums text-muted-foreground">
              Page {current} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Filters modal */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SearchableSelect
                label="statuses"
                value={filters.status === "all" ? "" : filters.status}
                onChange={(v) => setFilters((f) => ({ ...f, status: (v || "all") as Filters["status"] }))}
                options={[
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Draft" },
                  { value: "scheduled", label: "Scheduled" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <SearchableSelect
                label="categories"
                value={filters.category}
                onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
                options={categoryOptions}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <SearchableSelect
                label="authors"
                value={filters.author}
                onChange={(v) => setFilters((f) => ({ ...f, author: v }))}
                options={authorOptions}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <FlagToggle
                label="Featured only"
                checked={filters.featuredOnly}
                onChange={(v) => setFilters((f) => ({ ...f, featuredOnly: v }))}
              />
              <FlagToggle
                label="Cornerstone only"
                checked={filters.cornerstoneOnly}
                onChange={(v) => setFilters((f) => ({ ...f, cornerstoneOnly: v }))}
              />
              <FlagToggle
                label="No-index only"
                checked={filters.noindexOnly}
                onChange={(v) => setFilters((f) => ({ ...f, noindexOnly: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className={cn("font-heading text-2xl font-bold tabular-nums", tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
