import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { Faq, Post, PostBlock } from "./types";
import { estimateReadingMinutes, parseSections, slugify } from "./parse";

/**
 * Content loader — posts live as markdown files in content/posts/*.md
 * (format: docs/CONTENT-FORMAT.md). Server-only: uses fs.
 */

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

type Frontmatter = {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  featured?: boolean;
  draft?: boolean;
  cornerstone?: boolean;
  noindex?: boolean;
  canonical?: string;
  coverTone?: Post["coverTone"];
  ogImage?: string;
  tldr: string;
  keyTakeaways?: string[];
  faqs?: { q: string; a: string }[];
};

function loadPost(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;
  const faqs: Faq[] = (fm.faqs ?? []).map((f) => ({ question: f.q, answer: f.a }));

  return {
    slug,
    title: fm.title,
    description: fm.description,
    category: fm.category,
    tags: fm.tags ?? [],
    publishedAt: toIsoDate(fm.publishedAt),
    updatedAt: fm.updatedAt ? toIsoDate(fm.updatedAt) : undefined,
    readingMinutes: estimateReadingMinutes(content),
    featured: fm.featured,
    draft: fm.draft,
    cornerstone: fm.cornerstone,
    noindex: fm.noindex,
    canonical: fm.canonical,
    authorSlug: fm.author ?? "gsoc-orgs-team",
    coverTone: fm.coverTone ?? "primary",
    ogImage: fm.ogImage,
    tldr: fm.tldr,
    keyTakeaways: fm.keyTakeaways ?? [],
    sections: parseSections(content),
    faqs,
  };
}

/** gray-matter parses unquoted YAML dates into Date objects; normalize either form to YYYY-MM-DD. */
function toIsoDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

/** Today as YYYY-MM-DD (build date). String compare is safe for ISO dates. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * All published posts, newest first.
 * In production: excludes drafts AND future-dated posts (scheduled publishing).
 * In dev: shows everything so authors can preview drafts and scheduled posts.
 */
export const getAllPosts = cache((): Post[] => {
  const isProd = process.env.NODE_ENV === "production";
  const now = today();
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(loadPost)
    .filter((p) => !isProd || (!p.draft && p.publishedAt <= now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
});

/** Posts eligible for indexing (excludes noindex) — used by sitemap. */
export function getIndexablePosts(): Post[] {
  return getAllPosts().filter((p) => !p.noindex);
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** Raw markdown (frontmatter stripped) for the .md routes and copy-as-markdown. */
export function getRawMarkdown(slug: string): string | undefined {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return undefined;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const fm = data as Frontmatter;
  // Don't expose drafts or not-yet-published posts in production.
  if (process.env.NODE_ENV === "production" && (fm.draft || toIsoDate(fm.publishedAt) > today())) {
    return undefined;
  }
  const faqs = (fm.faqs ?? [])
    .map((f) => `### ${f.q}\n\n${f.a}`)
    .join("\n\n");
  return [
    `# ${fm.title}`,
    `> ${fm.tldr.trim()}`,
    content.trim(),
    faqs ? `## FAQs\n\n${faqs}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function getCategories(): string[] {
  return [...new Set(getAllPosts().map((p) => p.category))];
}

export function categoryToSlug(category: string): string {
  return slugify(category);
}

export function getCategoryBySlug(slug: string): string | undefined {
  return getCategories().find((c) => categoryToSlug(c) === slug);
}

export function getAllTags(): string[] {
  return [...new Set(getAllPosts().flatMap((p) => p.tags))].sort();
}

export function tagToSlug(tag: string): string {
  return slugify(tag);
}

export function getTagBySlug(slug: string): string | undefined {
  return getAllTags().find((t) => tagToSlug(t) === slug);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getPostsByAuthor(authorSlug: string): Post[] {
  return getAllPosts().filter((p) => p.authorSlug === authorSlug);
}

/** Related = same category first, then shared tags. */
export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = getPost(slug);
  if (!current) return [];
  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score:
        (p.category === current.category ? 2 : 0) +
        p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.post);
}

/** Posts per page on paginated listings. */
export const POSTS_PER_PAGE = 6;

export type Paged<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
};

/** Slice a post list into a page. `page` is 1-indexed. */
export function paginate<T>(items: T[], page: number, perPage = POSTS_PER_PAGE): Paged<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: clamped, totalPages, total };
}

/** All image srcs used in a post body (for ImageObject + image sitemap). */
export function getPostImages(post: Post): { src: string; alt: string; caption?: string }[] {
  return post.sections.flatMap((s) =>
    s.blocks.filter((b) => b.type === "image").map((b) => (b.type === "image" ? b : null)),
  ).filter((b): b is Extract<PostBlock, { type: "image" }> => b !== null);
}

/**
 * Flat, plain-text search records for the client index (Fuse.js).
 * Body text is flattened so search matches inside sections too.
 */
export function getSearchIndex(): SearchRecord[] {
  return getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags,
    tldr: post.tldr,
    body: post.sections
      .flatMap((s) => [
        s.heading,
        ...s.blocks.map((b) =>
          b.type === "paragraph" || b.type === "callout"
            ? "text" in b
              ? b.text
              : ""
            : b.type === "list"
              ? b.items.join(" ")
              : "",
        ),
      ])
      .join(" ")
      .slice(0, 2000),
  }));
}

export type SearchRecord = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  tldr: string;
  body: string;
};
