import { IconInfoCircle } from "@tabler/icons-react";
import type { PostBlock, PostSection } from "@/lib/blog/types";
import { Inline } from "./inline";

/** Renders structured sections. Headings carry ids so the TOC and deep links work; sections are self-contained for LLM extractability. */
export function PostBody({ sections }: { sections: PostSection[] }) {
  return (
    <div className="space-y-section">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.heading ? section.id : undefined}>
          {section.heading && (
            <h2
              id={section.id}
              className="scroll-mt-24 font-heading text-2xl font-semibold tracking-tight"
            >
              {section.heading}
            </h2>
          )}
          <div className="mt-4 space-y-4">
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Block({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="leading-relaxed text-foreground/90">
          <Inline text={block.text} />
        </p>
      );
    case "heading": {
      const Tag = `h${Math.min(Math.max(block.level, 1), 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const size =
        block.level <= 1
          ? "text-3xl"
          : block.level === 3
            ? "text-xl"
            : block.level === 4
              ? "text-lg"
              : "text-base";
      return (
        <Tag className={`scroll-mt-24 font-heading font-semibold tracking-tight ${size}`}>
          <Inline text={block.text} />
        </Tag>
      );
    }
    case "divider":
      return <hr className="border-border" />;
    case "tasklist":
      return (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed text-foreground/90">
              <input type="checkbox" checked={item.checked} readOnly className="mt-1.5 size-3.5 accent-primary" />
              <span className={item.checked ? "text-muted-foreground line-through" : undefined}>
                <Inline text={item.text} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i} className="border-b-2 border-border px-3 py-2 text-left font-semibold">
                    <Inline text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 align-top">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list": {
      const items = block.items.map((item) => (
        <li key={item} className="leading-relaxed text-foreground/90">
          <Inline text={item} />
        </li>
      ));
      return block.ordered ? (
        <ol className="list-decimal space-y-2 pl-6 marker:text-primary">{items}</ol>
      ) : (
        <ul className="list-disc space-y-2 pl-6 marker:text-primary">{items}</ul>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
          <p>
            &ldquo;
            <Inline text={block.text} />
            &rdquo;
          </p>
          {block.attribution && <footer className="mt-1 text-sm not-italic">— {block.attribution}</footer>}
        </blockquote>
      );
    case "callout":
      return (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <IconInfoCircle className="size-4" />
            {block.title}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            <Inline text={block.text} />
          </p>
        </div>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm">
          <code>{block.code}</code>
        </pre>
      );
    case "stat":
      return (
        <div className="rounded-lg border bg-card p-5 text-center">
          <p className="font-heading text-4xl font-bold text-primary">{block.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{block.label}</p>
        </div>
      );
    case "image":
      return (
        <figure>
          {/*
            Plain <img>: content images (often SVG diagrams) have unknown build-time dimensions,
            and next/image doesn't optimize SVGs. Raster images with known dims should move to
            next/image (AVIF/WebP is configured in next.config). Lazy + async to stay off the
            critical path; aspect-ratio hint reduces layout shift for wide diagrams.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full rounded-lg border bg-card object-contain"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              Fig: {block.caption}
            </figcaption>
          )}
        </figure>
      );
  }
}
