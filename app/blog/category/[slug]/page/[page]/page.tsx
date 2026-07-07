import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PostGrid } from "@/components/blog/post-grid";
import { Pagination } from "@/components/blog/pagination";
import { CategoryChips } from "@/components/blog/category-chips";
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

/** Pages 2..N per category; page 1 is /blog/category/[slug]. */
export function generateStaticParams() {
  return getCategories().flatMap((category) => {
    const count = getAllPosts().filter((p) => p.category === category).length;
    const { totalPages } = paginate(new Array(count), 1);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug: categoryToSlug(category),
      page: String(i + 2),
    }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category} — Page ${page} — GSoC Organizations Blog`,
    description: `Articles on ${category.toLowerCase()}, page ${page}.`,
    alternates: { canonical: `/blog/category/${slug}/page/${page}` },
  };
}

export default async function CategoryPaginatedPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound();
  if (pageNum === 1) redirect(`/blog/category/${slug}`);

  const categories = getCategories().map((c) => ({ label: c, slug: categoryToSlug(c) }));
  const posts = getAllPosts().filter((p) => p.category === category);
  const { items, totalPages, page: current } = paginate(posts, pageNum);
  if (current !== pageNum) notFound();

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <PostBreadcrumbs
        trail={[
          { label: "Blog", href: "/blog" },
          { label: category, href: `/blog/category/${slug}` },
          { label: `Page ${pageNum}` },
        ]}
      />
      <header className="mt-6 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{category}</h1>
        <p className="mt-2 text-muted-foreground">Page {pageNum} of {totalPages}</p>
      </header>

      <CategoryChips categories={categories} activeSlug={slug} />

      <div className="mt-8">
        <PostGrid posts={items} />
      </div>

      <Pagination basePath={`/blog/category/${slug}`} page={pageNum} totalPages={totalPages} />
    </main>
  );
}
