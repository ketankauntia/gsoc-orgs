"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCircleX,
  IconDeviceFloppy,
  IconExternalLink,
  IconFilePlus,
  IconTrash,
} from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { Label } from "@/components/blog-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/blog-ui/select";
import { Switch } from "@/components/blog-ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/blog-ui/tabs";
import { Textarea } from "@/components/blog-ui/textarea";
import { FaqSection } from "@/components/blog/faq-section";
import { KeyTakeaways } from "@/components/blog/key-takeaways";
import { PostBody } from "@/components/blog/post-body";
import { TldrBlock } from "@/components/blog/tldr-block";
import { parseSections, slugify } from "@/lib/blog/parse";
import { runSeoChecks, seoScore, type SeoCheck } from "@/lib/editor/seo-checks";
import { suggestInternalLinks, type LinkCandidate } from "@/lib/editor/link-suggestions";
import { RichEditor } from "@/components/editor/rich-editor";
import { cn } from "@/lib/utils";

export type EditablePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  author: string;
  featured: boolean;
  draft: boolean;
  cornerstone: boolean;
  noindex: boolean;
  canonical: string;
  coverTone: string;
  keyphrase: string;
  tldr: string;
  keyTakeaways: string[];
  faqs: { q: string; a: string }[];
  body: string;
};

function blankPost(): EditablePost {
  return {
    slug: "",
    title: "",
    description: "",
    category: "",
    tags: [],
    publishedAt: new Date().toISOString().slice(0, 10),
    updatedAt: "",
    author: "GSoC Organizations-team",
    featured: false,
    draft: true,
    cornerstone: false,
    noindex: false,
    canonical: "",
    coverTone: "primary",
    keyphrase: "",
    tldr: "",
    keyTakeaways: [],
    faqs: [],
    body: "## First section\n\nStart writing…",
  };
}

const COVER_TONES = ["primary", "chart-2", "chart-3", "chart-5"];

