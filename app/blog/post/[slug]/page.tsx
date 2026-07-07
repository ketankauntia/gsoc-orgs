import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconCalendar, IconClock, IconRefresh } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/blog-ui/avatar";
import { Badge } from "@/components/blog-ui/badge";
import { Separator } from "@/components/blog-ui/separator";
import { AiPageActions } from "@/components/blog/ai-page-actions";
import { AuthorCard } from "@/components/blog/author-card";
import { FaqSection } from "@/components/blog/faq-section";
import { KeyTakeaways } from "@/components/blog/key-takeaways";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { PostBody } from "@/components/blog/post-body";
import { PostBreadcrumbs } from "@/components/blog/post-breadcrumbs";
import { PostCover } from "@/components/blog/post-cover";
import { PostJsonLd } from "@/components/blog/json-ld";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ShareActions } from "@/components/blog/share-actions";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { TldrBlock } from "@/components/blog/tldr-block";
import { getAuthor } from "@/lib/blog/authors";
import {
  categoryToSlug,
  getAllPosts,
  getPost,
  getRelatedPosts,
  tagToSlug,
} from "@/lib/blog/content";
import { formatDate } from "@/lib/blog/format";
import { features } from "@/lib/features";
import { getSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `/blog/post/${post.slug}`;
  const image = post.ogImage ?? siteConfig.ogImage;
  return {
    title: `${post.title} — GSoC Organizations Blog`,
    description: post.description,
    alternates: { canonical: post.canonical ?? url },
    ...(post.noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: siteConfig.name,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [getAuthor(post.authorSlug).name],
      tags: post.tags,
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const author = getAuthor(post.authorSlug);
  const related = getRelatedPosts(post.slug);
  const { postTemplate } = getSettings();
  const tocItems = post.sections
    .filter((s) => s.heading)
    .map(({ id, heading }) => ({ id, heading }));

  /* ---------- shared fragments (arranged differently per template) ---------- */

  const breadcrumbs = (
    <PostBreadcrumbs
      trail={[
        { label: "Blog", href: "/blog" },
        {
          label: post.category,
          href: features.categoryPages
            ? `/blog/category/${categoryToSlug(post.category)}`
            : undefined,
        },
        { label: post.title },
      ]}
    />
  );

  const metaRow = (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <Byline
        name={author.name}
        initials={author.initials}
        href={features.authorPages ? `/blog/author/${author.slug}` : undefined}
      />
      <span className="inline-flex items-center gap-1">
        <IconCalendar className="size-4" />
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </span>
      {post.updatedAt && (
        <span className="inline-flex items-center gap-1">
          <IconRefresh className="size-4" />
          Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <IconClock className="size-4" />
        {post.readingMinutes} min read
      </span>
    </div>
  );

  const actions = (features.aiActions || features.socialShare) && (
    <div className="flex flex-wrap items-center gap-4">
      {features.aiActions && <AiPageActions />}
      {features.socialShare && <ShareActions title={post.title} />}
    </div>
  );

  const tocCard = (tocItems.length > 0 || post.faqs.length > 0) && (
    <div className="rounded-xl border bg-card p-5">
      <TableOfContents items={tocItems} hasFaqs={post.faqs.length > 0} />
    </div>
  );

  const titleBlock = (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{post.category}</Badge>
        {post.draft && <Badge variant="destructive">Draft</Badge>}
      </div>
      <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
    </>
  );

  const articleTail = (
    <>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) =>
          features.tagPages ? (
            <Link key={tag} href={`/blog/tag/${tagToSlug(tag)}`}>
              <Badge variant="outline" className="hover:bg-accent">
                #{tag}
              </Badge>
            </Link>
          ) : (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ),
        )}
      </div>
      <Separator />
      <FaqSection faqs={post.faqs} />
      <AuthorCard
        author={author}
        profileHref={features.authorPages ? `/blog/author/${author.slug}` : undefined}
      />
      <NewsletterCta />
    </>
  );

  /* ---------- template layouts ---------- */

  if (postTemplate === "centered") {
    // Single centered reading column — no sidebar; TOC + actions inline.
    return (
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6">
        <PostJsonLd post={post} author={author} />
        <ReadingProgress />
        {breadcrumbs}
        <header className="mt-6">
          {titleBlock}
          {metaRow}
          <div className="mt-5">{actions}</div>
        </header>
        <article className="mt-8 space-y-8">
          <PostCover post={post} className="h-56 sm:h-72" />
          <TldrBlock text={post.tldr} />
          <KeyTakeaways items={post.keyTakeaways} />
          {tocCard}
          <PostBody sections={post.sections} />
          {articleTail}
        </article>
        <div className="mt-16">
          <RelatedPosts posts={related} />
        </div>
      </main>
    );
  }

  if (postTemplate === "hero") {
    // Full-width cover banner with overlaid title, then a centered reading column.
    return (
      <main className="w-full flex-1 pb-8">
        <PostJsonLd post={post} author={author} />
        <ReadingProgress />
        <div className="relative">
          <PostCover post={post} className="h-72 rounded-none sm:h-96" />
          <div className="absolute inset-0 flex items-end bg-linear-to-t from-background via-background/50 to-transparent">
            <div className="mx-auto w-full max-w-shell px-4 pb-8 sm:px-6">
              <div className="mx-auto max-w-content">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  {post.draft && <Badge variant="destructive">Draft</Badge>}
                </div>
                <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-content px-4 sm:px-6">
          <div className="mt-6">{breadcrumbs}</div>
          <header className="mt-4">
            <p className="text-lg text-muted-foreground">{post.description}</p>
            {metaRow}
            <div className="mt-5">{actions}</div>
          </header>
          <article className="mt-8 space-y-8">
            <TldrBlock text={post.tldr} />
            <KeyTakeaways items={post.keyTakeaways} />
            {tocCard}
            <PostBody sections={post.sections} />
            {articleTail}
          </article>
          <div className="mt-16">
            <RelatedPosts posts={related} />
          </div>
        </div>
      </main>
    );
  }

  // "standard" — two-column with sticky TOC/actions sidebar (the original).
  return (
    <main className="mx-auto w-full max-w-shell flex-1 px-4 py-8 sm:px-6">
      <PostJsonLd post={post} author={author} />
      <ReadingProgress />

      {/* Breadcrumb + header + article share one column so every element starts at the same left edge */}
      <div className="mt-2 lg:grid lg:grid-cols-[1fr_16rem] lg:gap-12">
        <div className="mx-auto w-full max-w-content">
          {breadcrumbs}
          <header className="mt-6">
            {titleBlock}
            {metaRow}
            {/* Actions on mobile — sidebar carries them on desktop */}
            <div className="mt-5 lg:hidden">{actions}</div>
          </header>

          <article className="mt-8 space-y-8">
            <PostCover post={post} className="h-56 sm:h-72" />
            <TldrBlock text={post.tldr} />
            <KeyTakeaways items={post.keyTakeaways} />
            {/* Mobile TOC — sidebar is hidden below lg */}
            <div className="lg:hidden">{tocCard}</div>
            <PostBody sections={post.sections} />
            {articleTail}
          </article>
        </div>

        {/* Sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <TableOfContents items={tocItems} hasFaqs={post.faqs.length > 0} />
            <div className="space-y-4">
              {features.aiActions && <AiPageActions />}
              {features.socialShare && <ShareActions title={post.title} />}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-16">
        <RelatedPosts posts={related} />
      </div>
    </main>
  );
}

function Byline({ name, initials, href }: { name: string; initials: string; href?: string }) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <Avatar className="size-7">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">{name}</span>
    </span>
  );
  return href ? (
    <Link href={href} className="hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}
