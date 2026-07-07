import { PostCard } from "@/components/blog/post-card";
import type { Post } from "@/lib/blog/types";

/** Standard responsive card grid, reused by every listing surface. */
export function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">No articles here yet.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
