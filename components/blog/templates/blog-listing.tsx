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

export function BlogListingHeader({
  page,
  totalPages,
}: {
  page?: number;
  totalPages?: number;
}) {
  const pageLabel =
    page && totalPages ? `Archive page ${page} of ${totalPages}` : "Research notes";

  return (
    <header className="atlas-corner-marks relative mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink text-[#f5eee9]">
      <div
        aria-hidden="true"
        className="atlas-grid absolute inset-0 text-white opacity-20 [mask-image:linear-gradient(to_bottom_right,black,transparent_72%)]"
      />
      <div className="relative grid lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.65fr)]">
        <div className="px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <p className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.2em] text-[#aaa29d]">
            <span aria-hidden="true" className="size-2 bg-primary" />
            {pageLabel}
          </p>
          <h1 className="mt-5 max-w-3xl text-[clamp(2.75rem,6vw,5.75rem)] font-medium leading-[0.92] tracking-[-0.055em] text-balance">
            Field notes for navigating GSoC.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#c8c0bb] sm:text-lg">
            Practical guides for comparing organizations, reading project
            history, and doing the research that comes before a strong
            application.
          </p>
        </div>

        <div className="border-t border-white/10 bg-white/[0.025] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-9 lg:py-12">
          <p className="font-data text-[10px] uppercase tracking-[0.18em] text-[#7e7773]">
            Guide index
          </p>
          <ol className="mt-5 divide-y divide-white/10">
            {[
              "Organization research",
              "Project history",
              "Proposal preparation",
            ].map((label, index) => (
              <li
                key={label}
                className="flex items-center gap-4 py-4 text-sm text-[#d8d0cb]"
              >
                <span className="font-data text-[10px] text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}

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
    <div className="space-y-8">
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
    <div className="space-y-10">
      {hero && (
        <Link
          href={`/blog/post/${hero.slug}`}
          className="group relative block overflow-hidden rounded-[1.25rem] bg-ink shadow-[0_1px_1px_rgb(23_22_21/0.04),0_16px_40px_rgb(23_22_21/0.08)] ring-1 ring-black/10 dark:ring-white/10"
        >
          <PostCover post={hero} className="h-80 sm:h-[28rem]" />
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-[#171615]/95 via-[#171615]/62 to-transparent p-6 text-[#f5eee9] sm:p-9">
            <Badge variant="secondary" className="w-fit">{hero.category}</Badge>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold leading-[1.02] tracking-[-0.035em] transition-colors duration-[180ms] group-hover:text-primary sm:text-5xl">
              {hero.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c8c0bb] sm:text-base">{hero.description}</p>
            <MetaLine post={hero} className="mt-4 [&_*]:text-[#d8d0cb]" />
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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/post/${post.slug}`}
              className="group flex items-center gap-4 border-b border-border p-4 transition-colors duration-[180ms] last:border-b-0 hover:bg-accent/55 sm:p-5"
            >
              <PostCover
                post={post}
                className="h-20 w-28 shrink-0 rounded-lg ring-1 ring-black/10 dark:ring-white/10 sm:w-32"
              />
              <div className="min-w-0">
                <p className="truncate font-heading font-semibold transition-colors duration-[180ms] group-hover:text-primary">{post.title}</p>
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/post/${post.slug}`}
          className="group block border-b border-border px-5 py-7 transition-colors duration-[180ms] last:border-b-0 hover:bg-accent/45 sm:px-7"
        >
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
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.025em] transition-colors duration-[180ms] group-hover:text-primary sm:text-2xl">
            {post.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{post.description}</p>
          <p className="mt-3 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{getAuthor(post.authorSlug).name}</p>
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
