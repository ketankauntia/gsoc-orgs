"use client";

import { useRef, useState } from "react";
import { IconLoader2, IconUpload } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/blog-ui/dialog";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { Label } from "@/components/blog-ui/label";

export type ImageData = { src: string; alt: string; description: string };

/** Insert-image dialog: upload a file (dev) or paste a URL, plus alt text + description (caption). Uploads are stored per post under public/blog/<slug>/. */
export function ImageDialog({
  open,
  onOpenChange,
  onInsert,
  uploadSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (data: ImageData) => void;
  /** Current post slug — decides the upload folder (falls back to "misc"). */
  uploadSlug?: string;
}) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setSrc("");
    setAlt("");
    setDescription("");
    setError("");
    setUploading(false);
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      if (uploadSlug) body.append("slug", uploadSlug);
      const res = await fetch("/api/editor/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setSrc(data.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function insert() {
    if (!src) {
      setError("Add an image — upload a file or paste a URL.");
      return;
    }
    if (!alt.trim()) {
      setError("Alt text is required (SEO + accessibility).");
      return;
    }
    onInsert({ src: src.trim(), alt: alt.trim(), description: description.trim() });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add image</DialogTitle>
          <DialogDescription>Upload a file or paste a URL, then describe it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Image file</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
                {uploading ? "Uploading…" : "Upload file"}
              </Button>
              <span className="text-xs text-muted-foreground">PNG, JP, WebP, AVIF, GIF, SVG · ≤8 MB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>…or image URL</Label>
            <Input
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="/blog/diagram.svg or https://…"
            />
          </div>

          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="max-h-40 rounded border object-contain" />
          )}

          <div className="space-y-1.5">
            <Label>Alt text (required — SEO &amp; screen readers)</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the image shows" />
          </div>

          <div className="space-y-1.5">
            <Label>Description / caption (shown below the image as “Fig: …”)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional caption readers will see"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={insert} disabled={uploading}>
            Insert image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
