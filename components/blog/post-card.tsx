import Link from "next/link";
import { IconClock } from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { cn } from "@/lib/utils";
import { getAuthor } from "@/lib/blog/authors";
import type { Post } from "@/lib/blog/types";
import { PostCover } from "./post-cover";
import { formatDate } from "@/lib/blog/format";

/** Card used on the index grid, featured slot, and related-posts rail. */
export function PostCard({
  post,
  featured = false,
  className,
}: {
  post: Post;
  featured?: boolean;
  className?: string;
}) {
  const author = getAuthor(post.authorSlug);

  return (
    <Link
      href={`/blog/post/${post.slug}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40",
        featured && "md:flex-row md:items-stretch md:gap-6 md:p-5",
        className,
      )}
    >
      <PostCover
        post={post}
        className={cn("h-40 shrink-0", featured && "md:h-auto md:w-2/5")}
      />
      <div className="flex flex-1 flex-col gap-2">
        {featured && <Badge variant="secondary">Featured</Badge>}
        <h3
          className={cn(
            "font-heading font-semibold leading-snug tracking-tight group-hover:text-primary",
            featured ? "text-xl md:text-2xl" : "text-lg",
          )}
        >
          {post.title}
        </h3>
        <p className={cn("text-sm text-muted-foreground", featured ? "line-clamp-3" : "line-clamp-2")}>
          {post.description}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{author.name}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <IconClock className="size-3.5" />
            {post.readingMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
