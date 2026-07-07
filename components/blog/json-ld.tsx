import { absoluteUrl, siteConfig } from "@/lib/site";
import { categoryToSlug, getPostImages } from "@/lib/blog/content";
import type { Author, Post } from "@/lib/blog/types";

/** BlogPosting + FAQPage + BreadcrumbList structured data for one post. Organization lives in the root layout. */
export function PostJsonLd({ post, author }: { post: Post; author: Author }) {
  const url = absoluteUrl(`/blog/post/${post.slug}`);

  // Approx word count from body block text — a recommended Article property.
  const wordCount = post.sections
    .flatMap((s) => s.blocks.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "")))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  // Prefer real in-body images as ImageObjects; fall back to the OG image.
  const bodyImages = getPostImages(post);
  const images =
    bodyImages.length > 0
      ? bodyImages.map((img) => ({
          "@type": "ImageObject",
          url: absoluteUrl(img.src),
          caption: img.caption ?? img.alt,
          description: img.alt,
        }))
      : [{ "@type": "ImageObject", url: absoluteUrl(post.ogImage ?? siteConfig.ogImage) }];

  const sameAs = [author.websiteUrl, author.linkedinUrl, author.twitterUrl].filter(Boolean);
  const person = {
    "@type": "Person",
    name: author.name,
    jobTitle: author.role,
    ...(author.websiteUrl && { url: author.websiteUrl }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": url,
        mainEntityOfPage: url,
        headline: post.title,
        description: post.description,
        abstract: post.tldr,
        image: images,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        wordCount,
        timeRequired: `PT${post.readingMinutes}M`,
        author: person,
        publisher: {
          "@type": "Organization",
          name: siteConfig.organization.name,
          url: siteConfig.organization.url,
          logo: { "@type": "ImageObject", url: siteConfig.organization.logo },
        },
        keywords: post.tags.join(", "),
        articleSection: post.category,
        inLanguage: "en",
      },
      ...(post.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: post.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: absoluteUrl("/blog") },
          {
            "@type": "ListItem",
            position: 2,
            name: post.category,
            item: absoluteUrl(`/blog/category/${categoryToSlug(post.category)}`),
          },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
