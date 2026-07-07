import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { estimateReadingMinutes, parseSections } from "@/lib/blog/parse";
import { runSeoChecks, seoScore } from "@/lib/editor/seo-checks";
import { getAuthor } from "@/lib/blog/authors";

export type PostStatus = "published" | "draft" | "scheduled";

export type PostRow = {
  slug: string;
  title: string;
  category: string;
  author: string;
  authorName: string;
  status: PostStatus;
  publishedAt: string;
  updatedAt: string;
  featured: boolean;
  cornerstone: boolean;
  noindex: boolean;
  words: number;
  readingMinutes: number;
  seoScore: number;
  descriptionLength: number;
  faqCount: number;
  hasImage: boolean;
  hasKeyphrase: boolean;
};

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}

/** Reads every post (drafts + scheduled included) with the metrics a writer / owner / SEO would want. */
export function loadPostRows(): PostRow[] {
  const dir = path.join(process.cwd(), "content", "posts");
  const today = new Date().toISOString().slice(0, 10);

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file): PostRow => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const slug = file.replace(/\.md$/, "");
      const publishedAt = toIso(data.publishedAt);
      const updatedAt = data.updatedAt ? toIso(data.updatedAt) : "";
      const faqs = (data.faqs as { q: string; a: string }[]) ?? [];
      const words = content.split(/\s+/).filter(Boolean).length;

      const status: PostStatus = data.draft
        ? "draft"
        : publishedAt > today
          ? "scheduled"
          : "published";

      const checks = runSeoChecks({
        title: (data.title as string) ?? "",
        description: (data.description as string) ?? "",
        slug,
        keyphrase: (data.keyphrase as string) ?? "",
        tldr: ((data.tldr as string) ?? "").trim(),
        keyTakeaways: (data.keyTakeaways as string[]) ?? [],
        faqs,
        tags: (data.tags as string[]) ?? [],
        body: content,
        updatedAt: updatedAt || publishedAt,
        cornerstone: Boolean(data.cornerstone),
      });

      return {
        slug,
        title: (data.title as string) ?? slug,
        category: (data.category as string) ?? "—",
        author: (data.author as string) ?? "gsoc-orgs-team",
        authorName: getAuthor((data.author as string) ?? "gsoc-orgs-team").name,
        status,
        publishedAt,
        updatedAt,
        featured: Boolean(data.featured),
        cornerstone: Boolean(data.cornerstone),
        noindex: Boolean(data.noindex),
        words,
        readingMinutes: estimateReadingMinutes(content),
        seoScore: seoScore(checks),
        descriptionLength: ((data.description as string) ?? "").length,
        faqCount: faqs.length,
        hasImage: parseSections(content).some((s) => s.blocks.some((b) => b.type === "image")),
        hasKeyphrase: Boolean((data.keyphrase as string)?.trim()),
      };
    })
    .sort((a, b) => (b.updatedAt || b.publishedAt).localeCompare(a.updatedAt || a.publishedAt));
}
