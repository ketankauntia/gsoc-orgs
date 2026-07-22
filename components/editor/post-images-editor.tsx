"use client";

import { useRef, useState } from "react";
import { IconChevronDown, IconChevronUp, IconCopy, IconLoader2, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { Badge } from "@/components/blog-ui/badge";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { Label } from "@/components/blog-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/blog-ui/select";
import { Textarea } from "@/components/blog-ui/textarea";
import type { PostImage, PostImageStatus, PostSection } from "@/lib/blog/types";

const STATUSES: PostImageStatus[] = ["brief", "generating", "generated", "approved", "placed", "rejected"];
const KINDS: PostImage["kind"][] = ["hero", "diagram", "chart", "screenshot", "illustration"];

export function PostImagesEditor({
  images,
  sections,
  slug,
  canUpload,
  onChange,
}: {
  images: PostImage[];
  sections: PostSection[];
  slug: string;
  canUpload: boolean;
  onChange: (images: PostImage[]) => void;
}) {
  function update(index: number, patch: Partial<PostImage>) {
    onChange(images.map((image, current) => (current === index ? { ...image, ...patch } : image)));
  }

  function addImage() {
    const number = images.length + 1;
    onChange([
      ...images,
      {
        id: `image-${number}`,
        kind: "illustration",
        purpose: "",
        filename: "",
        placement: "after-intro",
        prompt: "",
        status: "brief",
        alt: "",
        caption: "",
        width: 1200,
        height: 630,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        Store production-ready briefs here. Public pages render only uploaded images marked approved or placed.
      </div>
      <div className="flex items-center justify-between">
        <Label>Image briefs and assets ({images.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <IconPlus className="size-4" /> Add image
        </Button>
      </div>
      {images.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No image brief yet. Add only visuals that clarify the article or improve its distribution preview.
        </p>
      )}
      {images.map((image, index) => (
        <ImageCard
          key={`${image.id}-${index}`}
          image={image}
          index={index}
          count={images.length}
          sections={sections}
          slug={slug}
          canUpload={canUpload}
          onUpdate={(patch) => update(index, patch)}
          onMove={(to) => onChange(moveItem(images, index, to))}
          onRemove={() => onChange(images.filter((_, current) => current !== index))}
        />
      ))}
    </div>
  );
}

function ImageCard({
  image,
  index,
  count,
  sections,
  slug,
  canUpload,
  onUpdate,
  onMove,
  onRemove,
}: {
  image: PostImage;
  index: number;
  count: number;
  sections: PostSection[];
  slug: string;
  canUpload: boolean;
  onUpdate: (patch: Partial<PostImage>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("slug", slug);
      const response = await fetch("/api/editor/upload", { method: "POST", body });
      const data = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !data.path) throw new Error(data.error ?? "Upload failed");
      onUpdate({ src: data.path, status: "generated" });
      setMessage(`Uploaded to ${data.path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(image.prompt);
    setMessage("Prompt copied");
  }

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col">
          <button type="button" aria-label="Move image up" disabled={index === 0} onClick={() => onMove(index - 1)} className="text-muted-foreground disabled:opacity-30">
            <IconChevronUp className="size-4" />
          </button>
          <button type="button" aria-label="Move image down" disabled={index === count - 1} onClick={() => onMove(index + 1)} className="text-muted-foreground disabled:opacity-30">
            <IconChevronDown className="size-4" />
          </button>
        </div>
        <strong className="mr-auto text-sm">{image.purpose || image.filename || `Image ${index + 1}`}</strong>
        <Badge variant="outline">{image.status}</Badge>
        <Button type="button" variant="ghost" size="icon" aria-label="Remove image" onClick={onRemove}>
          <IconTrash className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField label="Purpose">
          <Input value={image.purpose} onChange={(event) => onUpdate({ purpose: event.target.value })} placeholder="What this visual helps the reader understand" />
        </ImageField>
        <ImageField label="Target filename">
          <Input value={image.filename} onChange={(event) => onUpdate({ filename: event.target.value })} placeholder="descriptive-image-name.webp" />
        </ImageField>
        <ImageField label="Kind">
          <Select value={image.kind} onValueChange={(value) => onUpdate({ kind: value as PostImage["kind"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map((kind) => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent>
          </Select>
        </ImageField>
        <ImageField label="Placement">
          <Select value={image.placement} onValueChange={(value) => onUpdate({ placement: value as PostImage["placement"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero and social preview</SelectItem>
              <SelectItem value="after-intro">After introduction</SelectItem>
              {sections.filter((section) => section.heading).map((section) => (
                <SelectItem key={section.id} value={`after-section:${section.id}`}>After: {section.heading}</SelectItem>
              ))}
              <SelectItem value="before-takeaways">Before key takeaways</SelectItem>
            </SelectContent>
          </Select>
        </ImageField>
        <ImageField label="Status">
          <Select value={image.status} onValueChange={(value) => onUpdate({ status: value as PostImageStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
          </Select>
        </ImageField>
        <div className="grid grid-cols-2 gap-2">
          <ImageField label="Width">
            <Input type="number" min={1} value={image.width} onChange={(event) => onUpdate({ width: Number(event.target.value) || 1 })} />
          </ImageField>
          <ImageField label="Height">
            <Input type="number" min={1} value={image.height} onChange={(event) => onUpdate({ height: Number(event.target.value) || 1 })} />
          </ImageField>
        </div>
      </div>

      <ImageField label="Generation or production prompt">
        <Textarea value={image.prompt} onChange={(event) => onUpdate({ prompt: event.target.value })} className="min-h-32" />
      </ImageField>
      <Button type="button" variant="outline" size="sm" onClick={copyPrompt} disabled={!image.prompt}>
        <IconCopy className="size-4" /> Copy prompt
      </Button>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField label="Alt text">
          <Input value={image.alt} onChange={(event) => onUpdate({ alt: event.target.value })} placeholder="Describe the useful visual information" />
        </ImageField>
        <ImageField label="Caption">
          <Input value={image.caption ?? ""} onChange={(event) => onUpdate({ caption: event.target.value })} placeholder="Optional reader-facing context" />
        </ImageField>
      </div>

      <ImageField label="Uploaded asset path">
        <div className="flex flex-wrap gap-2">
          <Input className="min-w-64 flex-1" value={image.src ?? ""} onChange={(event) => onUpdate({ src: event.target.value })} placeholder="/blog/post-slug/image.webp" />
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={!canUpload || !slug || uploading}>
            {uploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </ImageField>

      {image.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.src} alt={image.alt || "Image preview"} className="max-h-72 w-full rounded-lg border bg-card object-contain" />
      )}
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </section>
  );
}

function ImageField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
