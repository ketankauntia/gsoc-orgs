import { describe, expect, it } from "vitest";

import {
  buildDescription,
  buildPageMetadata,
  buildTitle,
  DESCRIPTION_LIMIT,
  DESCRIPTION_MIN,
  SITE_NAME,
  TITLE_LIMIT,
} from "../lib/seo";

const LONG_ORG_DESCRIPTION =
  "The Foundation provides an established framework for intellectual property and financial contributions that simultaneously limits contributors potential legal exposure. Through a collaborative and meritocratic development process, Apache projects deliver enterprise-grade, freely available software products.";

describe("buildTitle", () => {
  it("appends the brand suffix when the result still fits the limit", () => {
    const title = buildTitle("Apache Software Foundation");
    expect(title).toBe(`Apache Software Foundation | ${SITE_NAME}`);
    expect(title.length).toBeLessThanOrEqual(TITLE_LIMIT);
  });

  it("drops the brand suffix rather than truncating a candidate that fits alone", () => {
    const subject = "Improve the incremental compiler cache for large builds";
    expect(buildTitle(subject)).toBe(subject);
  });

  it("falls back to a shorter candidate before truncating", () => {
    const title = buildTitle([
      "A extremely verbose project title that could never fit inside a search result",
      "Shorter project title",
    ]);
    expect(title).toBe(`Shorter project title | ${SITE_NAME}`);
  });

  it("truncates on a word boundary when no candidate fits", () => {
    const title = buildTitle(
      "Reimplement the distributed scheduling subsystem with deterministic replay support",
    );
    expect(title.length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(title.endsWith(" ")).toBe(false);
    expect(title).toBe("Reimplement the distributed scheduling subsystem with");
  });

  it("never returns an empty title", () => {
    expect(buildTitle("   ")).toBe(SITE_NAME);
    expect(buildTitle([])).toBe(SITE_NAME);
  });
});

describe("buildDescription", () => {
  it("truncates long source text inside the limit", () => {
    const description = buildDescription(LONG_ORG_DESCRIPTION);
    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(description.endsWith("\u2026")).toBe(true);
  });

  it("pads short source text using the supplied page facts", () => {
    const description = buildDescription("A tiny org blurb.", [
      "Explore 42 Google Summer of Code projects from this organization",
      "Browse the technologies, topics, and contributors behind each accepted project",
    ]);
    expect(description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
  });

  it("skips padding that repeats text already present", () => {
    const description = buildDescription("Explore 42 projects", ["explore 42 PROJECTS"]);
    expect(description).toBe("Explore 42 projects.");
  });

  it("returns an empty string when there is nothing to describe", () => {
    expect(buildDescription(null, [])).toBe("");
  });
});

describe("buildPageMetadata", () => {
  const metadata = buildPageMetadata({
    title: "Apache Software Foundation",
    description: LONG_ORG_DESCRIPTION,
    path: "/organizations/apache-software-foundation",
    image: "https://cdn.example.com/apache.png",
    imageAlt: "Apache Software Foundation logo",
  });

  it("emits an absolute title so the root template cannot append a second brand suffix", () => {
    expect(metadata.title).toEqual({ absolute: `Apache Software Foundation | ${SITE_NAME}` });
  });

  it("keeps og:url identical to the canonical link", () => {
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
  });

  it("always emits a complete Open Graph set", () => {
    const openGraph = metadata.openGraph;
    expect(openGraph?.title).toBeTruthy();
    expect(openGraph?.description).toBeTruthy();
    expect(openGraph?.siteName).toBe(SITE_NAME);
    expect(openGraph && "type" in openGraph ? openGraph.type : undefined).toBe("website");
    expect(Array.isArray(openGraph?.images) && openGraph.images.length).toBeGreaterThan(0);
  });

  it("falls back to the branded card when a page has no image of its own", () => {
    const withoutImage = buildPageMetadata({
      title: "Topics",
      description: LONG_ORG_DESCRIPTION,
      path: "/topics",
    });
    const images = withoutImage.openGraph?.images as Array<{ url: string }>;
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain("/og/gsoc-organizations-guide.jpg");
  });

  it("mirrors the resolved title and description onto the Twitter card", () => {
    expect(metadata.twitter?.title).toBe((metadata.title as { absolute: string }).absolute);
    expect(metadata.twitter?.description).toBe(metadata.description);
  });
});
