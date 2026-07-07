import type { PostBlock, PostSection } from "./types";

/**
 * Parser for the constrained authoring format described in docs/CONTENT-FORMAT.md.
 * Client-safe (no fs) on purpose — the /editor live preview reuses it in the browser.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Splits a markdown body into H2 sections of typed blocks. Content before the first `##` becomes a heading-less intro section. */
export function parseSections(body: string): PostSection[] {
  const sections: PostSection[] = [];
  let current: PostSection = { id: "intro", heading: "", blocks: [] };
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  const flushSection = () => {
    if (current.blocks.length > 0 || current.heading) sections.push(current);
  };

  while (i < lines.length) {
    const line = lines[i];

    // Headings — H2 starts a section (TOC anchor); H1/H3–H6 are heading blocks.
    const heading = line.match(/^(#{1,6}) (.*)$/);
    if (heading) {
      const level = heading[1].length;
      const hEl = heading[2].trim();
      if (level === 2) {
        flushSection();
        current = { id: slugify(hEl), heading: hEl, blocks: [] };
      } else {
        current.blocks.push({ type: "heading", level, text: hEl });
      }
      i++;
      continue;
    }

    // GFM table — a header row `| … |` followed by a separator `| --- | --- |`
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const splitRow = (l: string) =>
        l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const headerCells = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      current.blocks.push({ type: "table", header: headerCells, rows });
      continue;
    }

    // Task list — lines of `- [ ] ` / `- [x] `
    if (/^- \[[ xX]\] /.test(line)) {
      const items: { text: string; checked: boolean }[] = [];
      while (i < lines.length && /^- \[[ xX]\] /.test(lines[i])) {
        items.push({ checked: /^- \[[xX]\]/.test(lines[i]), text: lines[i].slice(6).trim() });
        i++;
      }
      current.blocks.push({ type: "tasklist", items });
      continue;
    }

    // Divider — a line of only --- or *** or ___
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      current.blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Code fence
    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "text";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      current.blocks.push({ type: "code", language, code: code.join("\n") });
      continue;
    }

    // Stat directive — single line: :::stat VALUE | LABEL
    if (line.startsWith(":::stat ")) {
      const [value, ...rest] = line.slice(8).split("|");
      current.blocks.push({
        type: "stat",
        value: value.trim(),
        label: rest.join("|").trim(),
      });
      i++;
      continue;
    }

    // Callout directive — :::callout TITLE ... closed by :::
    if (line.startsWith(":::callout")) {
      const title = line.slice(10).trim() || "Note";
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++; // closing :::
      current.blocks.push({ type: "callout", title, text: body.join(" ").trim() });
      continue;
    }

    // Image — ![alt](src "Optional caption") on its own line; caption renders as "Fig: …"
    const image = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/);
    if (image) {
      current.blocks.push({
        type: "image",
        alt: image[1].trim(),
        src: image[2],
        caption: image[3]?.trim() || undefined,
      });
      i++;
      continue;
    }

    // Blockquote — "— name" as the last quoted line becomes attribution
    if (line.startsWith("> ")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoted.push(lines[i].slice(2).trim());
        i++;
      }
      let attribution: string | undefined;
      if (quoted.length > 1 && quoted[quoted.length - 1].startsWith("— ")) {
        attribution = quoted.pop()!.slice(2).trim();
      }
      current.blocks.push({ type: "quote", text: quoted.join(" "), attribution });
      continue;
    }

    // Lists
    const isUnordered = (l: string) => /^[-*] /.test(l);
    const isOrdered = (l: string) => /^\d+\. /.test(l);
    if (isUnordered(line) || isOrdered(line)) {
      const ordered = isOrdered(line);
      const matches = ordered ? isOrdered : isUnordered;
      const items: string[] = [];
      while (i < lines.length && matches(lines[i])) {
        items.push(lines[i].replace(/^([-*]|\d+\.) /, "").trim());
        i++;
      }
      current.blocks.push({ type: "list", ordered: ordered || undefined, items });
      continue;
    }

    // Blank line — paragraph separator
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — consecutive plain lines join into one
    const para: string[] = [line.trim()];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6} |```|:::|> |[-*] |\d+\. |- \[[ xX]\] |\||!\[|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    current.blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  flushSection();
  return sections;
}

/** ~200 wpm, minimum 1 minute. */
export function estimateReadingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