/** Immutably move an array item from one index to another. */
function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PostEditor({
  posts,
  authorSlugs,
  canSave,
  initialSlug,
}: {
  posts: EditablePost[];
  authorSlugs: string[];
  canSave: boolean;
  initialSlug?: string;
}) {
  const [draft, setDraft] = useState<EditablePost>(
    posts.find((p) => p.slug === initialSlug) ?? posts[0] ?? blankPost(),
  );
  const [slugTouched, setSlugTouched] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [restorable, setRestorable] = useState<EditablePost | null>(null);
  const [editMode, setEditMode] = useState<"rich" | "markdown">("rich");

  const autosaveKey = (slug: string) => `be-editor:autosave:${slug || "__new__"}`;

  // Autosave the working draft to localStorage (debounced) so a crash/refresh can't lose work.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(autosaveKey(draft.slug), JSON.stringify(draft));
      } catch {
        /* quota/private-mode — ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [draft]);

  // On first mount, offer to restore an autosaved copy of the initially-loaded post if it differs.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(autosaveKey(draft.slug));
      if (saved) {
        const parsed = JSON.parse(saved) as EditablePost;
        if (JSON.stringify(parsed) !== JSON.stringify(draft)) setRestorable(parsed);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo(() => parseSections(draft.body), [draft.body]);
  const checks = useMemo(
    () =>
      runSeoChecks({
        title: draft.title,
        description: draft.description,
        slug: draft.slug,
        keyphrase: draft.keyphrase,
        tldr: draft.tldr,
        keyTakeaways: draft.keyTakeaways,
        faqs: draft.faqs,
        tags: draft.tags,
        body: draft.body,
        updatedAt: draft.updatedAt || draft.publishedAt,
        cornerstone: draft.cornerstone,
      }),
    [draft],
  );
  const score = seoScore(checks);

  const linkSuggestions = useMemo(
    () =>
      suggestInternalLinks(
        { slug: draft.slug, category: draft.category, tags: draft.tags, body: draft.body },
        posts,
      ),
    [draft.slug, draft.category, draft.tags, draft.body, posts],
  );

  function set<K extends keyof EditablePost>(key: K, value: EditablePost[K]) {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      // Auto-derive slug from title until the slug is edited by hand
      if (key === "title" && !slugTouched) next.slug = slugify(value as string);
      return next;
    });
    setSaveState("idle");
  }

  function loadPost(slug: string) {
    const next = slug === "__new__" ? blankPost() : posts.find((p) => p.slug === slug);
    if (!next) return;
    setDraft(next);
    setSlugTouched(slug !== "__new__");
    setSaveState("idle");
    // Offer to restore an autosave for the post being opened, if it diverges from disk.
    try {
      const saved = localStorage.getItem(autosaveKey(next.slug));
      setRestorable(saved && saved !== JSON.stringify(next) ? (JSON.parse(saved) as EditablePost) : null);
    } catch {
      setRestorable(null);
    }
  }

  function restoreAutosave() {
    if (restorable) setDraft(restorable);
    setRestorable(null);
  }

  /** Flush the current draft to localStorage, then open the full-page preview (which reads it back). */
  function openPreview() {
    const key = draft.slug || "__new__";
    try {
      localStorage.setItem(autosaveKey(draft.slug), JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    window.open(`/dashboard/editor/preview?key=${encodeURIComponent(key)}`, "_blank", "noopener");
  }

  function discardAutosave() {
    try {
      localStorage.removeItem(autosaveKey(draft.slug));
    } catch {
      /* ignore */
    }
    setRestorable(null);
  }

  async function save() {
    setSaveState("saving");
    const { slug, body, ...rest } = draft;
    const frontmatter = {
      title: rest.title,
      description: rest.description,
      category: rest.category,
      tags: rest.tags,
      publishedAt: rest.publishedAt,
      updatedAt: rest.updatedAt,
      author: rest.author,
      featured: rest.featured || undefined,
      draft: rest.draft || undefined,
      cornerstone: rest.cornerstone || undefined,
      noindex: rest.noindex || undefined,
      canonical: rest.canonical || undefined,
      coverTone: rest.coverTone,
      keyphrase: rest.keyphrase,
      tldr: rest.tldr,
      keyTakeaways: rest.keyTakeaways,
      faqs: rest.faqs,
    };
    try {
      const res = await fetch(`/api/editor/posts/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaveState("saved");
      setSaveMessage(`Saved to ${data.path}`);
      // Disk is now the source of truth — drop the autosave shadow copy.
      try {
        localStorage.removeItem(autosaveKey(slug));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setSaveState("error");
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <Select value={posts.some((p) => p.slug === draft.slug) ? draft.slug : "__new__"} onValueChange={loadPost}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a post" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__">
              <span className="inline-flex items-center gap-2">
                <IconFilePlus className="size-4" /> New post
              </span>
            </SelectItem>
            {posts.map((p) => (
              <SelectItem key={p.slug} value={p.slug}>
                {p.draft ? "◌ " : ""}
                {p.title || p.slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.draft} onCheckedChange={(v) => set("draft", v)} />
          Draft
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.featured} onCheckedChange={(v) => set("featured", v)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.cornerstone} onCheckedChange={(v) => set("cornerstone", v)} />
          Cornerstone
        </label>

        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard">Dashboard</a>
          </Button>
          <ScoreBadge score={score} />
          <Button variant="outline" onClick={openPreview}>
            <IconExternalLink className="size-4" />
            Preview
          </Button>
          <Button onClick={save} disabled={!canSave || saveState === "saving" || !draft.slug}>
            <IconDeviceFloppy className="size-4" />
            {saveState === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {!canSave && (
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only: saving is available in development only (the production save target is decided later).
        </p>
      )}
      {saveState === "saved" && <p className="mt-2 text-sm text-primary">{saveMessage}</p>}
      {saveState === "error" && <p className="mt-2 text-sm text-destructive">{saveMessage}</p>}

      {restorable && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <span>Found an unsaved autosaved draft for this post. Restore it?</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={restoreAutosave}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={discardAutosave}>Discard</Button>
          </div>
        </div>
      )}

      {/* Split pane: editor left, live preview right */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Left: editing */}
        <Tabs defaultValue="content">
          <TabsList className="w-full">
            <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
            <TabsTrigger value="meta" className="flex-1">Meta &amp; SEO</TabsTrigger>
            <TabsTrigger value="blocks" className="flex-1">TL;DR / FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Field label="Title (H1)">
              <Input value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Post title" />
            </Field>

            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Body ({draft.body.split(/\s+/).filter(Boolean).length} words)
              </Label>
              {/* Rich (WYSIWYG) is the default; Markdown is the raw escape hatch. Both edit the same content. */}
              <div className="inline-flex rounded-md border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditMode("rich")}
                  className={cn("rounded px-2 py-1", editMode === "rich" && "bg-primary text-primary-foreground")}
                >
                  Rich
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("markdown")}
                  className={cn("rounded px-2 py-1", editMode === "markdown" && "bg-primary text-primary-foreground")}
                >
                  Markdown
                </button>
              </div>
            </div>

            {editMode === "rich" ? (
              <RichEditor value={draft.body} onChange={(md) => set("body", md)} uploadSlug={draft.slug} />
            ) : (
              <Textarea
                value={draft.body}
                onChange={(e) => set("body", e.target.value)}
                spellCheck={false}
                className="min-h-[55vh] font-mono text-sm leading-relaxed"
                placeholder={"## Section heading\n\nParagraph text…\n\n- list item\n\n:::callout Title\ntext\n:::\n\n:::stat 42% | label"}
              />
            )}
          </TabsContent>

          <TabsContent value="meta" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug">
                <Input
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  placeholder="my-post-slug"
                />
              </Field>
              <Field label="Focus keyphrase">
                <Input
                  value={draft.keyphrase}
                  onChange={(e) => set("keyphrase", e.target.value)}
                  placeholder="e.g. site survey digitization"
                />
              </Field>
            </div>
            <Field label={`Meta description (${draft.description.length}/160)`}>
              <Textarea
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                className="min-h-20"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Input value={draft.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Tags (comma-separated)">
                <Input
                  value={draft.tags.join(", ")}
                  onChange={(e) =>
                    set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
                  }
                />
              </Field>
              <Field label="Author">
                <Select value={draft.author} onValueChange={(v) => set("author", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {authorSlugs.map((slug) => (
                      <SelectItem key={slug} value={slug}>{slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cover tone">
                <Select value={draft.coverTone} onValueChange={(v) => set("coverTone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COVER_TONES.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Published (YYYY-MM-DD)">
                <Input value={draft.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
              </Field>
              <Field label="Updated (optional)">
                <Input value={draft.updatedAt} onChange={(e) => set("updatedAt", e.target.value)} />
              </Field>
            </div>
            <Field label="Canonical URL (optional — overrides the default self-canonical)">
              <Input
                value={draft.canonical}
                onChange={(e) => set("canonical", e.target.value)}
                placeholder="https://GSoC Organizations.in/blog/post/original-slug"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.noindex} onCheckedChange={(v) => set("noindex", v)} />
              No-index this post (emits robots noindex + kept out of the sitemap; still reachable by URL)
            </label>
          </TabsContent>

          <TabsContent value="blocks" className="space-y-4">
            <Field label={`TL;DR — answer-first summary (${draft.tldr.length} chars)`}>
              <Textarea value={draft.tldr} onChange={(e) => set("tldr", e.target.value)} className="min-h-28" />
            </Field>
            <Field label="Key takeaways (one per line)">
              <Textarea
                value={draft.keyTakeaways.join("\n")}
                onChange={(e) => set("keyTakeaways", e.target.value.split("\n").filter((l) => l.trim()))}
                className="min-h-28"
              />
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>FAQs ({draft.faqs.length})</Label>
                <Button variant="outline" size="sm" onClick={() => set("faqs", [...draft.faqs, { q: "", a: "" }])}>
                  Add FAQ
                </Button>
              </div>
              {draft.faqs.map((faq, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label="Move FAQ up"
                        disabled={i === 0}
                        onClick={() => set("faqs", moveItem(draft.faqs, i, i - 1))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <IconChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move FAQ down"
                        disabled={i === draft.faqs.length - 1}
                        onClick={() => set("faqs", moveItem(draft.faqs, i, i + 1))}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <IconChevronDown className="size-4" />
                      </button>
                    </div>
                    <Input
                      value={faq.q}
                      placeholder="Question — phrased the way people ask it"
                      onChange={(e) =>
                        set("faqs", draft.faqs.map((f, j) => (j === i ? { ...f, q: e.target.value } : f)))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove FAQ"
                      onClick={() => set("faqs", draft.faqs.filter((_, j) => j !== i))}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={faq.a}
                    placeholder="Standalone answer (40–80 words)"
                    className="min-h-20"
                    onChange={(e) =>
                      set("faqs", draft.faqs.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)))
                    }
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Right: live preview + SEO checks */}
        <Tabs defaultValue="preview">
          <TabsList className="w-full">
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
            <TabsTrigger value="seo" className="flex-1">
              SEO checks
              <ScoreBadge score={score} compact />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className="max-h-[75vh] space-y-6 overflow-y-auto rounded-xl border bg-background p-6">
              <div>
                <Badge variant="secondary">{draft.category || "Category"}</Badge>
                <h1 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight">
                  {draft.title || "Untitled post"}
                </h1>
                <p className="mt-2 text-muted-foreground">{draft.description}</p>
              </div>
              {draft.tldr && <TldrBlock text={draft.tldr} />}
              <KeyTakeaways items={draft.keyTakeaways} />
              <PostBody sections={sections} />
              <FaqSection faqs={draft.faqs.filter((f) => f.q).map((f) => ({ question: f.q, answer: f.a }))} />
            </div>
          </TabsContent>

          <TabsContent value="seo">
            <div className="max-h-[75vh] space-y-5 overflow-y-auto rounded-xl border bg-background p-4">
              <SeoScoreMeter checks={checks} score={score} />
              <SerpPreview title={draft.title} slug={draft.slug} description={draft.description} />
              {(["seo", "geo", "structure", "readability"] as const).map((group) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group === "seo"
                      ? "Search"
                      : group === "geo"
                        ? "AI / GEO (answer-first + evidence)"
                        : group === "structure"
                          ? "Structure & AI blocks"
                          : "Readability"}
                  </p>
                  <ul className="space-y-1.5">
                    {checks.filter((c) => c.group === group).map((check) => (
                      <CheckRow key={check.id} check={check} />
                    ))}
                  </ul>
                </div>
              ))}

              <LinkSuggestions suggestions={linkSuggestions} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function LinkSuggestions({ suggestions }: { suggestions: LinkCandidate[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Internal links to add
      </p>
      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No suggestions — either everything relevant is already linked, or add more body text.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {suggestions.map((s) => (
            <li key={s.slug} className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
              <div>
                <p className="font-medium leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`[${s.title}](/blog/post/${s.slug})`);
                  setCopied(s.slug);
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                {copied === s.slug ? "Copied" : "Copy link"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ScoreBadge({ score, compact }: { score: number; compact?: boolean }) {
  // Traffic light: green ≥80, amber ≥55, red below.
  const tone =
    score >= 80 ? "bg-success text-white" : score >= 55 ? "bg-warning text-black" : "bg-destructive text-white";
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums", tone, compact && "ml-1")}>
      {score}
    </span>
  );
}

/** Traffic-light overview: a colored progress bar + pass/warn/fail counts. */
function SeoScoreMeter({ checks, score }: { checks: SeoCheck[]; score: number }) {
  const pass = checks.filter((c) => c.status === "pass").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const barColor = score >= 80 ? "bg-success" : score >= 55 ? "bg-warning" : "bg-destructive";
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">SEO / GEO score</span>
        <ScoreBadge score={score} />
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-success" />{pass} good</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />{warn} improve</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" />{fail} problems</span>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: SeoCheck }) {
  const style =
    check.status === "pass"
      ? { border: "border-l-success", icon: <IconCircleCheck className="size-4 shrink-0 text-success" /> }
      : check.status === "warn"
        ? { border: "border-l-warning", icon: <IconAlertTriangle className="size-4 shrink-0 text-warning" /> }
        : { border: "border-l-destructive", icon: <IconCircleX className="size-4 shrink-0 text-destructive" /> };
  return (
    <li className={cn("flex items-start gap-2 rounded-md border border-l-4 p-2 text-sm", style.border)}>
      {style.icon}
      <div>
        <p className="font-medium leading-tight">{check.label}</p>
        <p className="text-xs text-muted-foreground">{check.detail}</p>
      </div>
    </li>
  );
}

/** Google result preview — how the title/slug/description truncate in a SERP. */
function SerpPreview({ title, slug, description }: { title: string; slug: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">GSoC Organizations.in › blog › post › {slug || "slug"}</p>
      <p className="mt-1 truncate text-base font-medium text-primary">
        {title ? `${title} — GSoC Organizations Blog` : "Post title — GSoC Organizations Blog"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
        {description || "The meta description will appear here."}
      </p>
    </div>
  );
}
