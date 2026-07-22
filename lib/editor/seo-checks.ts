import { parseSections, slugify } from "@/lib/blog/parse";
import type { PostBlock, PostImage, PostSection } from "@/lib/blog/types";

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
  images?: PostImage[];
  canonical?: string;
  author?: string;
  ogImage?: string;
  updatedAt?: string;
  cornerstone?: boolean;
};

const STOP_WORDS = new Set(["a", "an", "and", "for", "how", "in", "is", "of", "the", "to", "with"]);

export function runSeoChecks(draft: DraftInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const body = draft.body ?? "";
  const sections = parseSections(body);
  const paragraphs = sections.flatMap((section) =>
    section.blocks
      .filter((block) => block.type === "paragraph")
      .map((block) => (block.type === "paragraph" ? block.text : "")),
  );
  const plainBody = paragraphs.join(" ");
  const words = body.split(/\s+/).filter(Boolean).length;
  const h2Count = sections.filter((section) => section.heading).length;
  const firstParagraph = paragraphs[0] ?? "";
  const keyphrase = draft.keyphrase.trim().toLowerCase();
  const containsKeyphrase = (text: string) => keyphrase !== "" && text.toLowerCase().includes(keyphrase);

  addSearchChecks(checks, draft, sections, body, firstParagraph, keyphrase, containsKeyphrase);
  addEvidenceChecks(checks, draft, sections, body);
  addStructureChecks(checks, draft, sections, body, h2Count);
  addReadabilityChecks(checks, draft, sections, paragraphs, plainBody, words);
  return checks;
}

function addSearchChecks(
  checks: SeoCheck[],
  draft: DraftInput,
  sections: PostSection[],
  body: string,
  firstParagraph: string,
  keyphrase: string,
  containsKeyphrase: (text: string) => boolean,
) {
  const titleLength = draft.title.trim().length;
  checks.push(range("title-length", "seo", "SEO title length", titleLength, [30, 60], [20, 70], `${titleLength} chars; aim for 30 to 60`));

  const descriptionLength = draft.description.trim().length;
  checks.push(range("description-length", "seo", "Meta description length", descriptionLength, [120, 160], [80, 180], `${descriptionLength} chars; aim for 120 to 160`));

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) && draft.slug.length <= 60;
  checks.push({
    id: "slug-format",
    group: "seo",
    label: "Slug format",
    status: draft.slug === "" ? "fail" : slugOk ? "pass" : "warn",
    detail: draft.slug === "" ? "Slug is empty" : slugOk ? `"${draft.slug}" is lowercase, hyphenated, and at most 60 characters` : "Use lowercase words separated by hyphens and keep the slug at most 60 characters",
  });

  if (!keyphrase) {
    checks.push({ id: "keyphrase", group: "seo", label: "Focus keyphrase", status: "warn", detail: "Set one primary phrase so the editor can check search intent alignment" });
  } else {
    checks.push(keyphraseCheck("keyphrase-title", "Keyphrase in title", containsKeyphrase(draft.title), `Add "${draft.keyphrase}" to the title`));
    checks.push(keyphraseCheck("keyphrase-description", "Keyphrase in meta description", containsKeyphrase(draft.description), "Use the phrase naturally in the meta description", "warn"));
    checks.push(keyphraseCheck("keyphrase-intro", "Keyphrase in opening paragraph", containsKeyphrase(firstParagraph), "Use the phrase naturally in the opening answer", "warn"));
    checks.push(keyphraseCheck("keyphrase-heading", "Keyphrase in a heading", sections.some((section) => containsKeyphrase(section.heading)), "Use the phrase or a close variant in one useful H2", "warn"));

    const meaningfulWords = keyphrase
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/g, ""))
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
    const slugContainsTerms = meaningfulWords.length > 0 && meaningfulWords.every((word) => draft.slug.includes(word));
    checks.push(keyphraseCheck("keyphrase-slug", "Keyphrase terms in slug", slugContainsTerms, "Include the meaningful keyphrase terms without forcing stop words into the slug", "warn"));

    const escaped = keyphrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const uses = escaped ? (plainText(body).match(new RegExp(escaped, "gi")) ?? []).length : 0;
    const density = Math.round((uses / Math.max(1, plainText(body).split(/\s+/).length)) * 1000) / 10;
    checks.push({
      id: "keyphrase-usage",
      group: "seo",
      label: "Natural keyphrase use",
      status: uses === 0 ? "warn" : density > 2.5 ? "warn" : "pass",
      detail: uses === 0 ? "The exact phrase is absent from the article body" : `${uses} exact use${uses === 1 ? "" : "s"}, about ${density}% of body words`,
    });
  }

  const internalLinks = (body.match(/\]\(\/(?:blog|organizations|projects|tech-stack|topics|yearly)[^)]*\)/g) ?? []).length;
  checks.push({ id: "internal-links", group: "seo", label: "Relevant internal links", status: internalLinks >= 1 ? "pass" : "warn", detail: internalLinks ? `${internalLinks} relevant internal link${internalLinks === 1 ? "" : "s"}` : "Link to at least one genuinely useful related page" });

  const externalUrls = [...body.matchAll(/\]\((https?:\/\/[^)\s]+)[^)]*\)/g)].map((match) => match[1]);
  checks.push({ id: "external-links", group: "seo", label: "External sources", status: externalUrls.length >= 1 ? "pass" : "warn", detail: externalUrls.length ? `${externalUrls.length} external source link${externalUrls.length === 1 ? "" : "s"}` : "Cite authoritative primary sources for factual claims" });

  const uniqueTags = new Set(draft.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  checks.push({ id: "tags-count", group: "seo", label: "Focused tags", status: uniqueTags.size >= 2 && uniqueTags.size <= 6 && uniqueTags.size === draft.tags.length ? "pass" : "warn", detail: `${uniqueTags.size} unique tag${uniqueTags.size === 1 ? "" : "s"}; use 2 to 6 focused tags without duplicates` });

  const canonical = draft.canonical?.trim() ?? "";
  const canonicalValid = canonical === "" || canonical.startsWith("/") || /^https:\/\/[^\s]+$/i.test(canonical);
  checks.push({ id: "canonical", group: "seo", label: "Canonical URL", status: canonicalValid ? "pass" : "fail", detail: canonical === "" ? "The post will use its default self-canonical" : canonicalValid ? "Canonical override has a valid root-relative or HTTPS format" : "Use a root-relative path or a complete HTTPS URL" });

  checks.push({ id: "author", group: "seo", label: "Author attribution", status: draft.author?.trim() ? "pass" : "fail", detail: draft.author?.trim() ? `Assigned to ${draft.author}` : "Select a complete author profile" });
}

