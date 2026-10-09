import "server-only";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { PostCover } from "@/components/blog/post-cover";
import { getAllPosts } from "@/lib/blog/content";
import type { Post } from "@/lib/blog/types";
import { Eyebrow } from "./ui";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Posts for a page. With a year: posts whose title, tags or category name that year first,
 * then general GSoC posts (newest first) to fill the row. Never repeats a post.
 */
export function pickPosts({ year, limit = 4 }: { year?: number; limit?: number } = {}): Post[] {
  const posts = getAllPosts().filter((post) => !post.noindex);
  if (!year) return posts.slice(0, limit);
  const mentions = (post: Post) => [post.title, post.category, ...post.tags].some((text) => text.includes(String(year)));
  const otherYear = (post: Post) => /\b20\d\d\b/.test([post.title, ...post.tags].join(" ")) && !mentions(post);
  const forYear = posts.filter(mentions);
  const general = posts.filter((post) => !mentions(post) && !otherYear(post));
  return [...forYear, ...general].slice(0, limit);
}

export function PostCards({ posts, eyebrow, title, quiet, id }: { posts: Post[]; eyebrow: string; title: string; quiet?: string; id: string }) {
  if (!posts.length) return null;
  return (
    <section className="cb-posts" aria-labelledby={id}>
      <div className="cb-related-head cb-section-head">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={id}>{title}{quiet ? <> <span className="cb-quiet">{quiet}</span></> : null}</h2>
        </div>
        <Link href="/blog" className="cb-text-link">All articles <IconArrowRight size={16} stroke={2} aria-hidden /></Link>
      </div>
      <ul className="cb-post-grid">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="cb-post-card">
              <PostCover post={post} decorative className="cb-post-cover" sizes="(max-width: 760px) 100vw, (max-width: 1180px) 50vw, 25vw" />
              <div className="cb-post-body">
                <p className="cb-post-meta"><span>{post.category}</span><span>{post.readingMinutes} min read</span></p>
                <h3><Link href={`/blog/post/${post.slug}`} className="cb-row-link">{post.title}</Link></h3>
                <p className="cb-post-desc">{post.description}</p>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
