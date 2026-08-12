import type { Metadata } from "next";
import { Pagination } from "@/components/blog/pagination";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { CategoryChips } from "@/components/blog/category-chips";
import { ListingJsonLd } from "@/components/blog/listing-json-ld";
import { BlogListing } from "@/components/blog/templates/blog-listing";
import { categoryToSlug, getAllPosts, getCategories, paginate } from "@/lib/blog/content";
import { getSettings } from "@/lib/settings";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "GSoC Guide 2027, Organizations and Proposal Resources",
  description:
    "Research-backed GSoC guides for 2027 preparation, organization lists, choosing GSoC orgs, open-source contributions and project proposals.",
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
      <ListingJsonLd posts={posts} name="GSoC Guides and Organization Research" />
      <header className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          GSoC Guides, Organizations and Open Source Research
        </h1>
        <p className="mt-2 text-muted-foreground">
          Research-backed guides for GSoC 2027 preparation, comparing organizations, reading
          project history and contributing to open source before proposal season.
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
