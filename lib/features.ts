/**
 * Feature toggles — flip a flag to enable/disable a surface without touching components.
 * Components must consume these flags instead of being deleted/commented out.
 */
export const features = {
  /** Newsletter capture blocks ("Get GSoC insights in your inbox"). Hidden for now. */
  newsletter: false,
  /** /blog/author/[slug] pages + linked bylines. */
  authorPages: true,
  /** /blog/tag/[slug] pages + clickable tag badges. */
  tagPages: true,
  /** /blog/category/[slug] pages + category chips/breadcrumb links. */
  categoryPages: true,
  /** "Ask AI" dropdown on posts — summarize/ask in ChatGPT, Claude, Perplexity, Grok, Mistral, Google AI Mode. */
  aiActions: true,
  /** Master switch for the social share row. */
  socialShare: true,
  /** Individual share buttons — set any to false to hide just that platform. */
  sharePlatforms: {
    copyLink: true,
    x: true,
    linkedin: true,
    whatsapp: true,
    facebook: true,
    telegram: true,
    reddit: true,
  },
} as const;

export type SharePlatform = keyof typeof features.sharePlatforms;
