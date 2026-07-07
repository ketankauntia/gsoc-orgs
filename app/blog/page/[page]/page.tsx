import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Pagination } from "@/components/blog/pagination";
import { CategoryChips } from "@/components/blog/category-chips";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import { BlogListing } from "@/components/blog/templates/blog-listing";
import { categoryToSlug, getAllPosts, getCategories, paginate } from "@/lib/blog/content";
import { getSettings } from "@/lib/settings";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

/** Pre-render pages 2..N; page 1 lives at /blog. */
export function generateStaticParams() {
  const featured = getAllPosts().find((p) => p.featured);
  const rest = featured ? getAllPosts().length - 1 : getAllPosts().length;
  const { totalPages } = paginate(new Array(rest), 1);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Blog — Page ${page} — GSoC Organizations`,
    description: "More articles from the GSoC Organizations Blog.",
    alternates: { canonical: `/blog/page/${page}` },
  };
}

export default async function BlogPaginatedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound();
  if (pageNum === 1) redirect("/blog");

  const categories = getCategories().map((c) => ({ label: c, slug: categoryToSlug(c) }));
  const posts = getAllPosts();
  const featured = posts.find((p) => p.featured);
  const rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;
  const { items, totalPages, page: current } = paginate(rest, pageNum);
  if (current !== pageNum) notFound(); // out-of-range page

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <PostBreadcrumbs trail={[{ label: "Blog", href: "/blog" }, { label: `Page ${pageNum}` }]} />
      <header className="mt-6 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          The GSoC Organizations Blog
        </h1>
        <p className="mt-2 text-muted-foreground">Page {pageNum} of {totalPages}</p>
      </header>

      <CategoryChips categories={categories} />

      <div className="mt-8">
        <BlogListing template={getSettings().blogTemplate} posts={items} isFirstPage={false} />
      </div>

      <Pagination basePath="/blog" page={pageNum} totalPages={totalPages} />
    </main>
  );
}
