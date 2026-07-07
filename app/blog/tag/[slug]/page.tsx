import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import { PostGrid } from "@/components/blog/post-grid";
import { ListingJsonLd } from "@/components/blog/listing-json-ld";
import { getAllTags, getPostsByTag, getTagBySlug, tagToSlug } from "@/lib/blog/content";
import { features } from "@/lib/features";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export function generateStaticParams() {
  if (!features.tagPages) return [];
  return getAllTags().map((tag) => ({ slug: tagToSlug(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: `#${tag} — GSoC Organizations Blog`,
    description: `Articles tagged "${tag}" on the GSoC Organizations Blog.`,
    alternates: { canonical: `/blog/tag/${slug}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!features.tagPages) notFound();
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) notFound();

  const posts = getPostsByTag(tag);

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <ListingJsonLd posts={posts} name={`#${tag}`} />
      <PostBreadcrumbs trail={[{ label: "Blog", href: "/blog" }, { label: `#${tag}` }]} />
      <header className="mt-6 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">#{tag}</h1>
        <p className="mt-2 text-muted-foreground">
          {posts.length} article{posts.length === 1 ? "" : "s"} with this tag.
        </p>
      </header>
      <div className="mt-8">
        <PostGrid posts={posts} />
      </div>
    </main>
  );
}
