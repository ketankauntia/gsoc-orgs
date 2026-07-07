import { parseSections } from "@/lib/blog/parse";

/**
 * Bidirectional conversion between our constrained markdown and TipTap JSON.
 * The markdown files stay canonical — the rich editor is just a view over them.
 * Only features the site actually renders are supported, so WYSIWYG === output.
 */

// Loose TipTap JSON shapes (avoids depending on @tiptap types in this pure module).
type Mark = { type: string; attrs?: Record<string, unknown> };
type TNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TNode[];
  text?: string;
  marks?: Mark[];
};
export type TiptapDoc = { type: "doc"; content: TNode[] };

/* ---------- inline ---------- */

const INLINE =
  /(<span style="[^"]*">[\s\S]*?<\/span>|<u>[\s\S]*?<\/u>|<sub>[\s\S]*?<\/sub>|<sup>[\s\S]*?<\/sup>|\*\*[^*]+\*\*|~~[^~]+~~|==[^=]+==|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function text(value: string, marks?: Mark[]): TNode {
  return marks && marks.length ? { type: "text", text: value, marks } : { type: "text", text: value };
}

/** Add a mark to every node in a list (used when an HTML wrapper styles its inner content). */
function withMark(nodes: TNode[], mark: Mark): TNode[] {
  return nodes.map((n) => ({ ...n, marks: [...(n.marks ?? []), mark] }));
}

/** inline markdown/HTML-passthrough string → TipTap inline nodes */
function inlineToNodes(input: string): TNode[] {
  if (!input) return [];
  const nodes: TNode[] = [];
  for (const part of input.split(INLINE)) {
    if (part === "") continue;
    let m: RegExpMatchArray | null;
    if ((m = part.match(/^<span style="([^"]*)">([\s\S]*?)<\/span>$/))) {
      const attrs: Record<string, string> = {};
      for (const decl of m[1].split(";")) {
        const [p, v] = decl.split(":").map((s) => s.trim());
        if (p === "font-size") attrs.fontSize = v;
        if (p === "color") attrs.color = v;
      }
      nodes.push(...withMark(inlineToNodes(m[2]), { type: "textStyle", attrs }));
    } else if ((m = part.match(/^<u>([\s\S]*?)<\/u>$/))) {
      nodes.push(...withMark(inlineToNodes(m[1]), { type: "underline" }));
    } else if ((m = part.match(/^<sub>([\s\S]*?)<\/sub>$/))) {
      nodes.push(...withMark(inlineToNodes(m[1]), { type: "subscript" }));
    } else if ((m = part.match(/^<sup>([\s\S]*?)<\/sup>$/))) {
      nodes.push(...withMark(inlineToNodes(m[1]), { type: "superscript" }));
    } else if (/^\*\*[\s\S]+\*\*$/.test(part)) nodes.push(text(part.slice(2, -2), [{ type: "bold" }]));
    else if (/^~~[\s\S]+~~$/.test(part)) nodes.push(text(part.slice(2, -2), [{ type: "strike" }]));
    else if (/^==[\s\S]+==$/.test(part)) nodes.push(text(part.slice(2, -2), [{ type: "highlight" }]));
    else if (/^\*[\s\S]+\*$/.test(part)) nodes.push(text(part.slice(1, -1), [{ type: "italic" }]));
    else if (/^`[\s\S]+`$/.test(part)) nodes.push(text(part.slice(1, -1), [{ type: "code" }]));
    else {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) nodes.push(text(link[1], [{ type: "link", attrs: { href: link[2] } }]));
      else nodes.push(text(part));
    }
  }
  return nodes;
}

/** TipTap inline nodes → inline markdown/HTML string */
function nodesToInline(nodes: TNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return " ";
      let t = n.text ?? "";
      const has = (type: string) => n.marks?.some((m) => m.type === type);
      if (has("code")) t = "`" + t + "`";
      if (has("bold")) t = "**" + t + "**";
      if (has("italic")) t = "*" + t + "*";
      if (has("strike")) t = "~~" + t + "~~";
      if (has("highlight")) t = "==" + t + "==";
      const link = n.marks?.find((m) => m.type === "link");
      if (link) t = `[${t}](${link.attrs?.href ?? ""})`;
      // Styling passthrough (outermost).
      const ts = n.marks?.find((m) => m.type === "textStyle");
      if (ts) {
        const style = [
          ts.attrs?.fontSize ? `font-size:${ts.attrs.fontSize}` : "",
          ts.attrs?.color ? `color:${ts.attrs.color}` : "",
        ]
          .filter(Boolean)
          .join(";");
        if (style) t = `<span style="${style}">${t}</span>`;
      }
      if (has("underline")) t = `<u>${t}</u>`;
      if (has("subscript")) t = `<sub>${t}</sub>`;
      if (has("superscript")) t = `<sup>${t}</sup>`;
      return t;
    })
    .join("");
}

/* ---------- markdown → TipTap ---------- */

