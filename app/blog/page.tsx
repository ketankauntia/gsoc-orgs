import type { Metadata } from "next";
import { Pagination } from "@/components/blog/pagination";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { CategoryChips } from "@/components/blog/category-chips";
import { ListingJsonLd } from "@/components/blog/listing-json-ld";
import { BlogListing } from "@/components/blog/templates/blog-listing";
import { categoryToSlug, getAllPosts, getCategories, paginate } from "@/lib/blog/content";
import { getSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — GSoC Organizations",
  description: siteConfig.description,
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const categories = getCategories().map((c) => ({ label: c, slug: categoryToSlug(c) }));
  const posts = getAllPosts();
  const { blogTemplate } = getSettings();
  // The featured/hero post owns page 1's top slot; the rest paginate below it.
  const featured = posts.find((p) => p.featured);
  const rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;
  const { items, totalPages } = paginate(rest, 1);
  const pagePosts = featured ? [featured, ...items] : items;

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <ListingJsonLd posts={posts} name="The GSoC Organizations Blog" />
      <header className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          The GSoC Organizations Blog
        </h1>
        <p className="mt-2 text-muted-foreground">
          Practical guides for comparing organizations, reading project history, and preparing
          stronger Google Summer of Code applications.
        </p>
      </header>

      <CategoryChips categories={categories} />

      <div className="mt-8">
        <BlogListing template={blogTemplate} posts={pagePosts} isFirstPage />
      </div>

      <Pagination basePath="/blog" page={1} totalPages={totalPages} />

      <div className="mt-14">
        <NewsletterCta />
      </div>
    </main>
  );
}