function addEvidenceChecks(checks: SeoCheck[], draft: DraftInput, sections: PostSection[], body: string) {
  const bodySections = sections.filter((section) => section.heading);
  const weakOpenings = bodySections
    .filter((section) => {
      const first = section.blocks.find((block) => block.type === "paragraph");
      if (!first || first.type !== "paragraph") return true;
      const sentence = first.text.split(/(?<=[.!?])\s/)[0] ?? "";
      const wordCount = sentence.split(/\s+/).filter(Boolean).length;
      return sentence.trim().endsWith("?") || /^(so|now|well|in this|let's|today|imagine|picture)\b/i.test(sentence) || wordCount > 40;
    })
    .map((section) => section.heading);
  checks.push({
    id: "answer-first",
    group: "geo",
    label: "Answer-first sections",
    status: bodySections.length === 0 ? "warn" : weakOpenings.length === 0 ? "pass" : weakOpenings.length <= 1 ? "warn" : "fail",
    detail: bodySections.length === 0 ? "No sections yet" : weakOpenings.length === 0 ? "Each section opens with a direct statement" : `Strengthen the opening of: ${weakOpenings.join(", ")}`,
  });

  const statBlocks = (body.match(/^:::stat /gm) ?? []).length;
  const concreteFigures = (body.match(/\b\d[\d,.]*\s?(?:%|percent|x\b|days?|hours?|years?|months?|weeks?|contributors?|organizations?|projects?)/gi) ?? []).length;
  const figureCount = statBlocks + concreteFigures;
  const target = draft.cornerstone ? 2 : 1;
  checks.push({ id: "data-points", group: "geo", label: "Concrete data points", status: figureCount >= target ? "pass" : figureCount ? "warn" : "fail", detail: figureCount >= target ? `${figureCount} concrete figure${figureCount === 1 ? "" : "s"}; verify and source each factual number` : `Add ${target} useful, source-backed data point${target === 1 ? "" : "s"} when the topic supports it` });

  const urls = [...body.matchAll(/\]\((https?:\/\/[^)\s]+)[^)]*\)/g)].map((match) => match[1]);
  const domains = new Set(urls.map(getDomain).filter(Boolean));
  const citationTarget = draft.cornerstone ? 2 : 1;
  checks.push({ id: "citations", group: "geo", label: "Authoritative citations", status: urls.length >= citationTarget ? "pass" : urls.length ? "warn" : "fail", detail: urls.length >= citationTarget ? `${urls.length} external citation${urls.length === 1 ? "" : "s"}` : `Cite at least ${citationTarget} relevant primary source${citationTarget === 1 ? "" : "s"}` });
  checks.push({ id: "source-diversity", group: "geo", label: "Source diversity", status: domains.size >= 2 ? "pass" : domains.size === 1 ? "warn" : "fail", detail: domains.size >= 2 ? `${domains.size} source domains support independent verification` : "Use more than one source domain when claims are not controlled by a single authority" });

  if (draft.updatedAt) {
    const ageDays = Math.floor((Date.now() - Date.parse(draft.updatedAt)) / 86_400_000);
    checks.push({
      id: "freshness",
      group: "geo",
      label: "Review date",
      status: Number.isNaN(ageDays) ? "warn" : ageDays <= 365 ? "pass" : ageDays <= 540 ? "warn" : "fail",
      detail: Number.isNaN(ageDays) ? "Set a valid published or updated date" : ageDays <= 365 ? `Reviewed ${ageDays} days ago` : `Last reviewed ${ageDays} days ago; recheck time-sensitive claims before changing the date`,
    });
  }
}