export function markdownToTiptap(md: string): TiptapDoc {
  const content: TNode[] = [];
  for (const section of parseSections(md)) {
    if (section.heading) {
      content.push({ type: "heading", attrs: { level: 2 }, content: inlineToNodes(section.heading) });
    }
    for (const b of section.blocks) {
      switch (b.type) {
        case "paragraph":
          content.push({ type: "paragraph", content: inlineToNodes(b.text) });
          break;
        case "heading":
          content.push({ type: "heading", attrs: { level: b.level }, content: inlineToNodes(b.text) });
          break;
        case "list":
          content.push({
            type: b.ordered ? "orderedList" : "bulletList",
            content: b.items.map((item) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: inlineToNodes(item) }],
            })),
          });
          break;
        case "tasklist":
          content.push({
            type: "taskList",
            content: b.items.map((item) => ({
              type: "taskItem",
              attrs: { checked: item.checked },
              content: [{ type: "paragraph", content: inlineToNodes(item.text) }],
            })),
          });
          break;
        case "table":
          content.push({
            type: "table",
            content: [
              {
                type: "tableRow",
                content: b.header.map((cell) => ({
                  type: "tableHeader",
                  content: [{ type: "paragraph", content: inlineToNodes(cell) }],
                })),
              },
              ...b.rows.map((row) => ({
                type: "tableRow",
                content: row.map((cell) => ({
                  type: "tableCell",
                  content: [{ type: "paragraph", content: inlineToNodes(cell) }],
                })),
              })),
            ],
          });
          break;
        case "quote": {
          const paras: TNode[] = [{ type: "paragraph", content: inlineToNodes(b.text) }];
          if (b.attribution) paras.push({ type: "paragraph", content: inlineToNodes(`— ${b.attribution}`) });
          content.push({ type: "blockquote", content: paras });
          break;
        }
        case "callout":
          content.push({
            type: "callout",
            attrs: { title: b.title },
            content: [{ type: "paragraph", content: inlineToNodes(b.text) }],
          });
          break;
        case "code":
          content.push({
            type: "codeBlock",
            attrs: { language: b.language === "text" ? null : b.language },
            content: b.code ? [{ type: "text", text: b.code }] : [],
          });
          break;
        case "stat":
          content.push({ type: "stat", attrs: { value: b.value, label: b.label } });
          break;
        case "image":
          content.push({ type: "image", attrs: { src: b.src, alt: b.alt, title: b.caption ?? null } });
          break;
        case "divider":
          content.push({ type: "horizontalRule" });
          break;
      }
    }
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/* ---------- TipTap → markdown ---------- */

function listToMarkdown(node: TNode, ordered: boolean): string {
  return (node.content ?? [])
    .map((item, i) => {
      const inner = (item.content ?? [])
        .map((p) => nodesToInline(p.content))
        .join(" ")
        .trim();
      return `${ordered ? `${i + 1}.` : "-"} ${inner}`;
    })
    .join("\n");
}

export function tiptapToMarkdown(doc: TiptapDoc | null | undefined): string {
  if (!doc?.content) return "";
  const parts: string[] = [];

  for (const node of doc.content) {
    switch (node.type) {
      case "heading": {
        const level = Math.min(Math.max((node.attrs?.level as number) ?? 2, 1), 6);
        parts.push(`${"#".repeat(level)} ${nodesToInline(node.content)}`);
        break;
      }
      case "paragraph": {
        const t = nodesToInline(node.content).trim();
        if (t) parts.push(t);
        break;
      }
      case "bulletList":
        parts.push(listToMarkdown(node, false));
        break;
      case "orderedList":
        parts.push(listToMarkdown(node, true));
        break;
      case "blockquote": {
        const lines = (node.content ?? []).map((p) => `> ${nodesToInline(p.content).trim()}`);
        parts.push(lines.join("\n"));
        break;
      }
      case "codeBlock": {
        const lang = (node.attrs?.language as string) ?? "";
        const code = (node.content ?? []).map((c) => c.text ?? "").join("");
        parts.push("```" + lang + "\n" + code + "\n```");
        break;
      }
      case "horizontalRule":
        parts.push("---");
        break;
      case "image": {
        const { src = "", alt = "", title } = node.attrs ?? {};
        parts.push(`![${alt}](${src}${title ? ` "${title}"` : ""})`);
        break;
      }
      case "callout": {
        const title = (node.attrs?.title as string) || "Note";
        const body = (node.content ?? []).map((p) => nodesToInline(p.content).trim()).join(" ");
        parts.push(`:::callout ${title}\n${body}\n:::`);
        break;
      }
      case "stat": {
        const { value = "", label = "" } = node.attrs ?? {};
        parts.push(`:::stat ${value} | ${label}`);
        break;
      }
      case "taskList": {
        const lines = (node.content ?? []).map((item) => {
          const checked = item.attrs?.checked ? "x" : " ";
          const inner = (item.content ?? []).map((p) => nodesToInline(p.content)).join(" ").trim();
          return `- [${checked}] ${inner}`;
        });
        parts.push(lines.join("\n"));
        break;
      }
      case "table": {
        const rows = (node.content ?? []).map((row) =>
          (row.content ?? []).map((cell) =>
            (cell.content ?? []).map((p) => nodesToInline(p.content)).join(" ").trim(),
          ),
        );
        if (rows.length === 0) break;
        const [header, ...body] = rows;
        const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
        parts.push(
          [line(header), `| ${header.map(() => "---").join(" | ")} |`, ...body.map(line)].join("\n"),
        );
        break;
      }
    }
  }

  return parts.join("\n\n").trim() + "\n";
}
