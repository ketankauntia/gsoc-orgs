"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconCheck, IconDeviceFloppy, IconEye } from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import { cn } from "@/lib/utils";
import {
  BLOG_TEMPLATES,
  POST_TEMPLATES,
  type BlogTemplate,
  type PostTemplate,
  type SiteSettings,
} from "@/lib/settings-shared";

const BLOG_META: Record<BlogTemplate, { name: string; blurb: string }> = {
  classic: { name: "Classic", blurb: "Featured card on top, clean card grid below. The all-rounder." },
  magazine: { name: "Magazine", blurb: "Full-width cover hero, editorial secondary stories, compact list." },
  minimal: { name: "Minimal", blurb: "Text-first list. No imagery — titles and ideas do the talking." },
};

const POST_META: Record<PostTemplate, { name: string; blurb: string }> = {
  standard: { name: "Standard", blurb: "Reading column with a sticky TOC + actions sidebar." },
  centered: { name: "Centered", blurb: "One distraction-free centered column. TOC inline." },
  hero: { name: "Hero", blurb: "Full-width cover banner with overlaid title, then a centered column." },
};

export function SettingsClient({ initial, canSave }: { initial: SiteSettings; canSave: boolean }) {
  const router = useRouter();
  const [blogTemplate, setBlogTemplate] = useState<BlogTemplate>(initial.blogTemplate);
  const [postTemplate, setPostTemplate] = useState<PostTemplate>(initial.postTemplate);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const dirty = blogTemplate !== initial.blogTemplate || postTemplate !== initial.postTemplate;

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/editor/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogTemplate, postTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setState("saved");
      setMessage("Saved — the blog now uses these templates.");
      router.refresh();
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="size-4" /> Dashboard
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Choose how the blog and posts are laid out. Preview any post/page after saving.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/preview">
              <IconEye className="size-4" />
              Preview themes
            </Link>
          </Button>
          <Button onClick={save} disabled={!canSave || !dirty || state === "saving"}>
            <IconDeviceFloppy className="size-4" />
            {state === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {!canSave && (
        <p className="mt-2 text-sm text-muted-foreground">Read-only: settings can be changed in development only.</p>
      )}
      {state === "saved" && <p className="mt-2 text-sm text-success">{message}</p>}
      {state === "error" && <p className="mt-2 text-sm text-destructive">{message}</p>}

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Blog listing template</h2>
        <p className="text-sm text-muted-foreground">Layout of /blog and its pagination pages.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {BLOG_TEMPLATES.map((t) => (
            <TemplateCard
              key={t}
              name={BLOG_META[t].name}
              blurb={BLOG_META[t].blurb}
              selected={blogTemplate === t}
              onSelect={() => setBlogTemplate(t)}
            >
              <BlogThumb template={t} />
            </TemplateCard>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Post template</h2>
        <p className="text-sm text-muted-foreground">Layout of individual article pages.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {POST_TEMPLATES.map((t) => (
            <TemplateCard
              key={t}
              name={POST_META[t].name}
              blurb={POST_META[t].blurb}
              selected={postTemplate === t}
              onSelect={() => setPostTemplate(t)}
            >
              <PostThumb template={t} />
            </TemplateCard>
          ))}
        </div>
      </section>
    </main>
  );
}

function TemplateCard({
  name,
  blurb,
  selected,
  onSelect,
  children,
}: {
  name: string;
  blurb: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border bg-card p-3 text-left transition-all hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <div className="relative overflow-hidden rounded-lg border bg-background p-2">
        {children}
        {selected && (
          <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-3.5" />
          </span>
        )}
      </div>
      <p className="mt-2.5 font-heading text-sm font-semibold">{name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
    </button>
  );
}

/* ---------- CSS mockup thumbnails ---------- */

function BlogThumb({ template }: { template: BlogTemplate }) {
  if (template === "magazine") {
    return (
      <div className="space-y-1.5">
        <div className="flex h-14 items-end rounded bg-primary/70 p-1.5">
          <div className="h-2 w-2/3 rounded-sm bg-background/90" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-8 rounded bg-muted" />
          <div className="h-8 rounded bg-muted" />
        </div>
        <div className="space-y-1">
          <div className="h-3 rounded bg-muted/70" />
          <div className="h-3 rounded bg-muted/70" />
        </div>
      </div>
    );
  }
  if (template === "minimal") {
    return (
      <div className="space-y-2 py-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1 border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <div className="h-1.5 w-1/4 rounded-sm bg-muted" />
            <div className="h-2.5 w-4/5 rounded-sm bg-foreground/60" />
            <div className="h-1.5 w-3/5 rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex h-10 gap-1.5 rounded bg-muted p-1.5">
        <div className="w-2/5 rounded-sm bg-primary/60" />
        <div className="flex-1 space-y-1 pt-0.5">
          <div className="h-2 rounded-sm bg-foreground/50" />
          <div className="h-1.5 w-2/3 rounded-sm bg-muted-foreground/40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

function PostThumb({ template }: { template: PostTemplate }) {
  if (template === "centered") {
    return (
      <div className="flex justify-center py-1">
        <div className="w-3/5 space-y-1.5">
          <div className="h-2.5 rounded-sm bg-foreground/60" />
          <div className="h-8 rounded bg-primary/60" />
          <div className="h-1.5 rounded-sm bg-muted" />
          <div className="h-1.5 rounded-sm bg-muted" />
          <div className="h-1.5 w-3/4 rounded-sm bg-muted" />
        </div>
      </div>
    );
  }
  if (template === "hero") {
    return (
      <div className="space-y-1.5">
        <div className="flex h-10 items-end rounded bg-primary/70 p-1.5">
          <div className="h-2 w-1/2 rounded-sm bg-background/90" />
        </div>
        <div className="flex justify-center">
          <div className="w-3/5 space-y-1">
            <div className="h-1.5 rounded-sm bg-muted" />
            <div className="h-1.5 rounded-sm bg-muted" />
            <div className="h-1.5 w-3/4 rounded-sm bg-muted" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-1.5 py-1">
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-4/5 rounded-sm bg-foreground/60" />
        <div className="h-7 rounded bg-primary/60" />
        <div className="h-1.5 rounded-sm bg-muted" />
        <div className="h-1.5 w-5/6 rounded-sm bg-muted" />
      </div>
      <div className="w-1/4 space-y-1">
        <div className="h-1.5 rounded-sm bg-muted" />
        <div className="h-1.5 rounded-sm bg-muted" />
        <div className="h-1.5 rounded-sm bg-muted" />
      </div>
    </div>
  );
}
