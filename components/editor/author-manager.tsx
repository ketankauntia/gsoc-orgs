"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/blog-ui/dialog";
import { Input } from "@/components/blog-ui/input";
import { Label } from "@/components/blog-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/blog-ui/select";
import { Switch } from "@/components/blog-ui/switch";
import { Textarea } from "@/components/blog-ui/textarea";
import { slugify } from "@/lib/blog/parse";
import type { Author } from "@/lib/blog/types";

type AuthorDraft = Author & { avatarUrl: string; githubUrl: string; linkedinUrl: string; twitterUrl: string; websiteUrl: string };

function blankAuthor(): AuthorDraft {
  return {
    slug: "",
    name: "",
    role: "",
    bio: "",
    initials: "",
    avatarUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    websiteUrl: "",
    followLinks: false,
  };
}

export function AuthorManager({
  authors: initialAuthors,
  value,
  onChange,
  onCreated,
  canSave,
}: {
  authors: Author[];
  value: string;
  onChange: (slug: string) => void;
  onCreated: (author: Author) => void;
  canSave: boolean;
}) {
  const [authors, setAuthors] = useState(initialAuthors);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AuthorDraft>(blankAuthor);
  const [slugTouched, setSlugTouched] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  function set<K extends keyof AuthorDraft>(key: K, nextValue: AuthorDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: nextValue };
      if (key === "name" && !slugTouched) next.slug = slugify(String(nextValue));
      return next;
    });
  }

  async function createAuthor() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/editor/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { author?: Author; error?: string };
      if (!response.ok || !data.author) throw new Error(data.error ?? "Could not create author");
      setAuthors((current) => [...current, data.author!]);
      onCreated(data.author);
      onChange(data.author.slug);
      setDraft(blankAuthor());
      setSlugTouched(false);
      setState("idle");
      setOpen(false);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not create author");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Select an author" /></SelectTrigger>
          <SelectContent>
            {authors.map((author) => (
              <SelectItem key={author.slug} value={author.slug}>
                {author.name} ({author.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={!canSave}>
          <IconPlus className="size-4" /> Add author
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The selected profile is used for the public author block and structured data.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add an author</DialogTitle>
            <DialogDescription>
              Save a reusable profile, then select it for any draft or published post.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthorField label="Name">
              <Input value={draft.name} onChange={(event) => set("name", event.target.value)} />
            </AuthorField>
            <AuthorField label="Slug">
              <Input
                value={draft.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  set("slug", slugify(event.target.value));
                }}
              />
            </AuthorField>
            <AuthorField label="Role or expertise">
              <Input value={draft.role} onChange={(event) => set("role", event.target.value)} />
            </AuthorField>
            <AuthorField label="Initials">
              <Input value={draft.initials} maxLength={3} onChange={(event) => set("initials", event.target.value)} />
            </AuthorField>
            <div className="sm:col-span-2">
              <AuthorField label="Bio">
                <Textarea value={draft.bio} onChange={(event) => set("bio", event.target.value)} className="min-h-24" />
              </AuthorField>
            </div>
            <AuthorField label="Avatar path or URL">
              <Input value={draft.avatarUrl} onChange={(event) => set("avatarUrl", event.target.value)} placeholder="/authors/name.jpg" />
            </AuthorField>
            <AuthorField label="Website">
              <Input value={draft.websiteUrl} onChange={(event) => set("websiteUrl", event.target.value)} placeholder="https://example.com" />
            </AuthorField>
            <AuthorField label="GitHub">
              <Input value={draft.githubUrl} onChange={(event) => set("githubUrl", event.target.value)} placeholder="https://github.com/..." />
            </AuthorField>
            <AuthorField label="LinkedIn">
              <Input value={draft.linkedinUrl} onChange={(event) => set("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/..." />
            </AuthorField>
            <AuthorField label="X profile">
              <Input value={draft.twitterUrl} onChange={(event) => set("twitterUrl", event.target.value)} placeholder="https://x.com/..." />
            </AuthorField>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Switch checked={draft.followLinks} onCheckedChange={(checked) => set("followLinks", checked)} />
              Allow followed profile links
            </label>
          </div>
          {state === "error" && <p className="text-sm text-destructive">{message}</p>}
          <DialogFooter showCloseButton>
            <Button onClick={createAuthor} disabled={state === "saving" || !draft.name || !draft.role || !draft.bio || !draft.slug}>
              {state === "saving" ? "Saving..." : "Save author"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuthorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
