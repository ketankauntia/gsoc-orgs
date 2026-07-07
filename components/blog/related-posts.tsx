import type { Post } from "@/lib/blog/types";
import { PostCard } from "./post-card";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-label="Related articles">
      <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight">Keep reading</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
