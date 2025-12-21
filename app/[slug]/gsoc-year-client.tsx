"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Input, CardWrapper, Heading, Text, Button } from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
import { Organization } from "@/lib/api";

interface GSoCYearClientProps {
  year: string;
  organizations: Organization[];
  projects: Array<{
    project_id: string;
    project_title: string;
    project_abstract_short: string;
    contributor?: string;
    mentors?: string;
    project_code_url?: string;
    org_name: string;
    org_slug: string;
    year: number;
  }>;
  highestSelectionsByTech: Array<{ name: string; count: number }>;
  highestSelectionsByOrg: Array<{ name: string; slug: string; count: number }>;
  mentorsAndContributors: Array<{
    org_name: string;
    org_slug: string;
    mentors: string | string[];
    contributors: string[];
  }>;
}

export function GSoCYearClient({
  year,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizations, // Unused but kept for future use (only used in commented-out code)
  projects,
  highestSelectionsByTech,
  highestSelectionsByOrg,
  mentorsAndContributors,
}: GSoCYearClientProps) {
  const [projectSearch, setProjectSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllMentors, setShowAllMentors] = useState(false);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projects;
    const searchLower = projectSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_title.toLowerCase().includes(searchLower) ||
        p.project_abstract_short.toLowerCase().includes(searchLower) ||
        p.org_name.toLowerCase().includes(searchLower)
    );
  }, [projects, projectSearch]);

  // Filter mentors/contributors based on search
  const filteredMentorsContributors = useMemo(() => {
    if (!nameSearch) return mentorsAndContributors;
    const searchLower = nameSearch.toLowerCase();
    return mentorsAndContributors.filter((mc) => {
      const mentorsArray = Array.isArray(mc.mentors) ? mc.mentors : [mc.mentors].filter(Boolean);
      return (
        mc.org_name.toLowerCase().includes(searchLower) ||
        mentorsArray.some((m) => String(m).toLowerCase().includes(searchLower)) ||
        mc.contributors.some((c) => c.toLowerCase().includes(searchLower))
      );
    });
  }, [mentorsAndContributors, nameSearch]);

  const displayedProjects = showAllProjects
    ? filteredProjects
    : filteredProjects.slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Highest Selections Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Heading variant="subsection">
            Highest Selections in GSoC {year}
          </Heading>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Tech Stack */}
          <CardWrapper padding="md">
            <Heading variant="small" className="text-lg mb-4">
              By Tech Stack
            </Heading>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={highestSelectionsByTech.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Selections"]}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]} 
                    maxBarSize={28}
                  >
                    {highestSelectionsByTech.slice(0, 10).map((_, index) => {
                      const colors = [
                        "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
                        "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
                      ];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                    <LabelList
                      dataKey="count"
                      position="right"
                      fill="#374151"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardWrapper>

          {/* By Organization */}
          <CardWrapper padding="md">
            <Heading variant="small" className="text-lg mb-4">
              By Organization
            </Heading>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={highestSelectionsByOrg.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Projects"]}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]} 
                    maxBarSize={28}
                  >
                    {highestSelectionsByOrg.slice(0, 10).map((_, index) => {
                      const colors = [
                        "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
                        "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
                      ];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                    <LabelList
                      dataKey="count"
                      position="right"
                      fill="#374151"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardWrapper>
        </div>
      </section>

      {/* All Organizations Section */}
      {/* New Organizations section commented out - not correct */}
      {/* <section className="space-y-6">
        <div className="text-center">
          <Heading variant="subsection">
            New Organizations in GSoC {year}
          </Heading>
          <Text variant="muted" className="text-sm mt-1">
            Organizations participating in GSoC for the first time
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrgs.map((org) => (
            <OrganizationCard key={org.slug} org={org} />
          ))}
        </div>

        {organizations.length > 6 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAllOrgs(!showAllOrgs)}
            >
              {showAllOrgs ? "Show Less" : `Show More (${organizations.length - 6} more)`}
            </Button>
          </div>
        )}
      </section> */}

      {/* Projects Section */}
      <section className="space-y-6">
        <div className="text-center space-y-4">
          <Heading variant="subsection">
            Projects
          </Heading>
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="w-full pl-12 pr-4 py-2 rounded-full h-12 text-base"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.project_id}
              project={{
                id: project.project_id,
                title: project.project_title,
                short_description: project.project_abstract_short,
                contributor: project.contributor,
                mentors: project.mentors,
                project_url: project.project_code_url || "#",
                code_url: project.project_code_url,
              }}
            />
          ))}
        </div>

        {filteredProjects.length > 6 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAllProjects(!showAllProjects)}
            >
              {showAllProjects
                ? "Show Less"
                : `Show More (${filteredProjects.length - 6} more)`}
            </Button>
          </div>
        )}
      </section>

      {/* Mentors & Contributors Section */}
      <section className="space-y-6">
        <div className="text-center space-y-4">
          <Heading variant="subsection">
            Mentors & Contributors
          </Heading>
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or organization"
              className="w-full pl-12 pr-4 py-2 rounded-full h-12 text-base"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
          </div>
        </div>

        <CardWrapper padding="md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Organization
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Mentor
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Contributor
                  </th>
                </tr>
              </thead>
              <tbody>
                {(showAllMentors ? filteredMentorsContributors : filteredMentorsContributors.slice(0, 10)).map((mc) => (
                  <tr key={mc.org_slug} className="border-b">
                    <td className="py-3 px-4">
                      <a
                        href={`/organizations/${mc.org_slug}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {mc.org_name}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <Text className="text-sm">
                        {Array.isArray(mc.mentors)
                          ? mc.mentors.length > 0
                            ? mc.mentors.join(", ")
                            : "-"
                          : mc.mentors || "-"}
                      </Text>
                    </td>
                    <td className="py-3 px-4">
                      <Text className="text-sm">
                        {mc.contributors.length > 0
                          ? mc.contributors.join(", ")
                          : "-"}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMentorsContributors.length > 10 && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllMentors(!showAllMentors)}
              >
                {showAllMentors
                  ? "Show Less"
                  : `Show More (${filteredMentorsContributors.length - 10} more)`}
              </Button>
            </div>
          )}
        </CardWrapper>
      </section>
    </div>
  );
}

