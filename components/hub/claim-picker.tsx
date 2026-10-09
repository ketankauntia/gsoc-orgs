"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCircleCheck, IconUser } from "@tabler/icons-react";
import { callApi, listFieldErrors } from "@/lib/hub/client";
import type { SlotOrganization, SlotProject } from "@/lib/hub/types";
import { Notice, Picker, TextArea, TextField } from "./controls";

type Prefill = { year: number; organization_slug: string; project_external_id: string } | null;

// Links can carry a slug or project id in any case; match without it and keep the archive's spelling.
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function ClaimPicker({ years, prefill }: { years: number[]; prefill: Prefill }) {
  const router = useRouter();
  const [year, setYear] = useState<number | null>(prefill?.year ?? null);
  const [organization, setOrganization] = useState<string | null>(prefill?.organization_slug ?? null);
  const [project, setProject] = useState<string | null>(prefill?.project_external_id ?? null);
  const [person, setPerson] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<SlotOrganization[]>([]);
  const [projects, setProjects] = useState<SlotProject[]>([]);
  const [loading, setLoading] = useState<"organizations" | "projects" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [note, setNote] = useState("");
  const [links, setLinks] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!year) return;
    let current = true;
    setLoading("organizations");
    setLoadError(null);
    void callApi<{ organizations: SlotOrganization[] }>(`/api/v2/claim-options?year=${year}`).then((result) => {
      if (!current) return;
      setLoading(null);
      if (!result.ok) { setOrganizations([]); setLoadError(result.message); return; }
      const list = result.data.organizations;
      setOrganizations(list);
      setOrganization((value) => (value ? list.find((item) => same(item.slug, value))?.slug ?? value : value));
    });
    return () => { current = false; };
  }, [year, reload]);

  useEffect(() => {
    if (!year || !organization) return;
    let current = true;
    setLoading("projects");
    setLoadError(null);
    void callApi<{ projects: SlotProject[] }>(`/api/v2/claim-options?year=${year}&organization=${encodeURIComponent(organization)}`).then((result) => {
      if (!current) return;
      setLoading(null);
      if (!result.ok) { setProjects([]); setLoadError(result.message); return; }
      const list = result.data.projects;
      setProjects(list);
      setProject((value) => (value ? list.find((item) => same(item.external_id, value))?.external_id ?? value : value));
    });
    return () => { current = false; };
  }, [year, organization, reload]);

  const selectedProject = (project ? projects.find((item) => same(item.external_id, project)) : null) ?? null;
  const contributors = selectedProject?.people.filter((item) => item.role === "contributor") ?? [];
  const mentors = selectedProject?.people.filter((item) => item.role === "mentor") ?? [];

  const linkErrors = listFieldErrors(fields, "evidenceUrls", links);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!person || busy) return;
    setBusy(true);
    setError(null);
    setFields({});
    const result = await callApi("/api/v2/me/claims", { body: { personId: person, note: note.trim() || null, evidenceUrls: links.map((link) => link.trim()).filter(Boolean) } });
    if (!result.ok) { setBusy(false); setError(result.message); setFields(result.fields ?? {}); return; }
    router.push("/account");
    router.refresh();
  }

  function clearErrors() { setError(null); setFields({}); }

  return (
    <form className="cb-card cb-cm-form-card cb-cm-form cb-hub-form-card" onSubmit={submit}>
      <div className="cb-cm-form-row">
        <Picker label="1. GSoC year" placeholder="Choose a year" value={year?.toString() ?? null}
          options={years.map((item) => ({ value: String(item), label: String(item) }))}
          onChange={(value) => { setYear(Number(value)); setOrganization(null); setProject(null); setPerson(null); setOrganizations([]); setProjects([]); clearErrors(); }} />
        <Picker label="2. Organization" placeholder={year ? "Choose an organization" : "Choose a year first"} value={organization} disabled={!year} loading={loading === "organizations"}
          searchPlaceholder={`Search ${organizations.length} organizations`}
          options={organizations.map((item) => ({ value: item.slug, label: item.name, hint: `${item.projects} projects` }))}
          onChange={(value) => { setOrganization(value); setProject(null); setPerson(null); setProjects([]); clearErrors(); }} />
      </div>
      <Picker label="3. Project" placeholder={organization ? "Choose your project" : "Choose an organization first"} value={project} disabled={!organization} loading={loading === "projects"}
        searchPlaceholder="Search by title or name"
        options={projects.map((item) => ({ value: item.external_id, label: item.title, hint: item.people.filter((p) => p.role === "contributor").map((p) => p.archived_name).join(", ") }))}
        onChange={(value) => { setProject(value); setPerson(null); clearErrors(); }} />
      {loadError ? (
        <Notice tone="error">{loadError} <button type="button" className="cb-hub-text-button" onClick={() => setReload((count) => count + 1)}>Try again</button></Notice>
      ) : null}

      {selectedProject ? (
        <div className="cb-hub-steps">
          <span className="cb-hub-label">4. Which person on this project are you?</span>
          <div className="cb-hub-people" role="radiogroup" aria-label="Your role on this project">
            {[...contributors, ...mentors].map((item) => (
              <button key={item.person_id} type="button" role="radio" aria-checked={person === item.person_id} className="cb-hub-person-option"
                disabled={item.verified} onClick={() => { setPerson(item.person_id); clearErrors(); }}>
                <span className="cb-hub-person" style={{ gap: 10 }}>
                  <IconUser size={18} stroke={1.75} aria-hidden />
                  <span>
                    <strong style={{ fontWeight: 500 }}>{item.archived_name}</strong>
                    <small>{item.role === "contributor" ? "Contributor" : "Mentor"}{item.verified ? " · already verified for another account" : ""}</small>
                  </span>
                </span>
                {person === item.person_id ? <IconCircleCheck size={18} stroke={2} aria-hidden style={{ color: "var(--cb-primary)" }} /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {person ? (
        <>
          <TextArea label="Note for the reviewer (private, optional)" value={note} onChange={setNote} max={1000} rows={3} error={fields.note}
            placeholder="For example: I used my university email for GSoC, and my GitHub is linked below" />
          {links.map((link, index) => (
            <TextField key={index} label={`Evidence link ${index + 1} (optional)`} type="url" inputMode="url" value={link} max={2048} counter={false} placeholder="https://"
              error={linkErrors[index]} onChange={(value) => setLinks((current) => current.map((item, at) => (at === index ? value : item)))}
              hint={index === 0 ? "Your final report, a merged pull request, or the organization's page that lists you" : undefined} />
          ))}
        </>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="cb-cm-form-foot">
        <p>We check every claim against Google&apos;s archive. GSoC accepts a contributor at most twice, and nobody can mentor and contribute in the same year.</p>
        <span className="cb-hub-actions">
          <Link href="/account" className="cb-button cb-button-outline">Cancel</Link>
          <button type="submit" className="cb-button cb-button-ink" disabled={!person || busy}>{busy ? "Claiming…" : "Claim this project"}</button>
        </span>
      </div>
    </form>
  );
}
