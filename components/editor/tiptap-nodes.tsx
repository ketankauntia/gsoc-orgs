"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { IconInfoCircle, IconPhoto } from "@tabler/icons-react";

/** Callout node — editable title + rich body. Serializes to :::callout Title … ::: */
function CalloutView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper className="my-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
      <div className="mb-1 flex items-center gap-1.5" contentEditable={false}>
        <IconInfoCircle className="size-4 text-primary" />
        <input
          value={(node.attrs.title as string) ?? ""}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          placeholder="Callout title"
          className="w-full bg-transparent text-sm font-semibold text-primary outline-none"
        />
      </div>
      <NodeViewContent className="text-sm text-foreground/90" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes() {
    return { title: { default: "Note" } };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": "" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

/** Stat node — big value + label. Atom (no inner content). Serializes to :::stat value | label */
function StatView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper
      className="my-4 rounded-lg border bg-card p-4 text-center"
      contentEditable={false}
    >
      <input
        value={(node.attrs.value as string) ?? ""}
        onChange={(e) => updateAttributes({ value: e.target.value })}
        placeholder="42%"
        className="w-full bg-transparent text-center font-heading text-3xl font-bold text-primary outline-none"
      />
      <input
        value={(node.attrs.label as string) ?? ""}
        onChange={(e) => updateAttributes({ label: e.target.value })}
        placeholder="what the number means"
        className="mt-1 w-full bg-transparent text-center text-sm text-muted-foreground outline-none"
      />
    </NodeViewWrapper>
  );
}

export const Stat = Node.create({
  name: "stat",
  group: "block",
  atom: true,
  addAttributes() {
    return { value: { default: "" }, label: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-stat]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-stat": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StatView);
  },
});

/**
 * Image node with two editable data fields:
 *  - `alt`  → alt text (SEO + screen readers), not shown visually
 *  - `title` → description, rendered as the "Fig: …" caption below the image on the site
 * `src` may be an uploaded file path (/blog/…) or an external URL.
 */
function ImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title } = node.attrs as { src: string; alt: string; title: string };
  return (
    <NodeViewWrapper
      className={`my-3 rounded-lg border p-2 ${selected ? "ring-2 ring-primary" : ""}`}
      contentEditable={false}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="mx-auto max-h-80 rounded object-contain" />
      ) : (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <IconPhoto className="size-6" />
        </div>
      )}
      <div className="mt-2 space-y-1.5">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Alt text (SEO &amp; screen readers)
          </span>
          <input
            value={alt ?? ""}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            placeholder="Describe the image for accessibility"
            className="w-full rounded border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Description (shown below as “Fig: …”)
          </span>
          <input
            value={title ?? ""}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Caption shown under the image"
            className="w-full rounded border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
    </NodeViewWrapper>
  );
}

/** Base Image extension + our two-field NodeView. Keeps src/alt/title attrs (title = caption). */
export const EditorImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
