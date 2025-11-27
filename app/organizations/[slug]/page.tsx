import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Github, Globe, Users, Calendar, Code } from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Grid,
} from "@/components/ui";

/**
 * Organization Detail Page
 * Route: /organizations/[slug]
 * 
 * Shows complete information about a single GSoC organization including:
 * - Logo, name, description
 * - Topics and tech stack tags
 * - Years active in GSoC
 * - List of projects
 * - External links (website, GitHub, etc.)
 * 
 * TODO: Replace mock data with actual database/API fetch
 */

// Type definitions
interface Organization {
  slug: string;
  name: string;
  logo: string | null;
  description: string;
  longDescription?: string;
  topics: string[];
  techStack: string[];
  yearsActive: number[];
  projectCount: number;
  website?: string;
  github?: string;
  projects: Project[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  techStack: string[];
}

/**
 * TODO: Replace with actual database fetch
 * Example with Prisma:
 * 
 * async function getOrganization(slug: string) {
 *   const org = await prisma.organization.findUnique({
 *     where: { slug },
 *     include: {
 *       projects: {
 *         take: 6, // Show first 6 projects
 *         orderBy: { createdAt: 'desc' }
 *       }
 *     }
 *   });
 *   return org;
 * }
 */
async function getOrganization(slug: string): Promise<Organization | null> {
  // Mock data - replace with actual fetch
  const mockData: Record<string, Organization> = {
    "python-software-foundation": {
      slug: "python-software-foundation",
      name: "Python Software Foundation",
      logo: null,
      description: "The mission of the Python Software Foundation is to promote, protect, and advance the Python programming language.",
      longDescription: "The Python Software Foundation is the organization behind Python. We've become the hub for the Python community, providing infrastructure and supporting the ecosystem through programs like Google Summer of Code. Our projects range from the CPython interpreter to packaging tools like pip.",
      topics: ["Programming Languages", "Open Source", "Education", "Web Development"],
      techStack: ["Python", "C", "JavaScript", "Docker"],
      yearsActive: [2020, 2021, 2022, 2023, 2024],
      projectCount: 8,
      website: "https://www.python.org",
      github: "https://github.com/python",
      projects: [
        {
          id: "cpython-performance",
          title: "CPython Performance Improvements",
          description: "Work on optimizing the CPython interpreter for better performance across different workloads.",
          difficulty: "Advanced",
          techStack: ["Python", "C"],
        },
        {
          id: "pip-resolver",
          title: "Pip Dependency Resolver Enhancement",
          description: "Improve the dependency resolution algorithm in pip to handle complex scenarios better.",
          difficulty: "Intermediate",
          techStack: ["Python"],
        },
        {
          id: "async-docs",
          title: "Async/Await Documentation",
          description: "Create comprehensive documentation and tutorials for Python's async/await features.",
          difficulty: "Beginner",
          techStack: ["Python", "Documentation"],
        },
      ],
    },
    "mozilla": {
      slug: "mozilla",
      name: "Mozilla",
      logo: null,
      description: "Mozilla is a global community of technologists, thinkers, and builders working together to keep the Internet alive and accessible.",
      longDescription: "Mozilla champions a healthy internet and believes in an internet that is truly public resource, open and accessible to all. We develop Firefox and other open-source projects that help users take control of their online experience.",
      topics: ["Web Browser", "Privacy", "Open Web", "JavaScript"],
      techStack: ["Rust", "JavaScript", "C++", "Python"],
      yearsActive: [2019, 2020, 2021, 2022, 2023, 2024],
      projectCount: 12,
      website: "https://www.mozilla.org",
      github: "https://github.com/mozilla",
      projects: [
        {
          id: "firefox-extensions",
          title: "Firefox Extensions API",
          description: "Enhance the WebExtensions API to support more powerful browser extensions.",
          difficulty: "Intermediate",
          techStack: ["JavaScript", "WebExtensions"],
        },
        {
          id: "rust-components",
          title: "Rust Components in Firefox",
          description: "Integrate more Rust components into Firefox for improved performance and security.",
          difficulty: "Advanced",
          techStack: ["Rust", "C++"],
        },
      ],
    },
  };

  // Simulate async fetch
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return mockData[slug] || null;
}

/**
 * Generate static params for static site generation
 * TODO: Fetch all organization slugs from database
 */
export async function generateStaticParams() {
  return [
    { slug: "python-software-foundation" },
    { slug: "mozilla" },
  ];
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrganization(slug);
  
  if (!org) {
    return {
      title: "Organization Not Found",
    };
  }

  return {
    title: `${org.name} - GSoC Guide`,
    description: org.description,
  };
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-12">
      {/* Organization Header */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-muted flex items-center justify-center shrink-0 border">
            {org.logo ? (
              <Image
                src={org.logo}
                alt={`${org.name} logo`}
                width={128}
                height={128}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground">
                {org.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <Heading as="h1" variant="hero" className="text-4xl md:text-5xl mb-2">
                {org.name}
              </Heading>
              <Text variant="lead" className="text-muted-foreground">
                {org.description}
              </Text>
            </div>

            {/* External Links */}
            <div className="flex flex-wrap gap-3">
              {org.website && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              )}
              {org.github && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={org.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Long Description */}
        {org.longDescription && (
          <div className="p-6 rounded-lg bg-muted/50 border">
            <Text>{org.longDescription}</Text>
          </div>
        )}
      </section>

      {/* Horizontal Stats Bar */}
      {/* <section>
        <div className="flex flex-wrap items-center justify-center gap-8 p-6 rounded-xl bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Projects
              </Text>
              <Heading variant="small">{org.projectCount}</Heading>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Years Active
              </Text>
              <Heading variant="small">{org.yearsActive.length}</Heading>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Technologies
              </Text>
              <Heading variant="small">{org.techStack.length}</Heading>
            </div>
          </div>
        </div>
      </section> */}

      {/* Analytics & Graphs */}
      <section>
        <Heading variant="section" className="mb-6">
          Organization Analytics
        </Heading>
        <Grid cols={{ default: 1, lg: 3 }} gap="lg">
          {/* Graph 1: Yearly Project Count Trend */}
          <CardWrapper className="col-span-1 lg:col-span-2">
            <Heading variant="small" className="mb-4">
              Project Trend Over Years
            </Heading>
            <div className="h-64">
              {/* Line Chart SVG */}
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Grid lines */}
                <line x1="40" y1="180" x2="380" y2="180" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="40" y1="140" x2="380" y2="140" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="40" y1="100" x2="380" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="40" y1="60" x2="380" y2="60" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="40" y1="20" x2="380" y2="20" stroke="currentColor" strokeOpacity="0.1" />
                
                {/* Y-axis labels */}
                <text x="10" y="185" className="text-xs fill-muted-foreground">0</text>
                <text x="10" y="145" className="text-xs fill-muted-foreground">2</text>
                <text x="10" y="105" className="text-xs fill-muted-foreground">4</text>
                <text x="10" y="65" className="text-xs fill-muted-foreground">6</text>
                <text x="10" y="25" className="text-xs fill-muted-foreground">8</text>
                
                {/* Data line - example: 3,2,4,5,8 projects over 5 years */}
                <polyline
                  points="60,140 120,160 180,100 240,80 300,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary"
                />
                
                {/* Data points */}
                <circle cx="60" cy="140" r="5" className="fill-primary" />
                <circle cx="120" cy="160" r="5" className="fill-primary" />
                <circle cx="180" cy="100" r="5" className="fill-primary" />
                <circle cx="240" cy="80" r="5" className="fill-primary" />
                <circle cx="300" cy="20" r="5" className="fill-primary" />
                
                {/* X-axis labels */}
                <text x="50" y="195" className="text-xs fill-muted-foreground">2020</text>
                <text x="110" y="195" className="text-xs fill-muted-foreground">2021</text>
                <text x="170" y="195" className="text-xs fill-muted-foreground">2022</text>
                <text x="230" y="195" className="text-xs fill-muted-foreground">2023</text>
                <text x="290" y="195" className="text-xs fill-muted-foreground">2024</text>
              </svg>
            </div>
            <Text variant="small" className="text-muted-foreground mt-2 text-center">
              Growing trend shows increasing project opportunities
            </Text>
          </CardWrapper>

          {/* Graph 2: Tech Stack Distribution (Pie Chart) */}
          <CardWrapper>
            <Heading variant="small" className="mb-4">
              Tech Stack Mix
            </Heading>
            <div className="h-64 flex items-center justify-center">
              {/* Donut Chart */}
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                {/* Python - 60% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${60 * 2.51} ${100 * 2.51}`}
                  className="text-primary"
                  opacity="0.9"
                />
                {/* C - 20% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${20 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`-${60 * 2.51}`}
                  className="text-primary"
                  opacity="0.6"
                />
                {/* Rust - 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${10 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`-${80 * 2.51}`}
                  className="text-primary"
                  opacity="0.3"
                />
                {/* Docs - 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${10 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`-${90 * 2.51}`}
                  className="text-muted-foreground"
                  opacity="0.5"
                />
              </svg>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary opacity-90" />
                  Python
                </span>
                <span className="text-muted-foreground">60%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary opacity-60" />
                  C
                </span>
                <span className="text-muted-foreground">20%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary opacity-30" />
                  Rust
                </span>
                <span className="text-muted-foreground">10%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground opacity-50" />
                  Docs
                </span>
                <span className="text-muted-foreground">10%</span>
              </div>
            </div>
          </CardWrapper>
        </Grid>

        {/* Graph 3: Project Difficulty Distribution (Full Width Bar) */}
        {/* <CardWrapper className="mt-6">
          <Heading variant="small" className="mb-4">
            Project Difficulty Breakdown
          </Heading>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text variant="small">Beginner Friendly</Text>
                <Text variant="small" className="text-muted-foreground">
                  40% (5 projects)
                </Text>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[40%] bg-primary rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text variant="small">Intermediate</Text>
                <Text variant="small" className="text-muted-foreground">
                  35% (4 projects)
                </Text>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[35%] bg-primary/70 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text variant="small">Advanced</Text>
                <Text variant="small" className="text-muted-foreground">
                  25% (3 projects)
                </Text>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[25%] bg-primary/40 rounded-full" />
              </div>
            </div>
          </div>
          <Text variant="small" className="text-muted-foreground mt-4 text-center">
            40% of projects are suitable for beginners
          </Text>
        </CardWrapper> */}
      </section>

      {/* Topics & Tech Stack */}
      <section className="space-y-6">
        {/* Topics */}
        <div>
          <Heading variant="small" className="mb-3">
            Topics
          </Heading>
          <div className="flex flex-wrap gap-2">
            {org.topics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <Heading variant="small" className="mb-3">
            Tech Stack
          </Heading>
          <div className="flex flex-wrap gap-2">
            {org.techStack.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Years Active */}
      <section>
        <Heading variant="small" className="mb-4">
          GSoC Participation History
        </Heading>
        <div className="flex flex-wrap gap-2">
          {org.yearsActive.map((year) => (
            <Button key={year} variant="outline" size="sm" asChild>
              <Link href={`/organizations?year=${year}`}>
                GSoC {year}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* Past Projects by Year */}
      <section>
        <Heading variant="section" className="mb-6">
          Past Projects
        </Heading>

        {/* Year Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted rounded-lg">
          {org.yearsActive.map((year) => (
            <Button
              key={year}
              variant={year === 2024 ? "default" : "ghost"}
              size="sm"
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              {year}
            </Button>
          ))}
        </div>

        {/* Selected Year Display */}
        {/* <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
          <Text variant="small" className="text-muted-foreground">
            Showing <strong className="text-foreground">3 projects</strong> from <strong className="text-foreground">GSoC 2024</strong>
          </Text>
        </div> */}

        <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
          {org.projects.map((project) => (
            <CardWrapper key={project.id} hover className="flex flex-col">
              <div className="flex-1">
                <Heading variant="small" className="mb-2">
                  {project.title}
                </Heading>
                <Text variant="muted" className="text-sm line-clamp-3 mb-4">
                  {project.description}
                </Text>
                
                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Difficulty & Link */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge
                  variant={
                    project.difficulty === "Beginner"
                      ? "default"
                      : project.difficulty === "Intermediate"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {project.difficulty}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/organizations/${org.slug}/projects/${project.id}`}>
                    View →
                  </Link>
                </Button>
              </div>
            </CardWrapper>
          ))}
        </Grid>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link href={`/organizations/${org.slug}/projects`}>
              Explore All {org.projectCount} Projects
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
