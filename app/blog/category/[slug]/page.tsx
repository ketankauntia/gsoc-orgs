import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/post-grid";
import { Pagination } from "@/components/blog/pagination";
import { CategoryChips } from "@/components/blog/category-chips";
import { ListingJsonLd } from "@/components/blog/listing-json-ld";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import {
  categoryToSlug,
  getAllPosts,
  getCategories,
  getCategoryBySlug,
  paginate,
} from "@/lib/blog/content";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: categoryToSlug(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category} — GSoC Organizations Blog`,
    description: `Articles on ${category.toLowerCase()} from the GSoC Organizations Blog.`,
    alternates: { canonical: `/blog/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categories = getCategories().map((c) => ({ label: c, slug: categoryToSlug(c) }));
  const posts = getAllPosts().filter((p) => p.category === category);
  const { items, totalPages } = paginate(posts, 1);

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <ListingJsonLd posts={posts} name={category} />
      <PostBreadcrumbs trail={[{ label: "Blog", href: "/blog" }, { label: category }]} />
      <header className="mt-6 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{category}</h1>
        <p className="mt-2 text-muted-foreground">
          {posts.length} article{posts.length === 1 ? "" : "s"} in this category.
        </p>
      </header>

      <CategoryChips categories={categories} activeSlug={slug} />

      <div className="mt-8">
        <PostGrid posts={items} />
      </div>

      <Pagination basePath={`/blog/category/${slug}`} page={1} totalPages={totalPages} />
    </main>
  );
}
