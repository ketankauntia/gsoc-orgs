import Link from "next/link";
import { IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { PostCard } from "@/components/blog/post-card";
import { PostGrid } from "@/components/blog/post-grid";
import { PostCover } from "@/components/blog/post-cover";
import { getAuthor } from "@/lib/blog/authors";
import { formatDate } from "@/lib/blog/format";
import type { Post } from "@/lib/blog/types";
import type { BlogTemplate } from "@/lib/settings";

/**
 * Listing layout templates for /blog (+ pagination). Pick via /dashboard/settings.
 * - classic: featured hero card + card grid (the original)
 * - magazine: full-width cover hero + editorial split of secondary/compact stories
 * - minimal: text-first list rows, no imagery
 */
export function BlogListing({
  template,
  posts,
  isFirstPage,
}: {
  template: BlogTemplate;
  posts: Post[];
  isFirstPage: boolean;
}) {
  if (template === "magazine") return <MagazineListing posts={posts} isFirstPage={isFirstPage} />;
  if (template === "minimal") return <MinimalListing posts={posts} />;
  return <ClassicListing posts={posts} isFirstPage={isFirstPage} />;
}

/* ---------- classic (original) ---------- */

function ClassicListing({ posts, isFirstPage }: { posts: Post[]; isFirstPage: boolean }) {
  const featured = isFirstPage ? posts.find((p) => p.featured) : undefined;
  const rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;
  return (
    <div className="space-y-6">
      {featured && <PostCard post={featured} featured />}
      <PostGrid posts={rest} />
    </div>
  );
}

/* ---------- magazine ---------- */

function MagazineListing({ posts, isFirstPage }: { posts: Post[]; isFirstPage: boolean }) {
  if (posts.length === 0) return <PostGrid posts={posts} />;
  const hero = isFirstPage ? posts[0] : undefined;
  const others = isFirstPage ? posts.slice(1) : posts;
  const secondary = others.slice(0, 2);
  const rest = others.slice(2);

  return (
    <div className="space-y-8">
      {hero && (
        <Link href={`/blog/post/${hero.slug}`} className="group relative block overflow-hidden rounded-xl">
          <PostCover post={hero} className="h-72 sm:h-96" />
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-background/95 via-background/60 to-transparent p-6 sm:p-8">
            <Badge variant="secondary" className="w-fit">{hero.category}</Badge>
            <h2 className="mt-2 max-w-3xl font-heading text-2xl font-bold leading-tight tracking-tight group-hover:text-primary sm:text-4xl">
              {hero.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{hero.description}</p>
            <MetaLine post={hero} className="mt-3" />
          </div>
        </Link>
      )}

      {secondary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {secondary.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="divide-y rounded-xl border">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/post/${post.slug}`}
              className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent/40"
            >
              <PostCover post={post} className="h-20 w-32 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-heading font-semibold group-hover:text-primary">{post.title}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{post.description}</p>
                <MetaLine post={post} className="mt-1.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- minimal ---------- */

function MinimalListing({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return <PostGrid posts={posts} />;
  return (
    <div className="divide-y">
      {posts.map((post) => (
        <Link key={post.slug} href={`/blog/post/${post.slug}`} className="group block py-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt} className="tabular-nums">{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.category}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <IconClock className="size-3.5" />
              {post.readingMinutes} min
            </span>
          </div>
          <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight group-hover:text-primary sm:text-2xl">
            {post.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">{post.description}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{getAuthor(post.authorSlug).name}</p>
        </Link>
      ))}
    </div>
  );
}

/* ---------- shared ---------- */

function MetaLine({ post, className }: { post: Post; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${className ?? ""}`}>
      <span className="font-medium text-foreground">{getAuthor(post.authorSlug).name}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <IconClock className="size-3.5" />
        {post.readingMinutes} min
      </span>
    </div>
  );
}
