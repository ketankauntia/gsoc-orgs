import { MoveRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostCover } from "@/components/blog/post-cover";
import { getAllPosts } from "@/lib/blog/content";

export function LatestArticles() {
  const posts = getAllPosts().slice(0, 4);
  if (posts.length === 0) return null;
  return (
    <section className="w-full py-12 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="flex flex-col gap-14">
          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-medium text-primary">From the blog</p><h2 className="mt-2 max-w-xl text-3xl tracking-tighter md:text-5xl">Latest articles</h2></div>
            <Button asChild className="w-fit gap-4"><Link href="/blog">View all articles <MoveRight className="size-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((post) => <Link key={post.slug} href={`/blog/post/${post.slug}`} className="group flex flex-col gap-2 transition-opacity hover:opacity-80"><PostCover post={post} decorative sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw" className="mb-4 aspect-video w-full" /><p className="text-xs font-medium text-primary">{post.category}</p><h3 className="text-xl tracking-tight group-hover:underline">{post.title}</h3><p className="line-clamp-3 text-base text-muted-foreground">{post.description}</p></Link>)}
          </div>
        </div>
      </div>
    </section>
  );
}
