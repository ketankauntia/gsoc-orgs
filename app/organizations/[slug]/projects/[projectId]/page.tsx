import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Code,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Github,
} from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Grid,
} from "@/components/ui";

/**
 * Individual Project Detail Page
 * Route: /organizations/[slug]/projects/[projectId]
 * 
 * Shows complete information about a single GSoC project including:
 * - Project overview and goals
 * - Expected outcomes
 * - Required skills and prerequisites
 * - Mentor information
 * - Timeline and difficulty
 * - Resources and references
 * 
 * TODO: Replace mock data with actual database/API fetch
 */

// Type definitions
interface Project {
  id: string;
  title: string;
  organization: {
    name: string;
    slug: string;
    logo: string | null;
  };
  year: number;
  description: string;
  longDescription: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  techStack: string[];
  mentors: Mentor[];
  expectedOutcomes: string[];
  prerequisites: string[];
  desiredSkills: string[];
  resources: Resource[];
  applicationDeadline?: string;
  maxApplicants?: number;
}

interface Mentor {
  name: string;
  role: string;
  avatar?: string;
  github?: string;
}

interface Resource {
  title: string;
  url: string;
  type: "Documentation" | "Repository" | "Tutorial" | "Article";
}

/**
 * TODO: Replace with actual database fetch
 */
