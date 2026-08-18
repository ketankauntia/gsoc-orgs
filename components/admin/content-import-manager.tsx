"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck2, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

type Facets = { years: number[]; organizations: Array<{ slug: string; name: string; years: number[] }> };
type Contributor = { id: string; archived_name: string };
type Project = { id: string; title: string; project_contributors: Contributor[] };
type Blog = { id: string; title: string | null; url: string; project_contributors?: { archived_name?: string; projects?: { title?: string; year?: number; organizations?: { name?: string } } } };

export function ContentImportManager() {
  const [facets, setFacets] = useState<Facets>({ years: [], organizations: [] });
  const [year, setYear] = useState("");
  const [organization, setOrganization] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [contributorSlotId, setContributorSlotId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rightsBasis, setRightsBasis] = useState("author_consent");
  const [permissionNote, setPermissionNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File>();
  const [blogTitle, setBlogTitle] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { void fetch("/api/v2/archive/facets").then((response) => response.json()).then((body) => setFacets(body.data ?? { years: [], organizations: [] })); }, []);
  async function loadBlogs() {
    const response = await fetch("/api/v2/admin/contributor-blogs", { cache: "no-store" });
    const body = await response.json();
    if (response.ok) setBlogs(body.data ?? []);
  }
  useEffect(() => { void loadBlogs(); }, []);
  useEffect(() => {
    setProjectId(""); setContributorSlotId(""); setProjects([]);
    if (!year || !organization) return;
    const query = new URLSearchParams({ year, organization, limit: "100" });
    void fetch(`/api/v2/projects?${query}`).then((response) => response.json()).then((body) => setProjects(body.data ?? []));
  }, [year, organization]);

  const organizations = useMemo(() => facets.organizations.filter((item) => !year || item.years.includes(Number(year))), [facets.organizations, year]);
  const project = projects.find((item) => item.id === projectId);
  const yearOptions: ComboboxOption[] = facets.years.map((item) => ({ value: String(item), label: `GSoC ${item}` }));
  const organizationOptions: ComboboxOption[] = organizations.map((item) => ({ value: item.slug, label: item.name }));
  const projectOptions: ComboboxOption[] = projects.map((item) => ({ value: item.id, label: item.title }));
  const contributorOptions: ComboboxOption[] = (project?.project_contributors ?? []).map((item) => ({ value: item.id, label: item.archived_name }));

  function errorMessage(body: unknown, fallback: string) {
    return (body as { error?: { message?: string } } | null)?.error?.message ?? fallback;
  }

  async function importProposal() {
    if (!file || !contributorSlotId) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setMessage("Choose a PDF file.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setMessage("The PDF must be between 1 byte and 10 MiB.");
      return;
    }
    setBusy(true); setMessage("Creating the private import record…");
    try {
      const createResponse = await fetch("/api/v2/admin/proposal-imports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributorSlotId, displayName, rightsBasis, permissionNote, sourceUrl: sourceUrl || null }),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(errorMessage(created, "Import could not be created"));
      const id = created.data.id as string;
      setMessage("Uploading the PDF to private quarantine…");
      const urlResponse = await fetch(`/api/v2/admin/proposal-imports/${id}/upload-url`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, byteSize: file.size, mimeType: "application/pdf" }),
      });
      const upload = await urlResponse.json();
      if (!urlResponse.ok) throw new Error(errorMessage(upload, "Upload could not start"));
      const putResponse = await fetch(upload.data.uploadUrl, { method: "PUT", headers: upload.data.headers, body: file });
      if (!putResponse.ok) throw new Error("Private storage rejected the upload");
      setMessage("Validating and publishing the proposal…");
      const completeResponse = await fetch(`/api/v2/admin/proposal-imports/${id}/upload-complete`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: upload.data.key, filename: file.name }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(errorMessage(completed, "The proposal could not be published"));
      setMessage("Proposal published. The permission note remains private and the action was audited.");
      setFile(undefined); setDisplayName(""); setPermissionNote(""); setSourceUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The import failed");
    } finally { setBusy(false); }
  }

  async function addBlog() {
    if (!contributorSlotId || !blogUrl) return;
    setBusy(true); setMessage("Publishing contributor blog…");
    const response = await fetch("/api/v2/admin/contributor-blogs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contributorSlotId, title: blogTitle || null, url: blogUrl }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Contributor blog published." : errorMessage(body, "Contributor blog could not be published"));
    if (response.ok) { setBlogTitle(""); setBlogUrl(""); await loadBlogs(); }
    setBusy(false);
  }

  async function unpublishBlog(id: string) {
    setBusy(true);
    const response = await fetch(`/api/v2/admin/contributor-blogs/${id}`, { method: "DELETE" });
    const body = await response.json();
    setMessage(response.ok ? "Contributor blog unpublished." : errorMessage(body, "Contributor blog could not be unpublished"));
    if (response.ok) await loadBlogs();
    setBusy(false);
  }

  return <div className="space-y-8">
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-xl font-semibold">Choose an archived contributor</h2>
      <p className="mt-2 text-sm text-muted-foreground">Both tools attach content to a real GSoC selection. This chooser is shared so attribution cannot drift.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Combobox label="Year" value={year} onChange={(value) => { setYear(value); setOrganization(""); }} options={yearOptions} placeholder="Choose a year" clearable={false} />
        <Combobox label="Organization" value={organization} onChange={setOrganization} options={organizationOptions} disabled={!year} placeholder="Choose an organization" clearable={false} />
        <Combobox label="Project" value={projectId} onChange={(value) => { setProjectId(value); setContributorSlotId(projects.find((item) => item.id === value)?.project_contributors[0]?.id ?? ""); }} options={projectOptions} disabled={!organization} placeholder="Choose a project" clearable={false} />
        <Combobox label="Contributor" value={contributorSlotId} onChange={setContributorSlotId} options={contributorOptions} disabled={!projectId} placeholder="Choose a contributor" clearable={false} />
      </div>
    </section>

    <div className="grid gap-8 xl:grid-cols-2">
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2"><UploadCloud className="size-5 text-primary" /><h2 className="text-xl font-semibold">Import accepted proposal</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">Publishing is immediate after structural PDF validation. Record consent before selecting the file.</p>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Public contributor name<Input className="mt-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} /></label>
          <label className="block text-sm font-medium">Rights basis<select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={rightsBasis} onChange={(event) => setRightsBasis(event.target.value)}><option value="author_consent">Author consent</option><option value="rights_holder_consent">Rights-holder consent</option><option value="public_license">Existing public license</option></select></label>
          <label className="block text-sm font-medium">Private permission note<textarea className="mt-2 min-h-24 w-full rounded-md border bg-background p-3" value={permissionNote} onChange={(event) => setPermissionNote(event.target.value)} maxLength={2000} placeholder="When and how permission was obtained; never published" /></label>
          <label className="block text-sm font-medium">Private source URL <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label>
          <label className="block rounded-xl border border-dashed p-5 text-sm font-medium"><span className="flex items-center gap-2">{file ? <FileCheck2 className="size-5 text-primary" /> : <UploadCloud className="size-5 text-primary" />}{file?.name ?? "Choose proposal PDF"}</span><Input className="mt-3" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0])} /></label>
          <Button onClick={importProposal} disabled={busy || !contributorSlotId || !displayName.trim() || permissionNote.trim().length < 3 || !file}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} Validate and publish</Button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2"><Plus className="size-5 text-primary" /><h2 className="text-xl font-semibold">Publish contributor blog</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">Only link a public blog the contributor intended people to read.</p>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Label <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2" value={blogTitle} onChange={(event) => setBlogTitle(event.target.value)} maxLength={100} placeholder="Weekly progress blog" /></label>
          <label className="block text-sm font-medium">Blog URL<Input className="mt-2" type="url" value={blogUrl} onChange={(event) => setBlogUrl(event.target.value)} /></label>
          <Button onClick={addBlog} disabled={busy || !contributorSlotId || !blogUrl}><Plus className="size-4" /> Publish blog</Button>
        </div>
        <div className="mt-8 border-t pt-5"><h3 className="font-semibold">Published links</h3><div className="mt-3 space-y-3">{blogs.map((blog) => <div key={blog.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted p-3 text-sm"><div className="min-w-0"><a href={blog.url} target="_blank" rel="noopener noreferrer" className="block truncate font-medium underline">{blog.title || blog.url}</a><p className="mt-1 text-xs text-muted-foreground">{blog.project_contributors?.archived_name} · {blog.project_contributors?.projects?.title} · GSoC {blog.project_contributors?.projects?.year}</p></div><Button size="icon" variant="ghost" aria-label="Unpublish blog" disabled={busy} onClick={() => void unpublishBlog(blog.id)}><Trash2 className="size-4" /></Button></div>)}</div></div>
      </section>
    </div>
    {message ? <p role="status" className="rounded-xl bg-muted p-4 text-sm">{message}</p> : null}
  </div>;
}
