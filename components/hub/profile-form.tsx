"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { callApi } from "@/lib/hub/client";
import type { Profile } from "@/lib/hub/types";
import { Notice, Switch, TextArea, TextField } from "./controls";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: profile.display_name,
    handle: profile.handle ?? "",
    bio: profile.bio ?? "",
    websiteUrl: profile.website_url ?? "",
    githubUsername: profile.github_username ?? "",
    xUsername: profile.x_username ?? "",
    mediumUrl: profile.medium_url ?? "",
    isPublic: profile.is_public,
  });
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await callApi("/api/v2/me/profile", { method: "PATCH", body: form });
    setBusy(false);
    setFields(result.ok ? {} : result.fields ?? {});
    setMessage(result.ok ? { tone: "ok", text: "Profile saved" } : { tone: "error", text: result.message });
    if (result.ok) router.refresh();
  }

  return (
    <form className="cb-card cb-cm-form-card cb-cm-form cb-hub-form-card" onSubmit={save}>
      <TextField label="Name" value={form.displayName} onChange={set("displayName")} max={80} required error={fields.displayName} autoComplete="name" />
      <TextField label="Handle" value={form.handle} onChange={(value) => set("handle")(value.toLowerCase())} max={30} prefix="@" error={fields.handle}
        hint="Your public profile lives at /contributors/your-handle" />
      <TextArea label="Bio" value={form.bio} onChange={set("bio")} max={500} rows={3} placeholder="What you work on" error={fields.bio} />
      <hr className="cb-hub-divider" style={{ margin: "4px 0" }} />
      <TextField label="Personal website" type="url" inputMode="url" value={form.websiteUrl} onChange={set("websiteUrl")} max={300} placeholder="https://" error={fields.websiteUrl} />
      <div className="cb-cm-form-row">
        <TextField label="GitHub username" value={form.githubUsername} onChange={set("githubUsername")} max={39} prefix="github.com/" error={fields.githubUsername}
          hint="We compare it with the archive when we verify claims" />
        <TextField label="X username" value={form.xUsername} onChange={set("xUsername")} max={15} prefix="@" error={fields.xUsername} />
      </div>
      <TextField label="Medium profile or blog" type="url" inputMode="url" value={form.mediumUrl} onChange={set("mediumUrl")} max={300} placeholder="https://medium.com/@you" error={fields.mediumUrl} />
      <Switch checked={form.isPublic} onChange={(value) => set("isPublic")(value)} label="Public profile" hint="Shows your name, links and verified projects. Your email is never shown." />
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      <div className="cb-cm-form-foot">
        <Link href="/account" className="cb-hub-text-button">Back to your account</Link>
        <button type="submit" className="cb-button cb-button-ink" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </div>
    </form>
  );
}
