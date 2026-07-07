import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { PostEditor, type EditablePost } from "@/components/editor/post-editor";
import { authors } from "@/lib/blog/authors";

export const metadata: Metadata = {
  title: "Post Editor - GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

function loadEditablePosts(): EditablePost[] {
  const dir = path.join(process.cwd(), "content", "posts");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: (data.title as string) ?? "",
        description: (data.description as string) ?? "",
        category: (data.category as string) ?? "",
        tags: (data.tags as string[]) ?? [],
        publishedAt: normalizeDate(data.publishedAt),
        updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : "",
        author: (data.author as string) ?? "gsoc-orgs-team",
        featured: Boolean(data.featured),
        draft: Boolean(data.draft),
        cornerstone: Boolean(data.cornerstone),
        noindex: Boolean(data.noindex),
        canonical: (data.canonical as string) ?? "",
        coverTone: (data.coverTone as string) ?? "primary",
        keyphrase: (data.keyphrase as string) ?? "",
        tldr: ((data.tldr as string) ?? "").trim(),
        keyTakeaways: (data.keyTakeaways as string[]) ?? [],
        faqs: (data.faqs as { q: string; a: string }[]) ?? [],
        body: content.trim(),
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { slug } = await searchParams;
  return (
    <PostEditor
      posts={loadEditablePosts()}
      authorSlugs={authors.map((a) => a.slug)}
      canSave={process.env.NODE_ENV === "development"}
      initialSlug={slug}
    />
  );
}
