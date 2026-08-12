"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LinkRow = { platform: string; label?: string | null; url: string; isPublic: boolean; position: number };
type ProfileState = { displayName: string; bio: string; avatarPublic: boolean; bioPublic: boolean; links: LinkRow[] };

export function ProfileForm({ onReady }: { onReady?: () => void }) {
  const [profile, setProfile] = useState<ProfileState>({ displayName: "", bio: "", avatarPublic: true, bioPublic: true, links: [] });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/v2/me/profile", { cache: "no-store" }).then((response) => response.json()).then(({ data }) => {
      if (!data) return;
      setEmail(data.email ?? "");
      setProfile({
        displayName: data.display_name ?? "",
        bio: data.bio ?? "",
        avatarPublic: data.avatar_public ?? true,
        bioPublic: data.bio_public ?? true,
        links: (data.links ?? []).map((link: Record<string, unknown>) => ({ platform: String(link.platform), label: link.label ? String(link.label) : null, url: String(link.url), isPublic: Boolean(link.is_public), position: Number(link.position) })),
      });
      onReady?.();
    }).finally(() => setLoading(false));
  }, [onReady]);

  function updateLink(index: number, patch: Partial<LinkRow>) {
    setProfile((current) => ({ ...current, links: current.links.map((link, linkIndex) => linkIndex === index ? { ...link, ...patch } : link) }));
  }

  async function save() {
    setMessage("Saving…");
    const response = await fetch("/api/v2/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    const body = await response.json();
    setMessage(response.ok ? "Profile saved." : body.error?.message ?? "Profile could not be saved.");
    if (response.ok) onReady?.();
  }

  async function refreshAvatar() {
    setMessage("Importing your Google profile image…");
    const response = await fetch("/api/v2/me/avatar/refresh", { method: "POST" });
    const body = await response.json();
    setMessage(response.ok ? "Google profile image refreshed." : body.error?.message ?? "Avatar refresh failed.");
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-muted" />;
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Public attribution name<Input value={profile.displayName} maxLength={80} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label>
        <label className="space-y-2 text-sm font-medium">Private account email<Input value={email} disabled /><span className="block text-xs font-normal text-muted-foreground">Email can never be made public.</span></label>
      </div>
      <label className="block space-y-2 text-sm font-medium">Bio<textarea value={profile.bio} maxLength={500} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} className="min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><span className="block text-right text-xs font-normal text-muted-foreground">{profile.bio.length}/500</span></label>
      <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={profile.avatarPublic} onChange={(event) => setProfile({ ...profile, avatarPublic: event.target.checked })} /> Show Google avatar</label><label className="flex items-center gap-2"><input type="checkbox" checked={profile.bioPublic} onChange={(event) => setProfile({ ...profile, bioPublic: event.target.checked })} /> Show bio</label><Button type="button" variant="outline" size="sm" onClick={refreshAvatar}><RefreshCw className="size-4" /> Refresh Google avatar</Button></div>
      <div>
        <div className="flex items-center justify-between"><div><h3 className="font-medium">Profile links</h3><p className="mt-1 text-xs text-muted-foreground">Up to 12 links, including two custom links.</p></div><Button type="button" variant="outline" size="sm" disabled={profile.links.length >= 12} onClick={() => setProfile({ ...profile, links: [...profile.links, { platform: "github", url: "", isPublic: true, position: profile.links.length }] })}><Plus className="size-4" /> Add</Button></div>
        <div className="mt-4 space-y-3">{profile.links.map((link, index) => <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[130px_1fr_auto_auto]">
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={link.platform} onChange={(event) => updateLink(index, { platform: event.target.value })}>{["github","gitlab","linkedin","x","mastodon","bluesky","youtube","reddit","stackoverflow","medium","portfolio","custom"].map((platform) => <option key={platform}>{platform}</option>)}</select>
          <Input type="url" value={link.url} placeholder="https://…" onChange={(event) => updateLink(index, { url: event.target.value })} />
          <label className="flex items-center gap-2 px-2 text-xs"><input type="checkbox" checked={link.isPublic} onChange={(event) => updateLink(index, { isPublic: event.target.checked })} /> Public</label>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove link" onClick={() => setProfile({ ...profile, links: profile.links.filter((_, linkIndex) => linkIndex !== index).map((item, position) => ({ ...item, position })) })}><Trash2 className="size-4" /></Button>
        </div>)}</div>
      </div>
      <div className="flex items-center gap-4"><Button type="button" onClick={save}>Save profile</Button><p role="status" className="text-sm text-muted-foreground">{message}</p></div>
    </div>
  );
}
