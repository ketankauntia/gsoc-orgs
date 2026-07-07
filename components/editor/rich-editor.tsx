"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TextStyle, FontSize, Color } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconChartBar,
  IconClearFormatting,
  IconCode,
  IconColumnInsertRight,
  IconHighlight,
  IconInfoSquareRounded,
  IconItalic,
  IconLink,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconPhoto,
  IconRowInsertBottom,
  IconSeparatorHorizontal,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTablePlus,
  IconTrash,
  IconUnderline,
} from "@tabler/icons-react";
import { markdownToTiptap, tiptapToMarkdown } from "@/lib/editor/markdown-tiptap";
import { Callout, Stat, EditorImage } from "@/components/editor/tiptap-nodes";
import { ImageDialog } from "@/components/editor/image-dialog";
import { cn } from "@/lib/utils";

/** WYSIWYG editor over our constrained markdown. Emits markdown so `content/posts/*.md` stays canonical. */
export function RichEditor({
  value,
  onChange,
  uploadSlug,
}: {
  value: string;
  onChange: (markdown: string) => void;
  /** Current post slug — uploads are stored under public/blog/<slug>/. */
  uploadSlug?: string;
}) {
  // Tracks the markdown the editor itself last produced, so external updates
  // (mode switch, post load) re-sync without an infinite loop.
  const emitted = useRef(value);
  const [imageOpen, setImageOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noreferrer", class: "text-primary underline underline-offset-4" },
        },
      }),
      Highlight,
      TextStyle,
      FontSize,
      Color,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: false }),
      TableKit.configure({ table: { resizable: true } }),
      EditorImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "Write your post… use the toolbar or markdown shortcuts" }),
      Callout,
      Stat,
    ],
    content: markdownToTiptap(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[55vh] rounded-b-lg border border-t-0 bg-background px-4 py-3 outline-none " +
          "[&_h2]:mt-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold " +
          "[&_h3]:mt-3 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold " +
          "[&_p]:my-2 [&_p]:leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground " +
          "[&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm " +
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[0.9em] " +
          "[&_mark]:rounded [&_mark]:bg-primary/20 [&_mark]:px-0.5 " +
          "[&_hr]:my-4 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border " +
          "[&_h1]:mt-4 [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-bold " +
          "[&_h4]:mt-3 [&_h4]:font-heading [&_h4]:text-lg [&_h4]:font-semibold " +
          "[&_h5]:mt-2 [&_h5]:font-heading [&_h5]:font-semibold [&_h6]:mt-2 [&_h6]:font-heading [&_h6]:font-semibold " +
          "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
          "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold " +
          "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 " +
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 " +
          "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
      },
    },
    onUpdate: ({ editor }) => {
      const md = tiptapToMarkdown(editor.getJSON() as never);
      emitted.current = md;
      onChange(md);
    },
  });

  // Re-sync when the markdown changes from outside (e.g. switched from markdown mode, loaded a different post).
  useEffect(() => {
    if (editor && value !== emitted.current) {
      emitted.current = value;
      editor.commands.setContent(markdownToTiptap(value));
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} onImage={() => setImageOpen(true)} />
      <EditorContent editor={editor} />
      <ImageDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        uploadSlug={uploadSlug}
        onInsert={({ src, alt, description }) =>
          editor
            .chain()
            .focus()
            .setImage({ src, alt, ...(description ? { title: description } : {}) })
            .run()
        }
      />
    </div>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  function addLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const headingValue = [1, 2, 3, 4, 5, 6].find((l) => editor.isActive("heading", { level: l }));
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined)?.replace("px", "") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border bg-card p-1">
      {/* Block type */}
      <select
        aria-label="Text style"
        value={headingValue ? `h${headingValue}` : "p"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }}
        className="h-8 rounded-md border bg-background px-1.5 text-sm outline-none"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>

      {/* Font size */}
      <select
        aria-label="Font size"
        value={currentSize}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") editor.chain().focus().unsetFontSize().run();
          else editor.chain().focus().setFontSize(`${v}px`).run();
        }}
        className="h-8 rounded-md border bg-background px-1.5 text-sm outline-none"
      >
        <option value="">Size</option>
        {[12, 14, 16, 18, 20, 24, 30, 36, 48].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Text color */}
      <label className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent" title="Text color">
        <span className="text-sm font-bold" style={{ color: (editor.getAttributes("textStyle").color as string) || undefined }}>A</span>
        <input
          type="color"
          className="absolute size-0 opacity-0"
          value={(editor.getAttributes("textStyle").color as string) || "#000000"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <TB onClick={() => editor.chain().focus().unsetColor().unsetFontSize().run()} label="Clear color & size"><span className="text-xs">A⊘</span></TB>

      <Divider />
      <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold"><IconBold className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic"><IconItalic className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline"><IconUnderline className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Strikethrough"><IconStrikethrough className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} label="Highlight"><IconHighlight className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} label="Subscript"><IconSubscript className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} label="Superscript"><IconSuperscript className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} label="Inline code"><IconCode className="size-4" /></TB>
      <TB onClick={addLink} active={editor.isActive("link")} label="Link"><IconLink className="size-4" /></TB>

      <Divider />
      <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list"><IconList className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list"><IconListNumbers className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} label="Task list"><IconListCheck className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Quote"><IconBlockquote className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="Code block"><span className="font-mono text-xs">{"{}"}</span></TB>
      <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Divider"><IconSeparatorHorizontal className="size-4" /></TB>

      <Divider />
      <TB onClick={onImage} label="Insert image"><IconPhoto className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Insert table"><IconTablePlus className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().insertContent({ type: "callout", attrs: { title: "Note" }, content: [{ type: "paragraph" }] }).run()} label="Callout box"><IconInfoSquareRounded className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().insertContent({ type: "stat", attrs: { value: "", label: "" } }).run()} label="Stat block"><IconChartBar className="size-4" /></TB>

      {editor.isActive("table") && (
        <>
          <Divider />
          <TB onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add column"><IconColumnInsertRight className="size-4" /></TB>
          <TB onClick={() => editor.chain().focus().addRowAfter().run()} label="Add row"><IconRowInsertBottom className="size-4" /></TB>
          <TB onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete column"><IconTable className="size-4" /></TB>
          <TB onClick={() => editor.chain().focus().deleteTable().run()} label="Delete table"><IconTrash className="size-4" /></TB>
        </>
      )}

      <Divider />
      <TB onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Clear formatting"><IconClearFormatting className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().undo().run()} label="Undo"><IconArrowBackUp className="size-4" /></TB>
      <TB onClick={() => editor.chain().focus().redo().run()} label="Redo"><IconArrowForwardUp className="size-4" /></TB>
    </div>
  );
}

function TB({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
        active && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}
