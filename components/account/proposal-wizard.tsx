"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, FileCheck2, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { filterArchiveOrganizationsByYear } from "@/lib/proposals/archive-search-core";

type Organization = { slug: string; name: string; projectCount: number; years: number[] };
type Contributor = { id: string; archived_name: string; ordinal: number };
type Project = {
  id: string;
  external_id: string;
  title: string;
  year: number;
  organizations: { slug: string; name: string } | Array<{ slug: string; name: string }>;
  project_contributors: Contributor[];
};

const steps = ["Find your selection", "Upload and submit"];
const LOCAL_DRAFT_KEY = "gsoc-proposal-wizard-draft";

function orgOf(project: Project) {
  return Array.isArray(project.organizations) ? project.organizations[0] : project.organizations;
}

/**
 * Two screens: identify the archived selection, then upload and submit.
 * Every archive value is chosen from a searchable list rather than typed, and
 * arriving from a search result pre-fills the whole first screen.
 */
export function ProposalWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillExternalId = searchParams.get("project") ?? "";

  const [step, setStep] = useState(0);
  const [facetsLoading, setFacetsLoading] = useState(true);
  const [years, setYears] = useState<number[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [year, setYear] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [contributorSlotId, setContributorSlotId] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [profileRest, setProfileRest] = useState<{ bio: string; avatarPublic: boolean; bioPublic: boolean; links: unknown[] }>();
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState<string[]>([""]);
  const [proposalId, setProposalId] = useState("");
  const [uploaded, setUploaded] = useState<{ filename: string; byteSize: number; pageCount?: number }>();
  const [ownership, setOwnership] = useState(false);
  const [license, setLicense] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const restoredRef = useRef(false);
  const restoredProposalRef = useRef("");
  const projectsRequestRef = useRef(0);
  const restoredProjectRef = useRef<{ projectId?: string; contributorSlotId?: string }>({});

  const project = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);

  // ---- Bootstrapping -------------------------------------------------------

  useEffect(() => {
    void fetch("/api/v2/archive/facets")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Archive filters could not be loaded.");
        return body;
      })
      .then(({ data }) => {
        setYears(data?.years ?? []);
        setOrganizations(data?.organizations ?? []);
      })
      .catch(() => setMessage("Archive filters could not be loaded. Reload the page to try again."))
      .finally(() => setFacetsLoading(false));

    void fetch("/api/v2/me/profile", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Your profile could not be loaded.");
        return body;
      })
      .then(({ data }) => {
        if (!data) throw new Error("Your profile could not be loaded.");
        setDisplayName(data.display_name ?? "");
        setProfileRest({
          bio: data.bio ?? "",
          avatarPublic: data.avatar_public ?? true,
          bioPublic: data.bio_public ?? true,
          links: (data.links ?? []).map((link: Record<string, unknown>) => ({
            platform: String(link.platform),
            label: link.label ? String(link.label) : null,
            url: String(link.url),
            isPublic: Boolean(link.is_public),
            position: Number(link.position),
          })),
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Your profile could not be loaded."));
  }, []);

  // Arriving from a search result: resolve the project and fill the screen.
  useEffect(() => {
    if (!prefillExternalId) return;
    void fetch(`/api/v2/projects/${encodeURIComponent(prefillExternalId)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "That archived project could not be loaded.");
        return body;
      })
      .then((body) => {
        const found = body?.data as Project | undefined;
        if (!found) throw new Error("That archived project could not be loaded.");
        restoredRef.current = true;
        setProjects([found]);
        setYear(String(found.year));
        setOrganizationSlug(orgOf(found)?.slug ?? "");
        setProjectId(found.id);
        setContributorSlotId(found.project_contributors?.[0]?.id ?? "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "That archived project could not be loaded."))
      .finally(() => setDraftHydrated(true));
  }, [prefillExternalId]);

  useEffect(() => {
    if (!proposalId || restoredProposalRef.current === proposalId) return;
    restoredProposalRef.current = proposalId;
    void fetch("/api/v2/me/proposals", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Your saved draft could not be restored.");
        return body;
      })
      .then(({ data }) => {
        const saved = (data as Array<{
          id: string;
          current_file_id: string | null;
          proposal_files: Array<{ id: string; original_filename: string; byte_size: number; validation_status: string }>;
        }>).find((proposal) => proposal.id === proposalId);
        const currentFile = saved?.proposal_files.find((file) => file.id === saved.current_file_id);
        if (currentFile?.validation_status === "valid") {
          setUploaded({ filename: currentFile.original_filename, byteSize: currentFile.byte_size });
          setStep(1);
          setMessage("Your validated PDF was restored from the saved draft.");
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Your saved draft could not be restored."));
  }, [proposalId]);

  useEffect(() => {
    if (prefillExternalId || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as {
        year?: string; organizationSlug?: string; projectId?: string; projects?: Project[];
        contributorSlotId?: string; note?: string; evidence?: string[]; proposalId?: string;
      };
      if (draft.year) setYear(draft.year);
      if (draft.organizationSlug) setOrganizationSlug(draft.organizationSlug);
      if (draft.projects?.length) setProjects(draft.projects);
      if (draft.projectId) setProjectId(draft.projectId);
      if (draft.contributorSlotId) setContributorSlotId(draft.contributorSlotId);
      restoredProjectRef.current = { projectId: draft.projectId, contributorSlotId: draft.contributorSlotId };
      if (draft.note) setNote(draft.note);
      if (draft.evidence?.length) setEvidence(draft.evidence);
      if (draft.proposalId) setProposalId(draft.proposalId);
    } catch {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    } finally {
      setDraftHydrated(true);
    }
  }, [prefillExternalId]);

  useEffect(() => {
    if (!draftHydrated) return;
    localStorage.setItem(
      LOCAL_DRAFT_KEY,
      JSON.stringify({ year, organizationSlug, projectId, projects, contributorSlotId, note, evidence, proposalId }),
    );
    if (!proposalId) return;
    const timeout = window.setTimeout(() => {
      void fetch(`/api/v2/me/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantNote: note, evidenceUrls: evidence.filter(Boolean) }),
      })
        .then(async (response) => {
          if (response.ok) return;
          const body = await response.json().catch(() => null);
          throw new Error(body?.error?.message ?? "Draft changes could not be saved.");
        })
        .catch((error) => setMessage(error instanceof Error ? error.message : "Draft changes could not be saved."));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [draftHydrated, year, organizationSlug, projectId, projects, contributorSlotId, note, evidence, proposalId]);

  // Projects load as soon as a year and an organization are both chosen.
  const loadProjects = useCallback(async (targetYear: string, targetOrg: string) => {
    const requestId = ++projectsRequestRef.current;
    if (!targetYear || !targetOrg) {
      setProjects([]);
      return;
    }
    setProjectsLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ year: targetYear, organization: targetOrg, limit: "100" });
      const response = await fetch(`/api/v2/projects?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Projects could not be loaded.");
      if (requestId !== projectsRequestRef.current) return;
      const loaded = (body.data ?? []) as Project[];
      setProjects(loaded);
      const restored = restoredProjectRef.current;
      if (restored.projectId && loaded.some((item) => item.id === restored.projectId)) {
        setProjectId(restored.projectId);
        setContributorSlotId(restored.contributorSlotId ?? "");
        restoredProjectRef.current = {};
      }
    } catch (error) {
      if (requestId !== projectsRequestRef.current) return;
      setMessage(error instanceof Error ? error.message : "Projects could not be loaded.");
      setProjects([]);
    } finally {
      if (requestId === projectsRequestRef.current) setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (prefillExternalId) return;
    setProjectId("");
    setContributorSlotId("");
    void loadProjects(year, organizationSlug);
  }, [year, organizationSlug, loadProjects, prefillExternalId]);

  useEffect(() => {
    if (!organizationSlug || facetsLoading) return;
    if (!filterArchiveOrganizationsByYear(organizations, year ? Number(year) : undefined).some((org) => org.slug === organizationSlug)) {
      setOrganizationSlug("");
    }
  }, [facetsLoading, organizationSlug, organizations, year]);

  // ---- Options -------------------------------------------------------------

  const yearOptions: ComboboxOption[] = years.map((value) => ({ value: String(value), label: `GSoC ${value}` }));
  const availableOrganizations = useMemo(
    () => filterArchiveOrganizationsByYear(organizations, year ? Number(year) : undefined),
    [organizations, year],
  );
  const organizationOptions: ComboboxOption[] = availableOrganizations.map((org) => ({
    value: org.slug,
    label: org.name,
    keywords: org.slug,
  }));
  const projectOptions: ComboboxOption[] = projects.map((item) => ({
    value: item.id,
    label: item.title,
    hint: item.project_contributors.map((person) => person.archived_name).join(", "),
  }));
  const contributorOptions: ComboboxOption[] = (project?.project_contributors ?? []).map((person) => ({
    value: person.id,
    label: person.archived_name,
  }));

  // ---- Actions -------------------------------------------------------------

  async function saveDisplayName() {
    if (!displayName.trim()) return false;
    if (!profileRest) {
      setMessage("Your profile is not available yet. Reload the page before submitting.");
      return false;
    }
    const response = await fetch("/api/v2/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName.trim(), ...profileRest }),
    });
    if (response.ok) return true;
    const body = await response.json().catch(() => null);
    setMessage(body?.error?.message ?? "Your public name could not be saved.");
    return false;
  }

  async function uploadFile(file: File) {
    if (!contributorSlotId) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setMessage("Choose a PDF file.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setMessage("The PDF must be between 1 byte and 10 MiB.");
      return;
    }
    setUploading(true);
    setMessage("Creating your private draft…");
    let currentProposalId = proposalId;
    try {
      if (!currentProposalId) {
        const claimResponse = await fetch("/api/v2/me/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contributorSlotId, claimantNote: note, evidenceUrls: evidence.filter(Boolean) }),
        });
        const claimBody = await claimResponse.json();
        if (!claimResponse.ok) throw new Error(claimBody.error?.message ?? "Claim could not be created");
        const proposalResponse = await fetch("/api/v2/me/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId: claimBody.data.claimId }),
        });
        const proposalBody = await proposalResponse.json();
        if (!proposalResponse.ok) throw new Error(proposalBody.error?.message ?? "Draft could not be created");
        currentProposalId = proposalBody.data.id;
        setProposalId(currentProposalId);
      }
      setMessage("Uploading directly to private storage…");
      const urlResponse = await fetch(`/api/v2/me/proposals/${currentProposalId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, byteSize: file.size, mimeType: file.type }),
      });
      const urlBody = await urlResponse.json();
      if (!urlResponse.ok) throw new Error(urlBody.error?.message ?? "Upload could not start");
      const putResponse = await fetch(urlBody.data.uploadUrl, { method: "PUT", headers: urlBody.data.headers, body: file });
      if (!putResponse.ok) throw new Error("Storage rejected the upload. Check the file and try again.");
      setMessage("Validating the PDF…");
      const completeResponse = await fetch(`/api/v2/me/proposals/${currentProposalId}/upload-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: urlBody.data.key, filename: file.name }),
      });
      const completeBody = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completeBody.error?.message ?? "PDF validation failed");
      setUploaded({ filename: file.name, byteSize: completeBody.data.byteSize, pageCount: completeBody.data.pageCount });
      setMessage("PDF validated and stored privately.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!proposalId) return;
    setBusy(true);
    setMessage("Submitting for review…");
    try {
      if (!(await saveDisplayName())) return;
      const response = await fetch(`/api/v2/me/proposals/${proposalId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmOwnership: ownership, acceptCcBy4: license }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Submission failed");
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      router.push("/account?submitted=1");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  const canContinue = Boolean(contributorSlotId);
  const canSubmit = Boolean(proposalId && uploaded && ownership && license && displayName.trim());

  return (
    <div>
      <ol className="grid grid-cols-2 gap-2" aria-label="Submission steps">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-xl border px-3 py-3 text-center text-xs sm:text-sm ${
              index === step ? "border-primary bg-primary/8 font-semibold text-primary" : index < step ? "bg-muted font-medium" : "text-muted-foreground"
            }`}
          >
            <span className="hidden sm:inline">{index + 1}. </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl border bg-card p-6 sm:p-8">
        {step === 0 ? (
          <div>
            <h2 className="text-2xl font-semibold">Which archived selection is yours?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick from the real GSoC archive — nothing here is typed from memory. A moderator verifies the match
              before anything is published.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Combobox
                label="GSoC year"
                value={year}
                onChange={setYear}
                options={yearOptions}
                loading={facetsLoading}
                placeholder="Choose a year"
                searchPlaceholder="2016 – 2025"
                visibleCount={12}
                clearable={false}
              />
              <Combobox
                label="Organization"
                value={organizationSlug}
                onChange={setOrganizationSlug}
                options={organizationOptions}
                loading={facetsLoading}
                disabled={!year}
                placeholder={year ? "Choose an organization" : "Pick a year first"}
                searchPlaceholder="Type an organization name…"
                clearable={false}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Combobox
                label="Project"
                value={projectId}
                onChange={(value) => {
                  setProjectId(value);
                  const next = projects.find((item) => item.id === value);
                  setContributorSlotId(next?.project_contributors[0]?.id ?? "");
                }}
                options={projectOptions}
                loading={projectsLoading}
                disabled={!organizationSlug || !projects.length}
                placeholder={organizationSlug ? (projects.length ? "Choose your project" : "No projects for that year") : "Pick an organization first"}
                searchPlaceholder="Search project titles…"
                emptyText="No project matches"
                clearable={false}
                description={projects.length ? `${projects.length} archived projects` : undefined}
              />
              {project && project.project_contributors.length > 1 ? (
                <Combobox
                  label="Which archived contributor are you?"
                  value={contributorSlotId}
                  onChange={setContributorSlotId}
                  options={contributorOptions}
                  placeholder="Choose your name"
                  searchPlaceholder="Search names…"
                  clearable={false}
                />
              ) : null}
            </div>

            {project ? (
              <div className="mt-6 rounded-2xl bg-muted p-4 text-sm">
                <p className="font-medium">{project.title}</p>
                <p className="mt-1 text-muted-foreground">
                  {orgOf(project)?.name} · GSoC {project.year} ·{" "}
                  {project.project_contributors.map((person) => person.archived_name).join(", ")}
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!canContinue}>
                Continue <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="text-2xl font-semibold">Upload the proposal and submit it</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your email always stays private. The note and evidence are for the moderator only and are never
              published.
            </p>

            <div className="mt-7 space-y-6">
              <label className="block space-y-2 text-sm font-medium">
                Public name on the proposal
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How your name appears after approval" />
                <span className="block text-xs font-normal text-muted-foreground">
                  Avatar, bio, and links are optional and editable any time in <Link className="underline" href="/account">your account</Link>.
                </span>
              </label>

              <label className="block space-y-2 text-sm font-medium">
                Private note for the moderator <span className="font-normal text-muted-foreground">(optional)</span>
                <textarea
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                  placeholder="Anything that helps confirm this selection is yours — a merged PR, your GitHub handle…"
                />
              </label>

              <div className="space-y-3">
                {evidence.map((url, index) => (
                  <label key={index} className="block space-y-2 text-sm font-medium">
                    Evidence URL {index + 1} <span className="font-normal text-muted-foreground">(optional)</span>
                    <Input
                      type="url"
                      value={url}
                      onChange={(event) => setEvidence(evidence.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                      placeholder="https://github.com/…"
                    />
                  </label>
                ))}
                {evidence.length < 2 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEvidence([...evidence, ""])}>
                    Add another evidence URL
                  </Button>
                ) : null}
              </div>

              <label className="block rounded-2xl border border-dashed p-6 text-center">
                {uploading ? <Loader2 className="mx-auto size-8 animate-spin text-primary" /> : uploaded ? <FileCheck2 className="mx-auto size-8 text-primary" /> : <UploadCloud className="mx-auto size-8 text-primary" />}
                <span className="mt-3 block font-medium">{uploaded ? "Replace the PDF" : "Accepted proposal PDF"}</span>
                <span className="mt-1 block text-xs text-muted-foreground">PDF only · maximum 10 MiB · uploads and validates as soon as you choose it</span>
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading || busy}
                  className="mx-auto mt-4 max-w-md"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />
                {uploaded ? (
                  <span className="mt-4 block rounded-xl bg-muted p-3 text-left text-sm">
                    <span className="block font-medium">{uploaded.filename}</span>
                    <span className="mt-1 block text-muted-foreground">
                      {(uploaded.byteSize / 1024 / 1024).toFixed(2)} MiB
                      {uploaded.pageCount ? ` · ${uploaded.pageCount} pages` : ""} · structurally validated
                    </span>
                  </span>
                ) : null}
              </label>

              <div className="space-y-4 border-t pt-6">
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input className="mt-1" type="checkbox" checked={ownership} onChange={(event) => setOwnership(event.target.checked)} />
                  <span>I confirm that I own this proposal or have permission to publish it, and that the selected archive record is mine.</span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input className="mt-1" type="checkbox" checked={license} onChange={(event) => setLicense(event.target.checked)} />
                  <span>
                    I publish the approved document under{" "}
                    <a className="underline" target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by/4.0/">
                      Creative Commons Attribution 4.0
                    </a>
                    .
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)} disabled={busy || uploading || Boolean(proposalId)}>
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button onClick={submit} disabled={busy || uploading || !canSubmit}>
                <Check className="size-4" /> {busy ? "Submitting…" : "Submit for review"}
              </Button>
            </div>
          </div>
        ) : null}

        {message ? (
          <p role="status" className="mt-6 rounded-xl bg-muted p-3 text-sm">
            {message}
          </p>
        ) : null}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Need to stop? Created drafts remain in <Link className="underline" href="/account">your account</Link>.
      </p>
    </div>
  );
}
