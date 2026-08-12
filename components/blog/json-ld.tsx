import { absoluteUrl, siteConfig } from "@/lib/site";
import { categoryToSlug, getPostImages } from "@/lib/blog/content";
import type { Author, Post } from "@/lib/blog/types";

function imageMimeType(src: string): string {
  const pathname = src.split(/[?#]/, 1)[0].toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".avif")) return "image/avif";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

/** BlogPosting + BreadcrumbList structured data for one post. Organization lives in the root layout. */
export function PostJsonLd({ post, author }: { post: Post; author: Author }) {
  const url = absoluteUrl(`/blog/post/${post.slug}`);

  // Approx word count from body block text — a recommended Article property.
  const wordCount = post.sections
    .flatMap((s) => s.blocks.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "")))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  // Keep the visible cover discoverable, then add distinct informational images from the body.
  const bodyImages = getPostImages(post);
  const coverSrc = post.coverImage ?? post.ogImage ?? siteConfig.ogImage;
  const coverUrl = absoluteUrl(coverSrc);
  const coverIsVisibleAsset = Boolean(post.coverImage);
  const images = [
    {
      "@type": "ImageObject",
      url: coverUrl,
      contentUrl: coverUrl,
      width: coverIsVisibleAsset ? 1600 : 1200,
      height: coverIsVisibleAsset ? 900 : 630,
      encodingFormat: imageMimeType(coverSrc),
      caption: post.title,
      description: post.coverAlt?.trim() || post.title,
    },
    ...bodyImages
      .filter((img) => absoluteUrl(img.src) !== coverUrl)
      .map((img) => ({
        "@type": "ImageObject",
        url: absoluteUrl(img.src),
        contentUrl: absoluteUrl(img.src),
        encodingFormat: imageMimeType(img.src),
        caption: img.caption ?? img.alt,
        description: img.alt,
      })),
  ];

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
