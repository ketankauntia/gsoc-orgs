import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * Renders inline markdown from parsed block text:
 * **bold**, *italic*, ~~strike~~, ==highlight==, `code`, [text](url),
 * plus a whitelisted HTML passthrough for styling the editor produces:
 * <u>, <sub>, <sup>, and <span style="font-size:…;color:…">.
 * Kept dependency-free so the editor preview + RSS can reuse the same grammar.
 */

const INLINE_PATTERN =
  /(<span style="[^"]*">[\s\S]*?<\/span>|<u>[\s\S]*?<\/u>|<sub>[\s\S]*?<\/sub>|<sup>[\s\S]*?<\/sup>|\*\*[^*]+\*\*|~~[^~]+~~|==[^=]+==|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE_PATTERN);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{renderPart(part)}</Fragment>
      ))}
    </>
  );
}

/** Parse a `font-size:20px;color:#e11` style into a whitelisted CSSProperties. */
function safeStyle(raw: string): CSSProperties {
  const style: CSSProperties = {};
  for (const decl of raw.split(";")) {
    const [prop, value] = decl.split(":").map((s) => s.trim());
    if (prop === "font-size" && /^\d{1,3}(px|rem|em)$/.test(value)) style.fontSize = value;
    if (prop === "color" && /^(#[0-9a-fA-F]{3,8}|[a-z]+)$/.test(value)) style.color = value;
  }
  return style;
}

function renderPart(part: string): ReactNode {
  const span = part.match(/^<span style="([^"]*)">([\s\S]*?)<\/span>$/);
  if (span) return <span style={safeStyle(span[1])}><Inline text={span[2]} /></span>;
  const u = part.match(/^<u>([\s\S]*?)<\/u>$/);
  if (u) return <u><Inline text={u[1]} /></u>;
  const sub = part.match(/^<sub>([\s\S]*?)<\/sub>$/);
  if (sub) return <sub><Inline text={sub[1]} /></sub>;
  const sup = part.match(/^<sup>([\s\S]*?)<\/sup>$/);
  if (sup) return <sup><Inline text={sup[1]} /></sup>;
  if (part.startsWith("**") && part.endsWith("**")) {
    return <strong>{part.slice(2, -2)}</strong>;
  }
  if (part.startsWith("~~") && part.endsWith("~~")) {
    return <s>{part.slice(2, -2)}</s>;
  }
  if (part.startsWith("==") && part.endsWith("==")) {
    return <mark className="rounded bg-primary/20 px-0.5 text-foreground">{part.slice(2, -2)}</mark>;
  }
  if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
    return <em>{part.slice(1, -1)}</em>;
  }
  if (part.startsWith("`") && part.endsWith("`")) {
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    );
  }
  const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) {
    const external = link[2].startsWith("http");
    return (
      <a
        href={link[2]}
        {...(external && { target: "_blank", rel: "noreferrer" })}
        className="font-medium text-primary underline underline-offset-4 hover:no-underline"
      >
        {link[1]}
      </a>
    );
  }
  return part;
}
