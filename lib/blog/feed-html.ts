import type { Post, PostBlock } from "./types";
import { absoluteUrl } from "@/lib/site";

/** Serializes a post to self-contained HTML for RSS `<content:encoded>`. Mirrors the on-site block vocabulary. */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const INLINE_PATTERN =
  /(<span style="[^"]*">[\s\S]*?<\/span>|<u>[\s\S]*?<\/u>|<sub>[\s\S]*?<\/sub>|<sup>[\s\S]*?<\/sup>|\*\*[^*]+\*\*|~~[^~]+~~|==[^=]+==|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/** Inline markdown/HTML-passthrough → HTML string — mirrors components/blog/inline.tsx. */
function inline(text: string): string {
  return text
    .split(INLINE_PATTERN)
    .map((part) => {
      if (!part) return "";
      // Whitelisted HTML passthrough — already valid HTML, keep inner content processed.
      const wrap = part.match(/^<(span style="[^"]*"|u|sub|sup)>([\s\S]*?)<\/(?:span|u|sub|sup)>$/);
      if (wrap) {
        const tag = part.match(/^<(\w+)/)![1];
        const open = part.slice(0, part.indexOf(">") + 1);
        return `${open}${inline(wrap[2])}</${tag}>`;
      }
      if (/^\*\*[\s\S]+\*\*$/.test(part)) return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
      if (/^~~[\s\S]+~~$/.test(part)) return `<s>${escapeHtml(part.slice(2, -2))}</s>`;
      if (/^==[\s\S]+==$/.test(part)) return `<mark>${escapeHtml(part.slice(2, -2))}</mark>`;
      if (/^\*[\s\S]+\*$/.test(part)) return `<em>${escapeHtml(part.slice(1, -1))}</em>`;
      if (/^`[\s\S]+`$/.test(part)) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const url = link[2].startsWith("/") ? absoluteUrl(link[2]) : link[2];
        return `<a href="${url}">${escapeHtml(link[1])}</a>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function block(b: PostBlock): string {
  switch (b.type) {
    case "paragraph":
      return `<p>${inline(b.text)}</p>`;
    case "heading": {
      const lvl = Math.min(Math.max(b.level, 1), 6);
      return `<h${lvl}>${inline(b.text)}</h${lvl}>`;
    }
    case "divider":
      return "<hr />";
    case "tasklist":
      return `<ul>${b.items
        .map((it) => `<li>${it.checked ? "☑" : "☐"} ${inline(it.text)}</li>`)
        .join("")}</ul>`;
    case "table":
      return `<table><thead><tr>${b.header
        .map((c) => `<th>${inline(c)}</th>`)
        .join("")}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag}>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${tag}>`;
    }
    case "quote":
      return `<blockquote><p>${inline(b.text)}</p>${b.attribution ? `<footer>— ${escapeHtml(b.attribution)}</footer>` : ""}</blockquote>`;
    case "callout":
      return `<aside><p><strong>${escapeHtml(b.title)}</strong></p><p>${inline(b.text)}</p></aside>`;
    case "code":
      return `<pre><code>${escapeHtml(b.code)}</code></pre>`;
    case "stat":
      return `<p><strong>${escapeHtml(b.value)}</strong> — ${escapeHtml(b.label)}</p>`;
    case "image":
      return `<figure><img src="${absoluteUrl(b.src)}" alt="${escapeHtml(b.alt)}" />${b.caption ? `<figcaption>Fig: ${escapeHtml(b.caption)}</figcaption>` : ""}</figure>`;
  }
}

export function postToFeedHtml(post: Post): string {
  const parts = [`<p><em>${inline(post.tldr)}</em></p>`];
  for (const section of post.sections) {
    if (section.heading) parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    parts.push(...section.blocks.map(block));
  }
  if (post.faqs.length > 0) {
    parts.push("<h2>FAQs</h2>");
    for (const faq of post.faqs) {
      parts.push(`<h3>${escapeHtml(faq.question)}</h3><p>${inline(faq.answer)}</p>`);
    }
  }
  return parts.join("\n");
}