function addStructureChecks(checks: SeoCheck[], draft: DraftInput, sections: PostSection[], body: string, h2Count: number) {
  const tldrLength = draft.tldr.trim().length;
  checks.push({ id: "tldr", group: "structure", label: "In brief summary", status: tldrLength === 0 ? "fail" : tldrLength >= 150 && tldrLength <= 500 ? "pass" : "warn", detail: tldrLength === 0 ? "Add a concise reader orientation" : `${tldrLength} chars; aim for 150 to 500 across direct sentences` });

  checks.push({ id: "takeaways", group: "structure", label: "Key takeaways", status: draft.keyTakeaways.length >= 3 ? "pass" : draft.keyTakeaways.length ? "warn" : "fail", detail: `${draft.keyTakeaways.length} takeaway${draft.keyTakeaways.length === 1 ? "" : "s"}; include enough to capture the decisions and actions that matter` });

  const completeFaqs = draft.faqs.filter((faq) => faq.q.trim() && faq.a.trim());
  const incompleteFaqs = draft.faqs.length - completeFaqs.length;
  const weakFaqs = completeFaqs.filter((faq) => {
    const answerWords = faq.a.trim().split(/\s+/).filter(Boolean).length;
    const questionWords = faq.q.trim().split(/\s+/).filter(Boolean).length;
    return !faq.q.trim().endsWith("?") || questionWords < 4 || answerWords < 18;
  });
  const normalizedQuestions = completeFaqs.map((faq) => faq.q.trim().toLowerCase());
  const duplicateFaqs = normalizedQuestions.length - new Set(normalizedQuestions).size;
  checks.push({
    id: "faqs",
    group: "structure",
    label: "FAQ usefulness",
    status: incompleteFaqs || duplicateFaqs ? "fail" : weakFaqs.length ? "warn" : completeFaqs.length ? "pass" : "warn",
    detail: incompleteFaqs
      ? `${incompleteFaqs} incomplete FAQ item${incompleteFaqs === 1 ? "" : "s"}`
      : duplicateFaqs
        ? `${duplicateFaqs} duplicate question${duplicateFaqs === 1 ? "" : "s"}`
        : weakFaqs.length
          ? `${weakFaqs.length} answer${weakFaqs.length === 1 ? "" : "s"} may not stand alone or the question format is unclear`
          : completeFaqs.length
            ? `${completeFaqs.length} complete FAQ${completeFaqs.length === 1 ? "" : "s"}; there is no maximum when every item serves real search intent`
            : "Optional: add FAQs only for real questions the article can answer better than the main sections",
  });

  const hasH1 = /^# /m.test(body);
  checks.push({ id: "no-h1", group: "structure", label: "Single H1", status: hasH1 ? "fail" : "pass", detail: hasH1 ? "Remove the H1 from the body because the post title is already the H1" : "The post title is the only H1" });
  checks.push({ id: "h2-count", group: "structure", label: "Section headings", status: h2Count >= 2 ? "pass" : h2Count === 1 ? "warn" : "fail", detail: `${h2Count} H2 section${h2Count === 1 ? "" : "s"}` });

  const headingLevels = [...body.matchAll(/^(#{2,6})\s+.+$/gm)].map((match) => match[1].length);
  const jumps = headingLevels.filter((level, index) => index > 0 && level > headingLevels[index - 1] + 1).length;
  checks.push({ id: "heading-order", group: "structure", label: "Heading hierarchy", status: jumps === 0 ? "pass" : "fail", detail: jumps === 0 ? "Heading levels do not skip hierarchy" : `${jumps} heading level jump${jumps === 1 ? "" : "s"} found` });

  const sectionIds = sections.filter((section) => section.heading).map((section) => slugify(section.heading));
  const duplicateIds = sectionIds.length - new Set(sectionIds).size;
  checks.push({ id: "heading-ids", group: "structure", label: "Unique section anchors", status: duplicateIds === 0 ? "pass" : "fail", detail: duplicateIds === 0 ? "Every H2 creates a unique anchor" : `${duplicateIds} duplicate H2 anchor${duplicateIds === 1 ? "" : "s"}; rename repeated headings` });

  addImageChecks(checks, draft, sections, body);

  const longSections = sections.filter((section) => section.heading && sectionWords(section) > 350).map((section) => section.heading);
  checks.push({ id: "section-length", group: "structure", label: "Section length", status: longSections.length === 0 ? "pass" : "warn", detail: longSections.length === 0 ? "All sections are under about 350 words" : `Review long sections: ${longSections.join(", ")}` });
}

function addImageChecks(checks: SeoCheck[], draft: DraftInput, sections: PostSection[], body: string) {
  const markdownImages = [...body.matchAll(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/gm)].map((match) => ({ src: match[2], alt: match[1], caption: match[3] ?? "" }));
  const planned = draft.images ?? [];
  const uploaded = planned.filter((image) => image.src);
  const missingAlt = markdownImages.filter((image) => !image.alt.trim()).length + uploaded.filter((image) => !image.alt.trim()).length;
  const missingCaption = markdownImages.filter((image) => !image.caption.trim()).length + uploaded.filter((image) => !image.caption?.trim()).length;
  const assetCount = markdownImages.length + uploaded.length;
  checks.push({
    id: "image-accessibility",
    group: "structure",
    label: "Image accessibility",
    status: missingAlt ? "fail" : assetCount === 0 ? "warn" : missingCaption ? "warn" : "pass",
    detail: missingAlt ? `${missingAlt} uploaded image${missingAlt === 1 ? "" : "s"} missing alt text` : assetCount === 0 ? planned.length ? `${planned.length} brief${planned.length === 1 ? " is" : "s are"} waiting for assets` : "No images or briefs yet" : missingCaption ? `${missingCaption} image${missingCaption === 1 ? "" : "s"} without a useful caption` : `${assetCount} uploaded image${assetCount === 1 ? "" : "s"} with alt text and captions`,
  });

  const incompleteBriefs = planned.filter((image) => !image.purpose.trim() || !image.filename.trim() || !image.prompt.trim() || !image.alt.trim() || image.width < 1 || image.height < 1).length;
  checks.push({ id: "image-briefs", group: "structure", label: "Image brief completeness", status: planned.length === 0 ? "warn" : incompleteBriefs ? "fail" : "pass", detail: planned.length === 0 ? "Add a brief only when a visual has a clear reader or distribution purpose" : incompleteBriefs ? `${incompleteBriefs} incomplete image brief${incompleteBriefs === 1 ? "" : "s"}` : `${planned.length} production-ready image brief${planned.length === 1 ? "" : "s"}` });

  const hero = planned.find((image) => image.placement === "hero");
  const manualHero = draft.ogImage?.trim();
  const heroDimensionsOk = !hero || (hero.width === 1200 && hero.height === 630);
  checks.push({ id: "social-image", group: "structure", label: "Hero and social image", status: manualHero || (hero?.src && heroDimensionsOk) ? "pass" : hero && !heroDimensionsOk ? "fail" : "warn", detail: manualHero ? "A manual hero path is set" : hero?.src && heroDimensionsOk ? "The 1200 x 630 hero asset is uploaded" : hero && !heroDimensionsOk ? `Hero brief is ${hero.width} x ${hero.height}; use 1200 x 630` : hero ? "Hero brief exists but the asset is not uploaded" : "No hero brief or image path is set" });

  const sectionIds = new Set(sections.map((section) => section.id));
  const invalidPlacements = planned.filter((image) => image.placement.startsWith("after-section:") && !sectionIds.has(image.placement.replace("after-section:", ""))).length;
  checks.push({ id: "image-placement", group: "structure", label: "Image placement", status: invalidPlacements ? "fail" : "pass", detail: invalidPlacements ? `${invalidPlacements} image placement${invalidPlacements === 1 ? " points" : "s point"} to a missing section` : "Every image placement maps to the current article structure" });
}

function addReadabilityChecks(
  checks: SeoCheck[],
  draft: DraftInput,
  sections: PostSection[],
  paragraphs: string[],
  plainBody: string,
  words: number,
) {
  const passMinimum = draft.cornerstone ? 1500 : 600;
  const warnMinimum = draft.cornerstone ? 1000 : 300;
  checks.push(range("word-count", "readability", "Substantive depth", words, [passMinimum, 100000], [warnMinimum, 100000], `${words} words; ${draft.cornerstone ? "cornerstone drafts should reach at least 1,500 useful words" : "aim for at least 600 useful words"}`));

  const sentences = plainBody.split(/[.!?]+\s/).filter((sentence) => sentence.trim().length > 0);
  const average = sentences.length ? Math.round(plainBody.split(/\s+/).filter(Boolean).length / sentences.length) : 0;
  checks.push({ id: "sentence-length", group: "readability", label: "Average sentence length", status: average === 0 ? "warn" : average <= 20 ? "pass" : average <= 26 ? "warn" : "fail", detail: average === 0 ? "No prose yet" : `${average} words per sentence; aim for 20 or fewer on average` });

  const longParagraphs = paragraphs.filter((paragraph) => paragraph.split(/\s+/).length > 120).length;
  checks.push({ id: "paragraph-length", group: "readability", label: "Paragraph length", status: longParagraphs === 0 ? "pass" : "warn", detail: longParagraphs === 0 ? "Paragraphs remain scannable" : `${longParagraphs} paragraph${longParagraphs === 1 ? " is" : "s are"} over 120 words` });

  const emptySections = sections.filter((section) => section.heading && sectionWords(section) === 0).length;
  checks.push({ id: "empty-sections", group: "readability", label: "Complete sections", status: emptySections === 0 ? "pass" : "fail", detail: emptySections === 0 ? "Every section contains content" : `${emptySections} empty section${emptySections === 1 ? "" : "s"}` });
}

function keyphraseCheck(id: string, label: string, passed: boolean, failure: string, failureStatus: CheckStatus = "fail"): SeoCheck {
  return { id, group: "seo", label, status: passed ? "pass" : failureStatus, detail: passed ? "Present" : failure };
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|:-]/g, " ");
}

function sectionWords(section: PostSection): number {
  const blockText = (block: PostBlock): string => {
    if ("text" in block) return block.text;
    if (block.type === "list") return block.items.join(" ");
    if (block.type === "tasklist") return block.items.map((item) => item.text).join(" ");
    if (block.type === "table") return [...block.header, ...block.rows.flat()].join(" ");
    return "";
  };
  return section.blocks.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;
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
  const status: CheckStatus = value >= pass[0] && value <= pass[1] ? "pass" : value >= warn[0] && value <= warn[1] ? "warn" : "fail";
  return { id, group, label, status, detail };
}

export function seoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0;
  const points = checks.reduce((sum, check) => sum + (check.status === "pass" ? 1 : check.status === "warn" ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}
