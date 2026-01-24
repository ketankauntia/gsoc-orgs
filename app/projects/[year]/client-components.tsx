"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";
import type { ProjectEntry } from "@/lib/projects-page-types";

interface ExpandableProjectListProps {
  projects: ProjectEntry[];
  initialLimit?: number;
}

export function ExpandableProjectList({
  projects,
  initialLimit = 20,
}: ExpandableProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Get unique organizations for filter
  const organizations = useMemo(() => {
    const orgs = new Map<string, string>();
    projects.forEach((p) => {
      if (!orgs.has(p.org_slug)) {
        orgs.set(p.org_slug, p.org_name);
      }
    });
    return Array.from(orgs.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  // Filter projects - CLIENT-SIDE ONLY, NO DB QUERIES
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        project.project_title.toLowerCase().includes(searchLower) ||
        project.contributor.toLowerCase().includes(searchLower) ||
        project.org_name.toLowerCase().includes(searchLower) ||
        project.mentors.some((m) => m.toLowerCase().includes(searchLower)) ||
        project.tech_stack?.some((t) => t.toLowerCase().includes(searchLower));

      // Organization filter
      const matchesOrg = !selectedOrg || project.org_slug === selectedOrg;

      return matchesSearch && matchesOrg;
    });
  }, [projects, searchQuery, selectedOrg]);

  // Pagination
  const displayedProjects = showAll
    ? filteredProjects
    : filteredProjects.slice(0, initialLimit);
  const hasMore = filteredProjects.length > initialLimit;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, contributors, mentors, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedOrg || ""}
          onChange={(e) => setSelectedOrg(e.target.value || null)}
          className="px-3 py-2 border rounded-md bg-background text-sm min-w-[200px]"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.slug} value={org.slug}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <Text variant="small" className="text-muted-foreground">
        Showing {displayedProjects.length} of {filteredProjects.length} projects
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedOrg && ` from ${organizations.find(o => o.slug === selectedOrg)?.name}`}
      </Text>

      {/* Project List */}
      <div className="space-y-3">
        {displayedProjects.map((project) => (
          <ProjectCard key={project.project_id} project={project} />
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {filteredProjects.length} Projects
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-8">
          <Text className="text-muted-foreground">
            No projects found matching your criteria.
          </Text>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setSelectedOrg(null);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Text className="font-medium truncate">{project.project_title}</Text>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Link
              href={`/organizations/${project.org_slug}`}
              className="text-sm text-primary hover:underline"
            >
              {project.org_name}
            </Link>
            <span className="text-muted-foreground">•</span>
            <Text variant="small" className="text-muted-foreground">
              {project.contributor}
            </Text>
          </div>
          {project.mentors.length > 0 && (
            <Text variant="small" className="text-muted-foreground mt-1">
              Mentors: {project.mentors.slice(0, 3).join(", ")}
              {project.mentors.length > 3 && ` +${project.mentors.length - 3} more`}
            </Text>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {project.tech_stack?.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.tech_stack && project.tech_stack.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.tech_stack.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple search component if needed separately
export function ProjectSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search projects..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
        className="pl-10"
      />
    </div>
  );
}
