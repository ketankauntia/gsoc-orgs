/**
 * Internal-link suggestions — surfaces other posts the current draft could link to,
 * based on shared tags/category and title-word mentions in the body. Client-safe.
 */

export type LinkCandidate = {
  slug: string;
  title: string;
  reason: string;
};

type PostLike = {
  slug: string;
  title: string;
  category: string;
  tags: string[];
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "of", "to", "in", "on", "with", "how", "why",
  "what", "we", "our", "your", "that", "this", "without", "into", "at", "is", "are",
]);

function titleKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export function suggestInternalLinks(
  draft: { slug: string; category: string; tags: string[]; body: string },
  posts: PostLike[],
  limit = 5,
): LinkCandidate[] {
  const body = draft.body.toLowerCase();
  const alreadyLinked = new Set(
    [...draft.body.matchAll(/\/blog\/post\/([a-z0-9-]+)/g)].map((m) => m[1]),
  );

  return posts
    .filter((p) => p.slug !== draft.slug && !alreadyLinked.has(p.slug))
    .map((p) => {
      const sharedTags = p.tags.filter((t) => draft.tags.includes(t));
      const sameCategory = p.category === draft.category;
      const mentioned = titleKeywords(p.title).some((w) => body.includes(w));
      const score = sharedTags.length * 3 + (sameCategory ? 2 : 0) + (mentioned ? 4 : 0);
      const reasons = [
        mentioned && "mentioned in your text",
        sharedTags.length > 0 && `shared tag: ${sharedTags[0]}`,
        sameCategory && "same category",
      ].filter(Boolean);
      return { slug: p.slug, title: p.title, reason: reasons.join(" · "), score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ slug, title, reason }) => ({ slug, title, reason }));
}
