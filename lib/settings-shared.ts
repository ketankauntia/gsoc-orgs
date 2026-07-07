/** Client-safe settings constants/types. fs-backed reading lives in lib/settings.ts (server-only). */

export const BLOG_TEMPLATES = ["classic", "magazine", "minimal"] as const;
export const POST_TEMPLATES = ["standard", "centered", "hero"] as const;

export type BlogTemplate = (typeof BLOG_TEMPLATES)[number];
export type PostTemplate = (typeof POST_TEMPLATES)[number];

export type SiteSettings = {
  /** Layout of /blog (and its pagination pages). */
  blogTemplate: BlogTemplate;
  /** Layout of individual post pages. */
  postTemplate: PostTemplate;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  blogTemplate: "classic",
  postTemplate: "standard",
};
