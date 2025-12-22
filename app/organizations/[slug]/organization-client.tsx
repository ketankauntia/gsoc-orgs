"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  ExternalLink,
  Github,
  MessageCircle,
  BookOpen,
  FileText,
  Award,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Section,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";
import { Organization } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ParticipationChart } from "./charts/participation-chart";
import { ProjectsChart } from "./charts/projects-chart";
import { LanguagesChart } from "./charts/languages-chart";
import { DifficultyChart } from "./charts/difficulty-chart";
import { ProjectCard } from "@/components/project-card";

// Extended organization type with stats
interface OrganizationWithStats extends Organization {
  stats?: {
    avg_projects_per_appeared_year: number;
    projects_by_year: Record<string, number>;
    students_by_year: Record<string, number>;
    total_students: number;
  };
  years?: Record<string, {
    num_projects: number;
    projects_url: string;
    projects: Array<{
      id: string;
      title: string;
      short_description: string;
      description: string;
      student_name: string;
      difficulty?: string;
      tags: string[];
      slug: string;
      status?: string;
      code_url?: string;
      project_url: string;
    }>;
  }>;
}

interface OrganizationClientProps {
  organization: OrganizationWithStats;
}

// Social link icon mapping
const socialIcons: Record<string, React.ElementType> = {
  twitter: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  slack: MessageCircle,
  discord: MessageCircle,
  blog: BookOpen,
  github: Github,
};

