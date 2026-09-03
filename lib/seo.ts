import type { Metadata } from "next";

import { getFullUrl, SITE_URL } from "@/lib/constants";

/**
 * Centralised metadata builders.
 *
 * Every indexable page should produce its metadata through {@link buildPageMetadata}
 * so that four crawler-visible invariants hold everywhere:
 *
 * 1. Titles are absolute and never exceed {@link TITLE_LIMIT} characters. Page-level
 *    `title` strings are otherwise expanded by the root `title.template`, which
 *    silently appends a second brand suffix to titles that already carry one.
 * 2. Descriptions always land inside the {@link DESCRIPTION_MIN}–{@link DESCRIPTION_LIMIT}
 *    window, padding with page context when the source text is thin and truncating
 *    on a word boundary when it is long.
 * 3. Open Graph output is always complete (`og:title`, `og:description`, `og:url`,
 *    `og:image`, `og:type`, `og:site_name`). Next.js replaces rather than merges the
 *    `openGraph` object, so a page that sets it partially loses the layout defaults.
 * 4. `og:url` is derived from the same path as the canonical link, so the two can
 *    never drift apart.
 */

export const SITE_NAME = "GSoC Organizations Guide";

/** Ahrefs flags titles longer than 60 characters. */
export const TITLE_LIMIT = 60;

/** Ahrefs flags descriptions shorter than 110 or longer than 160 characters. */
export const DESCRIPTION_MIN = 115;
export const DESCRIPTION_LIMIT = 158;

const BRAND_SUFFIX = ` | ${SITE_NAME}`;
const DEFAULT_OG_IMAGE_PATH = "/og/gsoc-organizations-guide.jpg";

export const DEFAULT_OG_IMAGE = {
  url: getFullUrl(DEFAULT_OG_IMAGE_PATH),
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

function normalize(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[\s\u2013\u2014\-–—,;:|/]+$/u, "");
}

/** Cuts `value` to at most `limit` characters without splitting a word. */
function cutOnWordBoundary(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const window = value.slice(0, limit);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > limit * 0.6 ? window.slice(0, lastSpace) : window;
  return trimTrailingPunctuation(cut);
}

/**
 * Picks the longest supplied candidate that fits within the title budget.
 *
 * Candidates are tried in order, first with the brand suffix appended and then on
 * their own, so a page keeps its most descriptive title whenever there is room and
 * degrades gracefully instead of being cut mid-word.
 */
export function buildTitle(candidates: string | string[]): string {
  const list = (Array.isArray(candidates) ? candidates : [candidates])
    .map(normalize)
    .filter(Boolean);

  if (list.length === 0) return SITE_NAME;

  for (const candidate of list) {
    if (candidate.length + BRAND_SUFFIX.length <= TITLE_LIMIT) {
      return `${candidate}${BRAND_SUFFIX}`;
    }
  }

  for (const candidate of list) {
    if (candidate.length <= TITLE_LIMIT) return candidate;
  }

  const shortest = list.reduce((a, b) => (a.length <= b.length ? a : b));
  return cutOnWordBoundary(shortest, TITLE_LIMIT);
}

/**
 * Produces a description inside the indexable length window.
 *
 * `extras` are appended in order until the minimum length is reached, which lets a
 * caller supply page facts (counts, year, organization) as padding for records whose
 * own description is a single short sentence.
 */
export function buildDescription(
  primary: string | null | undefined,
  extras: Array<string | null | undefined> = [],
): string {
  let text = normalize(primary);

  for (const extra of extras) {
    if (text.length >= DESCRIPTION_MIN) break;
    const piece = trimTrailingPunctuation(normalize(extra));
    if (!piece) continue;
    if (!text) {
      text = piece;
      continue;
    }
    if (text.toLowerCase().includes(piece.toLowerCase())) continue;
    const separator = /[.!?]$/.test(text) ? " " : ". ";
    text = `${text}${separator}${piece}`;
  }

  if (!text) return "";
  if (text.length <= DESCRIPTION_LIMIT) {
    return /[.!?]$/.test(text) ? text : `${text}.`;
  }

  return `${cutOnWordBoundary(text, DESCRIPTION_LIMIT - 1)}\u2026`;
}

function resolveImages(image: string | null | undefined, alt: string) {
  if (!image) return [DEFAULT_OG_IMAGE];
  const url = image.startsWith("http") ? image : new URL(image, SITE_URL).toString();
  // The branded card stays in the list as a secondary image so previews degrade to a
  // correctly sized asset when the primary (often a small square logo) is rejected.
  return [{ url, alt }, DEFAULT_OG_IMAGE];
}

export interface PageMetadataInput {
  /** Title candidates in descending order of preference; the brand suffix is added when it fits. */
  title: string | string[];
  description?: string | null;
  /** Extra sentences used to pad a description that is below the minimum length. */
  descriptionExtras?: Array<string | null | undefined>;
  /** Site-relative path; drives both the canonical link and `og:url`. */
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  index?: boolean;
  follow?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const {
    title,
    description,
    descriptionExtras = [],
    path,
    image,
    imageAlt,
    type = "website",
    index = true,
    follow = true,
    keywords,
    publishedTime,
    modifiedTime,
    authors,
  } = input;

  const resolvedTitle = buildTitle(title);
  const resolvedDescription = buildDescription(description, descriptionExtras);
  const url = getFullUrl(path);
  const images = resolveImages(image, imageAlt ?? resolvedTitle);

  return {
    title: { absolute: resolvedTitle },
    description: resolvedDescription,
    ...(keywords?.length ? { keywords } : {}),
    robots: { index, follow },
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images,
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors } : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: images.map((entry) => entry.url),
    },
  };
}

/** Metadata for a resource that could not be resolved; never indexable. */
export function buildNotFoundMetadata(subject: string): Metadata {
  return {
    title: { absolute: buildTitle(`${subject} Not Found`) },
    robots: { index: false, follow: false },
  };
}
