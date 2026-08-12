"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, FileCheck2, Search, UploadCloud } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Organization = { id: string; slug: string; name: string };
type Contributor = { id: string; archived_name: string; ordinal: number };
type Project = { id: string; external_id: string; title: string; organizations: { slug: string; name: string }; project_contributors: Contributor[] };

const steps = ["Profile", "Selection", "Evidence & PDF", "Submit"];
const LOCAL_DRAFT_KEY = "gsoc-proposal-wizard-draft";

export function ProposalWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profileReady, setProfileReady] = useState(false);
  const [year, setYear] = useState(2025);
  const [organizationQuery, setOrganizationQuery] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization>();
  const [projectQuery, setProjectQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project>();
  const [contributorSlotId, setContributorSlotId] = useState("");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState([""]);
  const [proposalId, setProposalId] = useState("");
  const [file, setFile] = useState<File>();
  const [uploaded, setUploaded] = useState<{ filename: string; byteSize: number; pageCount: number }>();
  const [ownership, setOwnership] = useState(false);
  const [license, setLicense] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const markProfileReady = useCallback(() => setProfileReady(true), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as { year?: number; organization?: Organization; project?: Project; contributorSlotId?: string; note?: string; evidence?: string[]; proposalId?: string };
      if (draft.year) setYear(draft.year);
      if (draft.organization) setOrganization(draft.organization);
      if (draft.project) setProject(draft.project);
      if (draft.contributorSlotId) setContributorSlotId(draft.contributorSlotId);
      if (draft.note) setNote(draft.note);
      if (draft.evidence?.length) setEvidence(draft.evidence);
      if (draft.proposalId) setProposalId(draft.proposalId);
    } catch { localStorage.removeItem(LOCAL_DRAFT_KEY); }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ year, organization, project, contributorSlotId, note, evidence, proposalId }));
    if (!proposalId) return;
    const timeout = window.setTimeout(() => {
      void fetch(`/api/v2/me/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantNote: note, evidenceUrls: evidence.filter(Boolean) }),
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [year, organization, project, contributorSlotId, note, evidence, proposalId]);

  async function findOrganizations() {
    setBusy(true); setMessage("");
    const params = new URLSearchParams({ year: String(year), limit: "100" });
    if (organizationQuery.trim()) params.set("q", organizationQuery.trim());
    const response = await fetch(`/api/v2/organizations?${params}`);
    const body = await response.json();
    setOrganizations(body.data ?? []);
    if (!response.ok) setMessage(body.error?.message ?? "Organizations could not be loaded.");
    setBusy(false);
  }

  async function findProjects() {
    if (!organization) return;
    setBusy(true); setMessage("");
    const params = new URLSearchParams({ year: String(year), organization: organization.slug, limit: "100" });
    if (projectQuery.trim()) params.set("q", projectQuery.trim());
    const response = await fetch(`/api/v2/projects?${params}`);
    const body = await response.json();
    setProjects(body.data ?? []);
    if (!response.ok) setMessage(body.error?.message ?? "Projects could not be loaded.");
    setBusy(false);
  }

  async function createDraftAndUpload() {
    if (!contributorSlotId || !file) return;
    setBusy(true); setMessage("Creating your private draft…");
    let currentProposalId = proposalId;
    try {
      if (!currentProposalId) {
        const claimResponse = await fetch("/api/v2/me/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contributorSlotId, claimantNote: note, evidenceUrls: evidence.filter(Boolean) }) });
        const claimBody = await claimResponse.json();
        if (!claimResponse.ok) throw new Error(claimBody.error?.message ?? "Claim could not be created");
        const proposalResponse = await fetch("/api/v2/me/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claimId: claimBody.data.claimId }) });
        const proposalBody = await proposalResponse.json();
        if (!proposalResponse.ok) throw new Error(proposalBody.error?.message ?? "Draft could not be loaded");
        currentProposalId = proposalBody.data.id;
        setProposalId(currentProposalId);
      } else {
        await fetch(`/api/v2/me/proposals/${currentProposalId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claimantNote: note, evidenceUrls: evidence.filter(Boolean) }) });
      }
      setMessage("Uploading directly to private storage…");
      const urlResponse = await fetch(`/api/v2/me/proposals/${currentProposalId}/upload-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, byteSize: file.size, mimeType: file.type }) });
      const urlBody = await urlResponse.json();
      if (!urlResponse.ok) throw new Error(urlBody.error?.message ?? "Upload could not start");
      const putResponse = await fetch(urlBody.data.uploadUrl, { method: "PUT", headers: urlBody.data.headers, body: file });
      if (!putResponse.ok) throw new Error("R2 rejected the upload. Check the file and try again.");
      setMessage("Validating the PDF…");
      const completeResponse = await fetch(`/api/v2/me/proposals/${currentProposalId}/upload-complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: urlBody.data.key, filename: file.name }) });
      const completeBody = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completeBody.error?.message ?? "PDF validation failed");
      setUploaded({ filename: file.name, byteSize: completeBody.data.byteSize, pageCount: completeBody.data.pageCount });
      setMessage("PDF validated and saved privately.");
      setStep(3);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The upload failed");
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!proposalId) return;
    setBusy(true); setMessage("Submitting for review…");
    const response = await fetch(`/api/v2/me/proposals/${proposalId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmOwnership: ownership, acceptCcBy4: license }) });
    const body = await response.json();
    if (response.ok) { localStorage.removeItem(LOCAL_DRAFT_KEY); router.push("/account?submitted=1"); router.refresh(); return; }
    setMessage(body.error?.message ?? "Submission failed"); setBusy(false);
  }

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2" aria-label="Submission steps">{steps.map((label, index) => <li key={label} className={`rounded-xl border px-3 py-3 text-center text-xs sm:text-sm ${index === step ? "border-primary bg-primary/8 font-semibold text-primary" : index < step ? "bg-muted font-medium" : "text-muted-foreground"}`}><span className="hidden sm:inline">{index + 1}. </span>{label}</li>)}</ol>
      <div className="mt-8 rounded-3xl border bg-card p-6 sm:p-8">
        {step === 0 ? <div><h2 className="text-2xl font-semibold">Set your public attribution</h2><p className="mt-2 text-sm text-muted-foreground">Email always stays private. You decide whether your avatar, bio, and links appear after approval.</p><div className="mt-7"><ProfileForm onReady={markProfileReady} /></div><div className="mt-7 flex justify-end"><Button onClick={() => setStep(1)} disabled={!profileReady}>Continue <ChevronRight className="size-4" /></Button></div></div> : null}
        {step === 1 ? <div><h2 className="text-2xl font-semibold">Match your archived selection</h2><p className="mt-2 text-sm text-muted-foreground">Names and handles are not treated as identity proof. A moderator verifies the claim before publication.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">GSoC year<select className="h-10 w-full rounded-md border bg-background px-3" value={year} onChange={(event) => { setYear(Number(event.target.value)); setOrganization(undefined); setProject(undefined); setContributorSlotId(""); }}>{Array.from({ length: 10 }, (_, index) => 2025 - index).map((value) => <option key={value}>{value}</option>)}</select></label><label className="space-y-2 text-sm font-medium">Find organization<div className="flex gap-2"><Input value={organizationQuery} onChange={(event) => setOrganizationQuery(event.target.value)} placeholder="Type an organization name" /><Button type="button" variant="outline" onClick={findOrganizations} disabled={busy}><Search className="size-4" /></Button></div></label></div>
          {organizations.length ? <div className="mt-4 max-h-52 overflow-auto rounded-xl border p-2">{organizations.map((item) => <button type="button" key={item.id} onClick={() => { setOrganization(item); setProject(undefined); setContributorSlotId(""); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent ${organization?.id === item.id ? "bg-primary/10 font-medium text-primary" : ""}`}>{item.name}</button>)}</div> : null}
          {organization ? <div className="mt-7"><p className="text-sm font-medium">Project at {organization.name}</p><div className="mt-2 flex max-w-xl gap-2"><Input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Search project titles" /><Button type="button" variant="outline" onClick={findProjects} disabled={busy}><Search className="size-4" /> Find</Button></div>{projects.length ? <div className="mt-4 max-h-72 overflow-auto rounded-xl border p-2">{projects.map((item) => <button type="button" key={item.id} onClick={() => { setProject(item); setContributorSlotId(item.project_contributors[0]?.id ?? ""); }} className={`block w-full rounded-lg px-3 py-3 text-left hover:bg-accent ${project?.id === item.id ? "bg-primary/10" : ""}`}><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.project_contributors.map((person) => person.archived_name).join(", ")}</span></button>)}</div> : null}</div> : null}
          {project && project.project_contributors.length > 1 ? <label className="mt-5 block space-y-2 text-sm font-medium">Which archived contributor are you?<select className="h-10 w-full rounded-md border bg-background px-3" value={contributorSlotId} onChange={(event) => setContributorSlotId(event.target.value)}>{project.project_contributors.map((person) => <option value={person.id} key={person.id}>{person.archived_name}</option>)}</select></label> : null}
          <div className="mt-8 flex justify-between"><Button variant="ghost" onClick={() => setStep(0)}><ChevronLeft className="size-4" /> Back</Button><Button onClick={() => setStep(2)} disabled={!contributorSlotId}>Continue <ChevronRight className="size-4" /></Button></div></div> : null}
        {step === 2 ? <div><h2 className="text-2xl font-semibold">Add private evidence and your accepted PDF</h2><p className="mt-2 text-sm text-muted-foreground">Evidence helps a moderator distinguish matching names. It is never shown publicly.</p><div className="mt-7 space-y-5"><label className="block space-y-2 text-sm font-medium">Private note<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm" placeholder="Explain how we can verify this selection…" /></label>{evidence.map((url, index) => <label key={index} className="block space-y-2 text-sm font-medium">Evidence URL {index + 1}<Input type="url" value={url} onChange={(event) => setEvidence(evidence.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="https://github.com/…" /></label>)}{evidence.length < 2 ? <Button type="button" variant="ghost" size="sm" onClick={() => setEvidence([...evidence, ""])}>Add another evidence URL</Button> : null}<label className="block rounded-2xl border border-dashed p-6 text-center"><UploadCloud className="mx-auto size-8 text-primary" /><span className="mt-3 block font-medium">Accepted proposal PDF</span><span className="mt-1 block text-xs text-muted-foreground">PDF only · maximum 10 MiB · one current file per selection</span><Input type="file" accept="application/pdf,.pdf" className="mx-auto mt-4 max-w-md" onChange={(event) => setFile(event.target.files?.[0])} /></label></div><div className="mt-8 flex justify-between"><Button variant="ghost" onClick={() => setStep(1)} disabled={Boolean(proposalId)}><ChevronLeft className="size-4" /> Back</Button><Button onClick={createDraftAndUpload} disabled={busy || !file || !contributorSlotId}>{busy ? "Working…" : "Upload and validate"}</Button></div></div> : null}
        {step === 3 ? <div><FileCheck2 className="size-10 text-primary" /><h2 className="mt-4 text-2xl font-semibold">Review and submit</h2><p className="mt-2 text-sm text-muted-foreground">Once submitted, this draft is locked while a moderator verifies your identity and reviews the document.</p>{uploaded ? <div className="mt-6 rounded-xl bg-muted p-4 text-sm"><p className="font-medium">{uploaded.filename}</p><p className="mt-1 text-muted-foreground">{(uploaded.byteSize / 1024 / 1024).toFixed(2)} MiB · {uploaded.pageCount} pages · structurally validated</p></div> : null}<div className="mt-7 space-y-4"><label className="flex items-start gap-3 text-sm leading-6"><input className="mt-1" type="checkbox" checked={ownership} onChange={(event) => setOwnership(event.target.checked)} /><span>I confirm that I own this proposal or have permission to publish it and that the selected archive record belongs to me.</span></label><label className="flex items-start gap-3 text-sm leading-6"><input className="mt-1" type="checkbox" checked={license} onChange={(event) => setLicense(event.target.checked)} /><span>I publish the approved document under <a className="underline" target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a>.</span></label></div><div className="mt-8 flex justify-between"><Button variant="ghost" onClick={() => setStep(2)} disabled={busy}><ChevronLeft className="size-4" /> Replace PDF</Button><Button onClick={submit} disabled={busy || !ownership || !license}><Check className="size-4" /> {busy ? "Submitting…" : "Submit for review"}</Button></div></div> : null}
        {message ? <p role="status" className="mt-6 rounded-xl bg-muted p-3 text-sm">{message}</p> : null}
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">Need to stop? Created drafts remain in <Link className="underline" href="/account">your account</Link>.</p>
    </div>
  );
}