export function OrganizationClient({ organization: org }: OrganizationClientProps) {
  // Get available years from organization data, sorted descending
  const availableYears = useMemo(() => {
    return [...org.active_years].sort((a, b) => b - a);
  }, [org.active_years]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || 2025);
  const [yearStartIndex, setYearStartIndex] = useState(0);
  const [showAllTechnologies, setShowAllTechnologies] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const VISIBLE_YEARS = 8;
  const ITEMS_PER_ROW = 6; // Approximate items per row
  const VISIBLE_ROWS = 2;

  // Get projects for selected year
  const yearProjects = useMemo(() => {
    if (!org.years) return [];
    const yearKey = `year_${selectedYear}`;
    const yearData = org.years[yearKey as keyof typeof org.years];
    if (!yearData || typeof yearData !== 'object') return [];
    return (yearData as { projects?: Array<{ id: string; title: string; short_description: string; description: string; student_name: string; difficulty?: string; tags: string[]; slug: string; status?: string; code_url?: string; project_url: string }> }).projects || [];
  }, [org, selectedYear]);

  // Generate FAQ based on organization
  const orgFaq = useMemo(() => [
    {
      question: `Is ${org.name} beginner friendly?`,
      answer: org.technologies.some(t => 
        ['Python', 'JavaScript', 'HTML', 'CSS'].includes(t)
      ) 
        ? `${org.name} uses technologies like ${org.technologies.slice(0, 3).join(', ')} which are commonly recommended for beginners. Check their contribution guidelines and starter issues to get started.`
        : `${org.name} primarily works with ${org.technologies.slice(0, 3).join(', ')}. While these may require some experience, many organizations welcome beginners who show dedication and willingness to learn.`,
    },
    {
      question: `What tech stack does ${org.name} use in GSoC?`,
      answer: `${org.name} primarily uses ${org.technologies.join(', ')}. Projects may require expertise in one or more of these technologies. Check individual project requirements for specific skill needs.`,
    },
    {
      question: `How many projects has ${org.name} completed in GSoC?`,
      answer: `${org.name} has successfully completed ${org.total_projects} projects across ${org.active_years.length} years of GSoC participation (${org.first_year}-${org.last_year}).`,
    },
    {
      question: `How can I contribute to ${org.name}?`,
      answer: org.contact?.guide_url 
        ? `Visit their contribution guide to learn how to get started. Start with small contributions, engage with the community, and build familiarity before GSoC applications open.`
        : `Start by exploring their GitHub repository, reading documentation, and joining their communication channels. Look for "good first issue" labels to begin contributing.`,
    },
  ], [org]);

  // Prepare chart data
  const participationData = useMemo(() => {
    return org.active_years.map(year => ({
      year: year.toString(),
      participated: 1,
    })).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [org.active_years]);

  const projectsData = useMemo(() => {
    if (!org.stats?.projects_by_year) return [];
    return Object.entries(org.stats.projects_by_year)
      .map(([year, count]) => ({
        year: year.replace('year_', ''),
        projects: count as number,
      }))
      .filter(d => d.projects > 0)
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [org.stats]);

  // Calculate technology usage for languages chart
  const languagesData = useMemo(() => {
    const langMap: Record<string, number> = {};
    org.technologies.forEach((tech, index) => {
      // Weight earlier technologies higher
      langMap[tech] = org.technologies.length - index;
    });
    return Object.entries(langMap)
      .map(([name, weight]) => ({ name, count: weight }))
      .slice(0, 10);
  }, [org.technologies]);

  // Calculate difficulty distribution from projects
  const difficultyData = useMemo(() => {
    const counts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
    if (org.years) {
      Object.values(org.years).forEach((yearData) => {
        if (yearData && typeof yearData === 'object' && 'projects' in yearData) {
          (yearData.projects as Array<{ difficulty?: string }>)?.forEach((project) => {
            const diff = project.difficulty;
            if (diff && diff in counts) {
              counts[diff as keyof typeof counts]++;
            }
          });
        }
      });
    }
    return [
      { level: 'Beginner', count: counts.Beginner || 0 },
      { level: 'Intermediate', count: counts.Intermediate || 0 },
      { level: 'Advanced', count: counts.Advanced || 0 },
    ];
  }, [org.years]);

  // Social/Communication links - only include present ones
  const socialLinks = useMemo(() => {
    const links: Array<{ name: string; url: string; icon: React.ElementType }> = [];
    
    if (org.social?.twitter) {
      links.push({ name: 'X', url: org.social.twitter, icon: socialIcons.twitter });
    }
    if (org.social?.slack) {
      links.push({ name: 'Slack', url: org.social.slack, icon: socialIcons.slack });
    }
    if (org.social?.discord) {
      links.push({ name: 'Discord', url: org.social.discord, icon: socialIcons.discord });
    }
    if (org.social?.blog) {
      links.push({ name: 'Blogs', url: org.social.blog, icon: socialIcons.blog });
    }
    if (org.contact?.guide_url) {
      links.push({ name: 'Contribution Guidelines', url: org.contact.guide_url, icon: FileText });
    }
    
    return links;
  }, [org.social, org.contact]);

  const websiteUrl = org.social?.blog || org.contact?.guide_url;
  const githubUrl = org.social?.github;

  // Calculate visible technologies and topics
  const maxVisibleTech = ITEMS_PER_ROW * VISIBLE_ROWS;
  const maxVisibleTopics = ITEMS_PER_ROW * VISIBLE_ROWS;
  const visibleTechnologies = showAllTechnologies ? org.technologies : org.technologies.slice(0, maxVisibleTech);
  const visibleTopics = showAllTopics ? (org.topics || []) : (org.topics || []).slice(0, maxVisibleTopics);

  // Year navigation
  const visibleYears = availableYears.slice(yearStartIndex, yearStartIndex + VISIBLE_YEARS);
  const canGoPrev = yearStartIndex > 0;
  const canGoNext = yearStartIndex + VISIBLE_YEARS < availableYears.length;

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <Section noPadding className="pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Organization Header */}
            <header className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo */}
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0 border-2 border-sky-200 overflow-hidden shadow-sm">
                  {org.img_r2_url ? (
                    <Image
                      src={org.img_r2_url}
                      alt={`${org.name} logo`}
                      width={144}
                      height={144}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-sky-600">
                      {org.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Heading as="h1" variant="section" className="text-3xl md:text-4xl mb-2">
                      {org.name}
                    </Heading>
                  </div>
                  
                  <Text className="text-foreground/80 line-clamp-4">
                    {org.description}
                  </Text>

                  {/* Separator */}
                  <div className="border-b border-foreground/20 pt-2" />

                  {/* Primary Links - conditionally render */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {websiteUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    {githubUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="w-4 h-4" />
                          GitHub
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Social Tags - only render if there are links */}
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-accent transition-colors"
                        >
                          <link.icon className="w-3.5 h-3.5" />
                          {link.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* GSoC Participation History */}
            <section className="space-y-4">
              <Heading variant="small" className="text-lg">
                GSoC Participation History
              </Heading>
              <div className="flex flex-wrap gap-2">
                {availableYears.map((year) => (
                  <Link
                    key={year}
                    href={`/gsoc-${year}-organizations`}
                    prefetch={true}
                  >
                    <Badge
                      variant="outline"
                      className="px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
                    >
                      {year}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>

            {/* Technologies with Show More */}
            {org.technologies && org.technologies.length > 0 && (
              <section className="space-y-4">
                <Heading variant="small" className="text-lg">
                  Technologies
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {visibleTechnologies.map((tech) => (
                    <Link href={`/tech-stack/${encodeURIComponent(tech.toLowerCase())}`} key={tech} prefetch={true}>
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        {tech}
                      </Badge>
                    </Link>
                  ))}
                </div>
                {org.technologies.length > maxVisibleTech && (
                  <button
                    onClick={() => setShowAllTechnologies(!showAllTechnologies)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {showAllTechnologies ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show more ({org.technologies.length - maxVisibleTech} more) <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </section>
            )}

            {/* Topics with Show More */}
            {org.topics && org.topics.length > 0 && (
              <section className="space-y-4">
                <Heading variant="small" className="text-lg">
                  Topics
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {visibleTopics.map((topic) => (
                    <Link href={`/topics/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'))}`} key={topic} prefetch={true}>
                      <Badge 
                        variant="outline" 
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                      >
                        {topic}
                      </Badge>
                    </Link>
                  ))}
                </div>
                {(org.topics?.length || 0) > maxVisibleTopics && (
                  <button
                    onClick={() => setShowAllTopics(!showAllTopics)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {showAllTopics ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show more ({(org.topics?.length || 0) - maxVisibleTopics} more) <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </section>
            )}

            {/* Past Projects */}
            <section className="space-y-6">
              <Heading variant="small" className="text-lg text-center">
                Past Projects
              </Heading>
              
              {/* Year Tabs with Arrow Navigation */}
              <div className="flex items-center justify-center gap-2">
                {canGoPrev && (
                  <button
                    onClick={() => setYearStartIndex(prev => Math.max(0, prev - 1))}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    aria-label="Previous years"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center border-b pb-4">
                  {visibleYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                        selectedYear === year
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                {canGoNext && (
                  <button
                    onClick={() => setYearStartIndex(prev => Math.min(availableYears.length - VISIBLE_YEARS, prev + 1))}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    aria-label="Next years"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Project Cards Grid - Show ALL projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {yearProjects.length > 0 ? (
                  yearProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id || index}
                      project={{
                        id: project.id,
                        title: project.title,
                        short_description: project.short_description,
                        description: project.description,
                        student_name: project.student_name,
                        difficulty: project.difficulty,
                        tags: project.tags,
                        project_url: project.project_url,
                        code_url: project.code_url,
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center">
                    <Text variant="muted">No projects found for {selectedYear}</Text>
                  </div>
                )}
              </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-6">
              <Heading variant="small" className="text-lg">
                Frequently Asked Questions
              </Heading>
              <CardWrapper padding="none" className="divide-y">
                <Accordion type="single" collapsible className="w-full">
                  {orgFaq.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="px-6">
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Text variant="muted" className="pl-6">
                          {faq.answer}
                        </Text>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardWrapper>
            </section>

            {/* Organization Footer Info */}
            <section className="border-t pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <Text variant="small" className="text-muted-foreground">
                    <span className="font-semibold">{org.name}</span> | GSoC Org Profile & Stats - 
                    Learn about {org.name}&apos;s involvement in Google Summer of Code (GSoC), their technologies, detailed reports.
                  </Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Text variant="small" className="text-muted-foreground">Category:</Text>
                      <Link href={`/organizations?category=${encodeURIComponent(org.category)}`} prefetch={true}>
                        <Badge variant="default" className="bg-sky-500 hover:bg-sky-600">
                          {org.category}
                        </Badge>
                      </Link>
                    </div>
                    <span className="text-muted-foreground">|</span>
                    <Badge variant={org.is_currently_active ? "default" : "secondary"}>
                      {org.is_currently_active ? "Currently Active" : "Inactive"}
                    </Badge>
                    <span className="text-muted-foreground">|</span>
                    <Text variant="small" className="text-muted-foreground">
                      Contributor Readiness
                    </Text>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Participation Chart */}
            <CardWrapper padding="md">
              <div className="flex items-center justify-between mb-4">
                <Heading variant="small" className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Participation
                </Heading>
              </div>
              <ParticipationChart data={participationData} projectsData={projectsData} />
            </CardWrapper>

            {/* Projects Chart */}
            <CardWrapper padding="md">
              <div className="flex items-center justify-between mb-4">
                <Heading variant="small" className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Projects
                </Heading>
              </div>
              <ProjectsChart data={projectsData} />
            </CardWrapper>

            {/* Top Programming Languages */}
            <CardWrapper padding="md">
              <div className="mb-4">
                <Heading variant="small" className="text-base">
                  Top Programming Languages
                </Heading>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">{org.technologies[0]}</span> dominates with primary adoption
                </div>
              </div>
              <LanguagesChart data={languagesData} />
            </CardWrapper>

            {/* Project Difficulty Distribution */}
            <CardWrapper padding="md">
              <Heading variant="small" className="text-base mb-4">
                Project Difficulty Distribution
              </Heading>
              <DifficultyChart data={difficultyData} />
            </CardWrapper>
          </div>
        </div>
      </Section>
    </div>
  );
}

