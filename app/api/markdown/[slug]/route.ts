import { getAllPosts, getRawMarkdown } from "@/lib/blog/content";

export const dynamic = "force-static";
// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** Serves the raw-markdown version of a post. Public URL is /blog/post/<slug>.md via a rewrite in next.config.ts. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const markdown = getRawMarkdown(slug);
  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Crawlable for LLMs, but not an indexable duplicate of the HTML post.
      "X-Robots-Tag": "noindex",
    },
  });
}
