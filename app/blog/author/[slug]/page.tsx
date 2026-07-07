import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorCard } from "@/components/blog/author-card";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import { PostGrid } from "@/components/blog/post-grid";
import { authors, getAuthor } from "@/lib/blog/authors";
import { getPostsByAuthor } from "@/lib/blog/content";
import { features } from "@/lib/features";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export function generateStaticParams() {
  if (!features.authorPages) return [];
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) return {};
  return {
    title: `${author.name} — GSoC Organizations Blog`,
    description: author.bio,
    alternates: { canonical: `/blog/author/${slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!features.authorPages) notFound();
  const { slug } = await params;
  if (!authors.some((a) => a.slug === slug)) notFound();

  const author = getAuthor(slug);
  const posts = getPostsByAuthor(slug);

  const personJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    ...(author.websiteUrl && { url: author.websiteUrl }),
    ...((() => {
      const sameAs = [author.websiteUrl, author.linkedinUrl, author.twitterUrl].filter(Boolean);
      return sameAs.length > 0 ? { sameAs } : {};
    })()),
  });

  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLd }} />
      <PostBreadcrumbs trail={[{ label: "Blog", href: "/blog" }, { label: author.name }]} />
      <div className="mx-auto mt-6 max-w-content">
        <AuthorCard author={author} />
      </div>
      <section aria-label={`Articles by ${author.name}`} className="mt-10">
        <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight">
          Articles by {author.name} ({posts.length})
        </h2>
        <PostGrid posts={posts} />
      </section>
    </main>
  );
}
