"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button, Badge, Grid, Text } from "@/components/ui";
import { OrganizationSnapshot, ProjectSnapshot } from "@/lib/yearly-page-types";

interface ExpandableOrgListProps {
  organizations: OrganizationSnapshot[];
  initialCount?: number;
}

export function ExpandableOrgList({
  organizations,
  initialCount = 12,
}: ExpandableOrgListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedOrgs = showAll
    ? organizations
    : organizations.slice(0, initialCount);

  return (
    <div className="space-y-6">
      <Grid cols={{ default: 2, md: 3, lg: 4 }} gap="md">
        {displayedOrgs.map((org) => (
          <Link
            key={org.slug}
            href={`/organizations/${org.slug}`}
            className="group"
          >
            <div className="p-3 rounded-lg border bg-card hover:border-foreground/50 transition-all h-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border flex items-center justify-center shrink-0 overflow-hidden bg-background">
                  {org.logo_url ? (
                    <Image
                      src={org.logo_url}
                      alt={org.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {org.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-medium text-sm line-clamp-1">
                    {org.name}
                  </Text>
                  <Text variant="small" className="text-muted-foreground">
                    {org.project_count} projects
                  </Text>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </Grid>

      {organizations.length > initialCount && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>
                Show Less <ArrowUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All ({organizations.length}) <ArrowDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ExpandableProjectListProps {
  projects: ProjectSnapshot[];
  initialCount?: number;
}

export function ExpandableProjectList({
  projects,
  initialCount = 10,
}: ExpandableProjectListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedProjects = showAll
    ? projects
    : projects.slice(0, initialCount);

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {displayedProjects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <Text className="font-medium">{project.title}</Text>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{project.org_slug}</span> {/* In a real app, maybe map slug to name or link */}
                </div>
              </div>
              {/* <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech, idx) => (
                  <Badge key={`${project.id}-${tech}-${idx}`} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {projects.length > initialCount && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>
                Show Less <ArrowUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All ({projects.length}) <ArrowDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface MentorsContributorsTableProps {
  data: Array<{
    org_name: string;
    org_slug: string;
    mentors: string | string[];
    contributors: string | string[];
  }>;
}

export function MentorsContributorsTable({ data }: MentorsContributorsTableProps) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Filter based on search
  const filteredData = search 
    ? data.filter((item) => {
        const searchLower = search.toLowerCase();
        const mentorsArray = Array.isArray(item.mentors) ? item.mentors : [item.mentors].filter(Boolean);
        const contributorsArray = Array.isArray(item.contributors) ? item.contributors : [item.contributors].filter(Boolean);
        
        return (
          item.org_name.toLowerCase().includes(searchLower) ||
          mentorsArray.some((m) => String(m).toLowerCase().includes(searchLower)) ||
          contributorsArray.some((c) => String(c).toLowerCase().includes(searchLower))
        );
      })
    : data;

  const displayedData = showAll ? filteredData : filteredData.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-xl mx-auto">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
           <SearchIcon className="w-4 h-4" />
        </div>
        <input
          type="search"
          placeholder="Search by name or organization..."
          className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr className="border-b">
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Mentors</th>
                <th className="py-3 px-4">Contributors</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedData.length > 0 ? (
                displayedData.map((item, idx) => (
                  <tr key={`${item.org_slug}-${idx}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <Link href={`/organizations/${item.org_slug}`} className="hover:underline text-primary">
                        {item.org_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={Array.isArray(item.mentors) ? item.mentors.join(", ") : item.mentors || ""}>
                      {Array.isArray(item.mentors) && item.mentors.length > 0
                        ? item.mentors.join(", ")
                        : (item.mentors || "-")}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={Array.isArray(item.contributors) ? item.contributors.join(", ") : item.contributors || ""}>
                      {Array.isArray(item.contributors) && item.contributors.length > 0
                        ? item.contributors.join(", ")
                        : (item.contributors || "-")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={3} className="py-8 text-center text-muted-foreground">
                     No matches found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > 10 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>
                Show Less <ArrowUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All ({filteredData.length}) <ArrowDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
