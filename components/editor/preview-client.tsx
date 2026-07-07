"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { Separator } from "@/components/blog-ui/separator";
import { FaqSection } from "@/components/blog/faq-section";
import { KeyTakeaways } from "@/components/blog/key-takeaways";
import { PostBody } from "@/components/blog/post-body";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import { PostCover } from "@/components/blog/post-cover";
import { TldrBlock } from "@/components/blog/tldr-block";
import { parseSections, estimateReadingMinutes } from "@/lib/blog/parse";
import type { EditablePost } from "@/components/editor/post-editor";

/** Renders the editor's autosaved draft exactly as the live post page would. */
export function PreviewClient() {
  const params = useSearchParams();
  const key = params.get("key") ?? "__new__";
  const [draft, setDraft] = useState<EditablePost | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`be-editor:autosave:${key === "__new__" ? "__new__" : key}`);
      if (raw) setDraft(JSON.parse(raw) as EditablePost);
    } catch {
      /* ignore */
    }
  }, [key]);

  const sections = useMemo(() => (draft ? parseSections(draft.body) : []), [draft]);

  if (!draft) {
    return (
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-16 text-center text-muted-foreground">
        No draft to preview. Open this from the editor&apos;s <strong>Preview</strong> button.
      </main>
    );
  }

  const coverTone = (["primary", "chart-2", "chart-3", "chart-5"].includes(draft.coverTone)
    ? draft.coverTone
    : "primary") as "primary" | "chart-2" | "chart-3" | "chart-5";
  const readingMinutes = estimateReadingMinutes(draft.body);

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-content rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2 text-center text-xs text-muted-foreground">
        Preview mode — this is a live draft, not a published page.
      </div>

      <PostBreadcrumbs
        trail={[{ label: "Blog", href: "/blog" }, { label: draft.category || "Category" }, { label: draft.title || "Untitled" }]}
      />

      <div className="mx-auto mt-6 max-w-content">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{draft.category || "Category"}</Badge>
          {draft.draft && <Badge variant="destructive">Draft</Badge>}
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {draft.title || "Untitled post"}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{draft.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {draft.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <IconCalendar className="size-4" />
              {draft.publishedAt}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <IconClock className="size-4" />
            {readingMinutes} min read
          </span>
        </div>

        <article className="mt-8 space-y-8">
          <PostCover post={{ coverTone, category: draft.category || "Category" }} className="h-56 sm:h-72" />
          {draft.tldr && <TldrBlock text={draft.tldr} />}
          <KeyTakeaways items={draft.keyTakeaways} />
          <PostBody sections={sections} />
          <Separator />
          <FaqSection faqs={draft.faqs.filter((f) => f.q).map((f) => ({ question: f.q, answer: f.a }))} />
        </article>
      </div>
    </main>
  );
}