async function getProject(
  orgSlug: string,
  projectId: string
): Promise<Project | null> {
  // Mock data - replace with actual fetch
  const mockProjects: Record<string, Project> = {
    "cpython-performance": {
      id: "cpython-performance",
      title: "CPython Performance Improvements",
      organization: {
        name: "Python Software Foundation",
        slug: "python-software-foundation",
        logo: null,
      },
      year: 2024,
      description:
        "Work on optimizing the CPython interpreter for better performance across different workloads.",
      longDescription:
        "This project focuses on identifying and implementing performance improvements in the CPython interpreter. You'll work on profiling different workloads, identifying bottlenecks, and implementing optimizations. This includes work on the bytecode compiler, the VM execution loop, and built-in functions. Your contributions will directly impact millions of Python developers worldwide.",
      difficulty: "Advanced",
      duration: "12 weeks (Full-time)",
      techStack: ["Python", "C", "Assembly", "Profiling Tools"],
      mentors: [
        {
          name: "Alice Johnson",
          role: "Core Developer",
          github: "alice-dev",
        },
        {
          name: "Bob Smith",
          role: "Performance Team Lead",
          github: "bob-perf",
        },
      ],
      expectedOutcomes: [
        "Identify and document at least 3 performance bottlenecks in CPython",
        "Implement optimizations that improve benchmark scores by 5-10%",
        "Submit at least 2 pull requests that get merged into CPython main branch",
        "Write comprehensive documentation of performance improvements",
        "Create benchmark suite for measuring improvements",
      ],
      prerequisites: [
        "Strong understanding of C programming",
        "Experience with Python internals or similar interpreters",
        "Familiarity with profiling and performance analysis tools",
        "Understanding of computer architecture and memory management",
        "Experience with Git and open-source contribution workflows",
      ],
      desiredSkills: [
        "Assembly language knowledge (x86-64 or ARM)",
        "Experience with LLVM or GCC compiler optimizations",
        "Knowledge of JIT compilation techniques",
        "Previous contributions to CPython or similar projects",
      ],
      resources: [
        {
          title: "CPython Developer's Guide",
          url: "https://devguide.python.org/",
          type: "Documentation",
        },
        {
          title: "CPython Source Repository",
          url: "https://github.com/python/cpython",
          type: "Repository",
        },
        {
          title: "Python Performance Benchmarks",
          url: "https://github.com/python/pyperformance",
          type: "Repository",
        },
        {
          title: "Optimizing Python Code",
          url: "https://wiki.python.org/moin/PythonSpeed",
          type: "Article",
        },
      ],
      applicationDeadline: "March 15, 2024",
      maxApplicants: 2,
    },
    "pip-resolver": {
      id: "pip-resolver",
      title: "Pip Dependency Resolver Enhancement",
      organization: {
        name: "Python Software Foundation",
        slug: "python-software-foundation",
        logo: null,
      },
      year: 2024,
      description:
        "Improve the dependency resolution algorithm in pip to handle complex scenarios better.",
      longDescription:
        "The pip dependency resolver is a critical component of Python's packaging ecosystem. This project aims to improve its performance and correctness when dealing with complex dependency scenarios. You'll work on optimizing the backtracking algorithm, improving error messages, and adding support for more advanced dependency constraints.",
      difficulty: "Intermediate",
      duration: "12 weeks (Full-time)",
      techStack: ["Python", "Graph Algorithms", "Testing"],
      mentors: [
        {
          name: "David Chen",
          role: "Pip Maintainer",
          github: "david-pip",
        },
      ],
      expectedOutcomes: [
        "Optimize resolver performance for common dependency patterns",
        "Improve error messages when conflicts occur",
        "Add comprehensive test coverage for edge cases",
        "Document resolver algorithm and decision-making process",
      ],
      prerequisites: [
        "Proficiency in Python programming",
        "Understanding of graph algorithms and backtracking",
        "Familiarity with package managers and dependency resolution",
        "Experience with testing frameworks (pytest)",
      ],
      desiredSkills: [
        "Experience with pip or other package managers",
        "Knowledge of constraint satisfaction problems",
        "Understanding of Python packaging ecosystem",
      ],
      resources: [
        {
          title: "Pip Repository",
          url: "https://github.com/pypa/pip",
          type: "Repository",
        },
        {
          title: "Dependency Resolver Design",
          url: "https://pip.pypa.io/en/stable/topics/dependency-resolution/",
          type: "Documentation",
        },
      ],
      applicationDeadline: "March 15, 2024",
      maxApplicants: 1,
    },
  };

  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockProjects[projectId] || null;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} - ${project.organization.name} - GSoC Guide`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/organizations" className="hover:text-foreground" prefetch={true}>
          Organizations
        </Link>
        <span>/</span>
        <Link
          href={`/organizations/${project.organization.slug}`}
          className="hover:text-foreground"
          prefetch={true}
        >
          {project.organization.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Projects</span>
      </nav>

      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/organizations/${project.organization.slug}`} prefetch={true}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organization
        </Link>
      </Button>

      {/* Project Header */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-xs">
                GSoC {project.year}
              </Badge>
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
            </div>
            <Heading as="h1" variant="hero" className="text-3xl md:text-4xl">
              {project.title}
            </Heading>
            <Text variant="lead" className="text-muted-foreground">
              {project.description}
            </Text>
          </div>

          {/* Quick Actions */}
          {/* <div className="flex flex-col gap-2 min-w-[200px]">
            <Button size="lg" className="w-full">
              Apply for This Project
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Contact Mentors
            </Button>
          </div> */}
        </div>

        {/* Key Info Bar */}
        <div className="flex flex-wrap gap-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Text variant="small">{project.duration}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Text variant="small">{project.mentors.length} Mentors</Text>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-muted-foreground" />
            <Text variant="small">{project.techStack.length} Technologies</Text>
          </div>
          {project.applicationDeadline && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <Text variant="small">
                Deadline: {project.applicationDeadline}
              </Text>
            </div>
          )}
        </div>
      </section>

      <Grid cols={{ default: 1, lg: 3 }} gap="lg">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Overview */}
          <section>
            <Heading variant="section" className="mb-4">
              Project Overview
            </Heading>
            <CardWrapper>
              <Text className="leading-relaxed">{project.longDescription}</Text>
            </CardWrapper>
          </section>

          {/* Expected Outcomes */}
          <section>
            <Heading variant="section" className="mb-4">
              Expected Outcomes
            </Heading>
            <CardWrapper>
              <ul className="space-y-3">
                {project.expectedOutcomes.map((outcome, index) => (
                  <li key={index} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <Text>{outcome}</Text>
                  </li>
                ))}
              </ul>
            </CardWrapper>
          </section>

          {/* Prerequisites */}
          <section>
            <Heading variant="section" className="mb-4">
              Prerequisites (Required)
            </Heading>
            <CardWrapper>
              <ul className="space-y-3">
                {project.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <Text>{prereq}</Text>
                  </li>
                ))}
              </ul>
            </CardWrapper>
          </section>

          {/* Desired Skills */}
          <section>
            <Heading variant="section" className="mb-4">
              Desired Skills (Nice to Have)
            </Heading>
            <CardWrapper>
              <ul className="space-y-3">
                {project.desiredSkills.map((skill, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0 mt-2" />
                    <Text className="text-muted-foreground">{skill}</Text>
                  </li>
                ))}
              </ul>
            </CardWrapper>
          </section>

          {/* Resources */}
          <section>
            <Heading variant="section" className="mb-4">
              Helpful Resources
            </Heading>
            <Grid cols={{ default: 1, md: 2 }} gap="md">
              {project.resources.map((resource, index) => (
                <CardWrapper key={index} hover className="group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                      <Heading variant="small" className="mb-2">
                        {resource.title}
                      </Heading>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-primary hover:text-primary/80"
                        asChild
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          View Resource
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardWrapper>
              ))}
            </Grid>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tech Stack */}
          <CardWrapper>
            <Heading variant="small" className="mb-4">
              Tech Stack
            </Heading>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardWrapper>

          {/* Mentors */}
          <CardWrapper>
            <Heading variant="small" className="mb-4">
              Project Mentors
            </Heading>
            <div className="space-y-4">
              {project.mentors.map((mentor, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-semibold text-primary">
                      {mentor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className="font-medium">{mentor.name}</Text>
                    <Text variant="small" className="text-muted-foreground">
                      {mentor.role}
                    </Text>
                    {mentor.github && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto mt-1"
                        asChild
                      >
                        <a
                          href={`https://github.com/${mentor.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary"
                        >
                          <Github className="w-3 h-3" />
                          @{mentor.github}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardWrapper>

          {/* Application Info */}
          {project.applicationDeadline && (
            <CardWrapper className="bg-primary/5 border-primary/20">
              <Heading variant="small" className="mb-3">
                Application Info
              </Heading>
              <div className="space-y-3">
                <div>
                  <Text variant="small" className="text-muted-foreground mb-1">
                    Deadline
                  </Text>
                  <Text className="font-medium">
                    {project.applicationDeadline}
                  </Text>
                </div>
                {project.maxApplicants && (
                  <div>
                    <Text variant="small" className="text-muted-foreground mb-1">
                      Max Contributors
                    </Text>
                    <Text className="font-medium">{project.maxApplicants}</Text>
                  </div>
                )}
              </div>
            </CardWrapper>
          )}

          {/* CTA */}
          {/* <CardWrapper className="text-center">
            <Heading variant="small" className="mb-3">
              Ready to Apply?
            </Heading>
            <Text variant="small" className="text-muted-foreground mb-4">
              Make sure you meet the prerequisites and have reviewed all resources.
            </Text>
            <Button className="w-full" size="lg">
              Start Application
            </Button>
          </CardWrapper> */}
        </div>
      </Grid>
    </div>
  );
}

