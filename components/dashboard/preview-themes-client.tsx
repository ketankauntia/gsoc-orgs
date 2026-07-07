"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowBackUp,
  IconArrowLeft,
  IconCheck,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/blog-ui/select";
import {
  BLOG_TEMPLATES,
  POST_TEMPLATES,
  type BlogTemplate,
  type PostTemplate,
  type SiteSettings,
} from "@/lib/settings-shared";

const LABELS: Record<string, string> = {
  classic: "Classic",
  magazine: "Magazine",
  minimal: "Minimal",
  standard: "Standard",
  centered: "Centered",
  hero: "Hero",
};

/**
 * Theme preview: template pickers apply instantly (dev-only settings API), the iframe below
 * shows the REAL site — navigate to any route inside it. Keep = done; Revert = restore snapshot.
 */
export function PreviewThemesClient({
  initial,
  posts,
  canSave,
}: {
  initial: SiteSettings;
  posts: { slug: string; title: string }[];
  canSave: boolean;
}) {
  const router = useRouter();
  // Snapshot of what was saved when the page opened — Revert restores this.
  const snapshot = useRef<SiteSettings>(initial);
  const [current, setCurrent] = useState<SiteSettings>(initial);
  const [route, setRoute] = useState("/blog");
  const [frameKey, setFrameKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    current.blogTemplate !== snapshot.current.blogTemplate ||
    current.postTemplate !== snapshot.current.postTemplate;

  async function apply(next: SiteSettings) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/editor/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not apply");
      setCurrent(next);
      setFrameKey((k) => k + 1); // reload the frame with the new template
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply");
    } finally {
      setBusy(false);
    }
  }

  async function keep() {
    snapshot.current = current;
    router.push("/dashboard/settings");
    router.refresh();
  }

  async function revert() {
    await apply(snapshot.current);
  }

  function go(path: string) {
    setRoute(path);
    setFrameKey((k) => k + 1);
  }

  return (
    <main className="flex w-full flex-1 flex-col">
      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-shell flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            Settings
          </Link>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Blog
            <Select
              value={current.blogTemplate}
              onValueChange={(v) => apply({ ...current, blogTemplate: v as BlogTemplate })}
              disabled={!canSave || busy}
            >
              <SelectTrigger size="sm" className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOG_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Post
            <Select
              value={current.postTemplate}
              onValueChange={(v) => apply({ ...current, postTemplate: v as PostTemplate })}
              disabled={!canSave || busy}
            >
              <SelectTrigger size="sm" className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {POST_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            View
            <Select value={route} onValueChange={go}>
              <SelectTrigger size="sm" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="/blog">Blog home</SelectItem>
                <SelectItem value="/blog/page/2">Blog — page 2</SelectItem>
                {posts.map((p) => (
                  <SelectItem key={p.slug} value={`/blog/post/${p.slug}`}>
                    Post: {p.title.length > 40 ? p.title.slice(0, 40) + "…" : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button variant="ghost" size="icon" aria-label="Reload frame" onClick={() => setFrameKey((k) => k + 1)}>
            <IconRefresh className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Open in new tab" asChild>
            <a href={route} target="_blank" rel="noreferrer">
              <IconExternalLink className="size-4" />
            </a>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {error && <span className="text-xs text-destructive">{error}</span>}
            {!canSave && <span className="text-xs text-muted-foreground">Read-only outside dev</span>}
            <Button variant="outline" size="sm" onClick={revert} disabled={!canSave || !dirty || busy}>
              <IconArrowBackUp className="size-4" />
              Revert
            </Button>
            <Button size="sm" onClick={keep} disabled={!canSave || busy}>
              <IconCheck className="size-4" />
              {dirty ? "Keep this theme" : "Done"}
            </Button>
          </div>
        </div>
      </div>

      {/* Live site frame — fully navigable (same origin, X-Frame-Options: SAMEORIGIN allows it) */}
      <iframe
        key={frameKey}
        src={route}
        title="Site preview"
        className="w-full flex-1 border-0 bg-background"
      />
    </main>
  );
}
