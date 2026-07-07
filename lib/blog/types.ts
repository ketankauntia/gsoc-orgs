export type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  /** Author's personal/company website. */
  websiteUrl?: string;
  /** When true, the author's outbound links are dofollow. Default (absent/false) = rel="nofollow". */
  followLinks?: boolean;
};

export type Faq = {
  question: string;
  answer: string;
};

/** One renderable block inside a section. Keeps content structured so the UI, TOC and (later) JSON-LD all derive from the same source. */
export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string } // H1/H3–H6 (H2 defines sections)
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "tasklist"; items: { text: string; checked: boolean }[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "callout"; title: string; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "stat"; value: string; label: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "divider" };

/** An H2-level section. `id` doubles as the TOC anchor. Heading may be "" for the intro section before the first H2. */
export type PostSection = {
  id: string;
  heading: string;
  blocks: PostBlock[];
};

export type Post = {
  slug: string;
  title: string;
  /** Meta description + card excerpt. */
  description: string;
  category: string;
  tags: string[];
  publishedAt: string; // ISO date
  updatedAt?: string; // ISO date
  readingMinutes: number;
  featured?: boolean;
  /** Drafts render in dev only. */
  draft?: boolean;
  /** Pillar/cornerstone content — higher sitemap priority, stricter editor scoring. */
  cornerstone?: boolean;
  /** Per-post noindex — kept out of sitemap + emits robots noindex. */
  noindex?: boolean;
  /** Per-post canonical override (absolute or root-relative). Defaults to the post's own URL. */
  canonical?: string;
  /** Optional per-post OG image path; falls back to the site default. */
  ogImage?: string;
  authorSlug: string;
  /** Answer-first AI summary shown in the TL;DR block — the text LLMs should lift. */
  tldr: string;
  keyTakeaways: string[];
  sections: PostSection[];
  faqs: Faq[];
  /** Cover art gradient key until real images exist. */
  coverTone: "primary" | "chart-2" | "chart-3" | "chart-5";
};
