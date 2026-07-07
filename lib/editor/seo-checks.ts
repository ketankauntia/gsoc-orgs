import { parseSections } from "@/lib/blog/parse";
import type { PostBlock, PostSection } from "@/lib/blog/types";

/**
 * Yoast-style SEO/readability checks. Pure functions over draft fields —
 * client-safe so the editor runs them live on every keystroke.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  group: "seo" | "geo" | "structure" | "readability";
  label: string;
  status: CheckStatus;
  detail: string;
};

export type DraftInput = {
  title: string;
  description: string;
  slug: string;
  keyphrase: string;
  tldr: string;
  keyTakeaways: string[];
  faqs: { q: string; a: string }[];
  tags: string[];
  body: string;
  /** ISO date (updatedAt || publishedAt) — for the freshness check. Optional. */
  updatedAt?: string;
  /** Pillar page → stricter thresholds. */
  cornerstone?: boolean;
};

export function runSeoChecks(draft: DraftInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const body = draft.body ?? "";
  const sections = parseSections(body);
  const paragraphs = sections.flatMap((s) =>
    s.blocks.filter((b) => b.type === "paragraph").map((b) => (b.type === "paragraph" ? b.text : "")),
  );
  const words = body.split(/\s+/).filter(Boolean).length;
  const h2Count = sections.filter((s) => s.heading).length;
  const firstParagraph = paragraphs[0] ?? "";
  const kp = draft.keyphrase.trim().toLowerCase();
  const has = (text: string) => kp !== "" && text.toLowerCase().includes(kp);

  // ---- SEO group ----
  const titleLen = draft.title.trim().length;
  checks.push(range("title-length", "seo", "SEO title length", titleLen, [30, 60], [20, 70],
    `${titleLen} chars — aim for 30–60 so it doesn't truncate in results`));

  const descLen = draft.description.trim().length;
  checks.push(range("description-length", "seo", "Meta description length", descLen, [120, 160], [80, 180],
    `${descLen} chars — aim for 120–160`));

  const slugOk = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) && draft.slug.length <= 60;
  checks.push({
    id: "slug-format", group: "seo", label: "Slug format",
    status: draft.slug === "" ? "fail" : slugOk ? "pass" : "warn",
    detail: draft.slug === "" ? "Slug is empty" : slugOk ? `"${draft.slug}" — lowercase, hyphenated, ≤60 chars` : `"${draft.slug}" — use lowercase words separated by hyphens, ≤60 chars`,
  });

  if (kp === "") {
    checks.push({ id: "keyphrase", group: "seo", label: "Focus keyphrase", status: "warn", detail: "No keyphrase set — checks against title, description, intro and headings are skipped" });
  } else {
    checks.push({ id: "keyphrase-title", group: "seo", label: "Keyphrase in title", status: has(draft.title) ? "pass" : "fail", detail: has(draft.title) ? `"${draft.keyphrase}" appears in the title` : `Add "${draft.keyphrase}" to the title` });
    checks.push({ id: "keyphrase-description", group: "seo", label: "Keyphrase in meta description", status: has(draft.description) ? "pass" : "warn", detail: has(draft.description) ? "Present" : "Missing from the meta description" });
    checks.push({ id: "keyphrase-intro", group: "seo", label: "Keyphrase in first paragraph", status: has(firstParagraph) ? "pass" : "warn", detail: has(firstParagraph) ? "Present" : "Missing from the opening paragraph — answer first, then elaborate" });
    const inHeading = sections.some((s) => has(s.heading));
    checks.push({ id: "keyphrase-heading", group: "seo", label: "Keyphrase in a heading", status: inHeading ? "pass" : "warn", detail: inHeading ? "Present in at least one H2" : "Consider using it in one H2" });
    const inSlug = kp.split(/\s+/).every((w) => draft.slug.includes(w.replace(/[^a-z0-9]/g, "")));
    checks.push({ id: "keyphrase-slug", group: "seo", label: "Keyphrase in slug", status: inSlug ? "pass" : "warn", detail: inSlug ? "Present" : "Slug doesn't contain the keyphrase words" });
  }

  const internal = (body.match(/\]\(\/blog\//g) ?? []).length;
  checks.push({ id: "internal-links", group: "seo", label: "Internal links", status: internal >= 1 ? "pass" : "warn", detail: internal >= 1 ? `${internal} internal link${internal === 1 ? "" : "s"}` : "Link to at least one related post — builds the topic map" });

  const external = (body.match(/\]\(https?:\/\//g) ?? []).length;
  checks.push({ id: "external-links", group: "seo", label: "External links", status: external >= 1 ? "pass" : "warn", detail: external >= 1 ? `${external} external link${external === 1 ? "" : "s"}` : "Citing authoritative sources builds trust with engines" });

  checks.push({ id: "tags-count", group: "seo", label: "Tags", status: draft.tags.length >= 2 && draft.tags.length <= 6 ? "pass" : "warn", detail: `${draft.tags.length} tags — aim for 2–6 focused tags` });

  // ---- GEO group (answer-first + evidence: the Princeton GEO tactics) ----
  // Answer-first: does the first paragraph of each H2 open with a direct answer sentence?
  // Heuristic — first sentence is short-ish and declarative (not a question, not a lead-in).
  const bodySections = sections.filter((s) => s.heading);
  const weakOpenings = bodySections
    .filter((s) => {
      const firstPara = s.blocks.find((b) => b.type === "paragraph");
      if (!firstPara || firstPara.type !== "paragraph") return true;
      const firstSentence = firstPara.text.split(/(?<=[.!?])\s/)[0] ?? "";
      const wordCount = firstSentence.split(/\s+/).filter(Boolean).length;
      // Weak if it opens with a question or a hedging lead-in, or is very long before the point.
      const hedges = /^(so|now|well|in this|let's|today|before we|first,|imagine|picture)/i.test(firstSentence);
      return firstSentence.trim().endsWith("?") || hedges || wordCount > 40;
    })
    .map((s) => s.heading);
  checks.push({
    id: "answer-first",
    group: "geo",
    label: "Answer-first sections",
    status: bodySections.length === 0 ? "warn" : weakOpenings.length === 0 ? "pass" : weakOpenings.length <= 1 ? "warn" : "fail",
    detail:
      bodySections.length === 0
        ? "No sections yet"
        : weakOpenings.length === 0
          ? "Every section opens with a direct answer — ideal for AI extraction"
          : `Lead with the answer in: ${weakOpenings.join(", ")}`,
  });

  // Statistics: at least one concrete number/percentage in prose or a :::stat block.
  const statBlocks = (body.match(/^:::stat /gm) ?? []).length;
  const inlineNumbers = (body.match(/\b\d[\d,.]*\s?(%|percent|x\b|×|kg|km|m\b|₹|\$|days?|hours?|years?|months?)/gi) ?? []).length;
  const statTotal = statBlocks + inlineNumbers;
  const statTarget = draft.cornerstone ? 2 : 1;
  checks.push({
    id: "has-statistics",
    group: "geo",
    label: "Original statistics",
    status: statTotal >= statTarget ? "pass" : statTotal >= 1 ? "warn" : "fail",
    detail:
      statTotal >= statTarget
        ? `${statTotal} concrete figure${statTotal === 1 ? "" : "s"} — statistics lift AI citations most`
        : `Add ${statTarget} concrete stat${statTarget === 1 ? "" : "s"} (a %, count, or measured number). Statistics are the #1 GEO lever.`,
  });

  // Citations: outbound links to authoritative sources (not our own domain).
  const externalCitations = [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].filter(
    (m) => !/GSoC Organizations\.in/.test(m[1]),
  ).length;
  const citeTarget = draft.cornerstone ? 2 : 1;
  checks.push({
    id: "has-citations",
    group: "geo",
    label: "Authoritative citations",
    status: externalCitations >= citeTarget ? "pass" : externalCitations >= 1 ? "warn" : "fail",
    detail:
      externalCitations >= citeTarget
        ? `${externalCitations} outbound citation${externalCitations === 1 ? "" : "s"} — quoting sources builds trust with engines`
        : `Cite ${citeTarget} authoritative source${citeTarget === 1 ? "" : "s"} — content that cites sources gets cited back`,
  });

  // Freshness: nudge when the post hasn't been touched in ~12 months.
  if (draft.updatedAt) {
    const ageDays = Math.floor((Date.now() - Date.parse(draft.updatedAt)) / 86_400_000);
    checks.push({
      id: "freshness",
      group: "geo",
      label: "Freshness",
      status: Number.isNaN(ageDays) ? "warn" : ageDays <= 365 ? "pass" : ageDays <= 540 ? "warn" : "fail",
      detail: Number.isNaN(ageDays)
        ? "Set a valid published/updated date"
        : ageDays <= 365
          ? `Updated ${ageDays} days ago — fresh`
          : `Last updated ${ageDays} days ago — refresh it and bump the date (AI engines favor recent content)`,
    });
  }

  // ---- Structure group (GEO blocks) ----
  const tldrLen = draft.tldr.trim().length;
  checks.push({ id: "tldr", group: "structure", label: "TL;DR summary", status: tldrLen === 0 ? "fail" : tldrLen >= 150 && tldrLen <= 500 ? "pass" : "warn", detail: tldrLen === 0 ? "Missing — the highest-leverage block for AI citations" : `${tldrLen} chars — aim for 150–500 (2–4 answer-first sentences)` });

  checks.push({ id: "takeaways", group: "structure", label: "Key takeaways", status: draft.keyTakeaways.length >= 3 ? "pass" : draft.keyTakeaways.length >= 1 ? "warn" : "fail", detail: `${draft.keyTakeaways.length} — aim for 3–5 extractable bullets` });

  checks.push({ id: "faqs", group: "structure", label: "FAQs", status: draft.faqs.length >= 2 ? "pass" : draft.faqs.length === 1 ? "warn" : "fail", detail: `${draft.faqs.length} — aim for 2–5 questions phrased the way people ask them` });

  const hasH1 = /^# /m.test(body);
  checks.push({ id: "no-h1", group: "structure", label: "No H1 in body", status: hasH1 ? "fail" : "pass", detail: hasH1 ? "Body contains a `# ` heading — the post title is the only H1; use `## `" : "Title is the only H1" });

  checks.push({ id: "h2-count", group: "structure", label: "Section headings", status: h2Count >= 2 ? "pass" : h2Count === 1 ? "warn" : "fail", detail: `${h2Count} H2 sections — each should be self-contained and quotable` });

  const images = [...body.matchAll(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/gm)];
  const missingAlt = images.filter((m) => m[1].trim() === "").length;
  const missingCaption = images.filter((m) => !m[3]?.trim()).length;
  checks.push({
    id: "image-alt", group: "structure", label: "Images: alt text & captions",
    status: images.length === 0 ? "warn" : missingAlt > 0 ? "fail" : missingCaption > 0 ? "warn" : "pass",
    detail:
      images.length === 0
        ? "No images — an original diagram or screenshot earns citations"
        : missingAlt > 0
          ? `${missingAlt} image${missingAlt === 1 ? "" : "s"} missing alt text — ![alt](src "Caption")`
          : missingCaption > 0
            ? `${missingCaption} image${missingCaption === 1 ? "" : "s"} without a caption — add "Caption" after the src`
            : `${images.length} image${images.length === 1 ? "" : "s"}, all with alt text and captions`,
  });

  const longSections = sections.filter((s) => s.heading && sectionWords(s) > 300).map((s) => s.heading);
  checks.push({ id: "section-length", group: "structure", label: "Section length", status: longSections.length === 0 ? "pass" : "warn", detail: longSections.length === 0 ? "All sections under ~300 words" : `Long sections: ${longSections.join(", ")} — consider splitting` });

  // ---- Readability group ----
  checks.push(range("word-count", "readability", "Word count", words, [600, 100000], [300, 100000], `${words} words — 600+ for a substantive post, 300 minimum`));

  const sentences = paragraphs.join(" ").split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length > 0 ? Math.round(paragraphs.join(" ").split(/\s+/).filter(Boolean).length / sentences.length) : 0;
  checks.push({ id: "sentence-length", group: "readability", label: "Average sentence length", status: avgSentence === 0 ? "warn" : avgSentence <= 20 ? "pass" : avgSentence <= 26 ? "warn" : "fail", detail: avgSentence === 0 ? "No prose yet" : `${avgSentence} words/sentence — aim for ≤20` });

  const longParas = paragraphs.filter((p) => p.split(/\s+/).length > 120).length;
  checks.push({ id: "paragraph-length", group: "readability", label: "Paragraph length", status: longParas === 0 ? "pass" : "warn", detail: longParas === 0 ? "All paragraphs scannable" : `${longParas} paragraph${longParas === 1 ? "" : "s"} over 120 words — break them up` });

  return checks;
}

function sectionWords(section: PostSection): number {
  const blockText = (b: PostBlock): string => {
    if ("text" in b) return b.text;
    if (b.type === "list") return b.items.join(" ");
    if (b.type === "tasklist") return b.items.map((i) => i.text).join(" ");
    if (b.type === "table") return [...b.header, ...b.rows.flat()].join(" ");
    return "";
  };
  return section.blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function range(
  id: string,
  group: SeoCheck["group"],
  label: string,
  value: number,
  pass: [number, number],
  warn: [number, number],
  detail: string,
): SeoCheck {
  const status: CheckStatus =
    value >= pass[0] && value <= pass[1] ? "pass" : value >= warn[0] && value <= warn[1] ? "warn" : "fail";
  return { id, group, label, status, detail };
}

/** 0–100, pass = full credit, warn = half. */
export function seoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0;
  const points = checks.reduce((sum, c) => sum + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}
