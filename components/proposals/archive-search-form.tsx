"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { ArchiveFacets } from "@/lib/proposals/archive-search";
import { filterArchiveOrganizationsByYear } from "@/lib/proposals/archive-search-core";

type Props = {
  facets: ArchiveFacets;
  initial: { year: string; q: string; organization: string; technology: string };
  /** Where the form submits — the same page, or the claim flow. */
  action?: string;
};

/**
 * Open search over the archive. Everything selectable is a chooser backed by
 * real data, so a typo in an organization or technology name can no longer
 * silently return nothing. Project title stays free text because 10,951 titles
 * is past the point where a dropdown helps.
 */
export function ArchiveSearchForm({ facets, initial, action = "/proposals" }: Props) {
  const [year, setYear] = useState(initial.year);
  const [organization, setOrganization] = useState(initial.organization);
  const [technology, setTechnology] = useState(initial.technology);

  const yearOptions: ComboboxOption[] = facets.years.map((value) => ({
    value: String(value),
    label: `GSoC ${value}`,
  }));

  const selectedYear = Number.parseInt(year, 10);
  const availableOrganizations = useMemo(
    () => filterArchiveOrganizationsByYear(facets.organizations, Number.isFinite(selectedYear) ? selectedYear : undefined),
    [facets.organizations, selectedYear],
  );

  useEffect(() => {
    if (organization && !availableOrganizations.some((org) => org.slug === organization)) setOrganization("");
  }, [availableOrganizations, organization]);

  const organizationOptions: ComboboxOption[] = availableOrganizations.map((org) => ({
    value: org.slug,
    label: org.name,
    hint: `${org.projectCount.toLocaleString("en-IN")} archived projects`,
    keywords: org.slug,
  }));

  const technologyOptions: ComboboxOption[] = facets.technologies.map((group) => ({
    value: group.key,
    label: group.name,
    hint: `${group.orgCount.toLocaleString("en-IN")} organizations`,
    // Folded spellings stay searchable: typing "vuejs" still finds "Vue".
    keywords: group.aliases.join(" "),
  }));

  return (
    <form action={action} className="rounded-2xl border bg-background/95 p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Combobox
          name="year"
          label="GSoC year"
          value={year}
          onChange={setYear}
          options={yearOptions}
          placeholder="Any year"
          searchPlaceholder="2016 – 2025"
          visibleCount={12}
          emptyText="No such year in the archive"
        />
        <Combobox
          name="organization"
          label="Organization"
          value={organization}
          onChange={setOrganization}
          options={organizationOptions}
          placeholder="Any organization"
          searchPlaceholder="Type an organization name…"
          emptyText="No organization matches"
        />
        <Combobox
          name="technology"
          label="Technology"
          value={technology}
          onChange={setTechnology}
          options={technologyOptions}
          placeholder="Any technology"
          searchPlaceholder="Python, Rust, React…"
          emptyText="No technology matches"
          description="Matches the organization's stack"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Project title</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input name="q" defaultValue={initial.q} className="pl-9" placeholder="Search words in the title" />
          </span>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Every filter is optional. No account needed to search or read.
        </p>
        <Button type="submit" size="lg">
          <Search className="size-4" /> Search the archive
        </Button>
      </div>
    </form>
  );
}
