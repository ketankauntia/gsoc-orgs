import { absoluteUrl } from "@/lib/site";
import type { Post } from "@/lib/blog/types";

/** ItemList structured data for a listing page — helps engines understand the collection + ordering. */
export function ListingJsonLd({ posts, name }: { posts: Post[]; name: string }) {
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/blog/post/${post.slug}`),
      name: post.title,
    })),
  });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
