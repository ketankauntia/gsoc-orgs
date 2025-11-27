import Link from "next/link";
import { Heading, Text, Button } from "@/components/ui";
import { TopicPageClient } from "./topic-client";

/**
 * Topic Page - Shows all organizations with a specific topic/tag
 * Route: /topics/[topic]
 * 
 * Features:
 * - Topic overview with stats
 * - Search and filter organizations
 * - Analytics charts (org growth, difficulty distribution)
 * - Grid of organization cards
 * - Year filter
 * 
 * TODO: Replace mock data with actual database/API fetch
 */

// Type definitions
interface Topic {
  slug: string;
  title: string;
  description: string;
  totalOrgs: number;
  totalProjects: number;
  activeYears: number[];
}

interface Organization {
  slug: string;
  name: string;
  logo: string | null;
  description: string;
  topics: string[];
  techStack: string[];
  yearsActive: number[];
  projectCount: number;
  difficulty: string;
}

// Mock data - TODO: Replace with actual fetch
const MOCK_TOPICS: Record<string, Topic> = {
  "web-development": {
    slug: "web-development",
    title: "Web Development",
    description: "Organizations working on web frameworks, browsers, tooling, and web standards. Build the future of the internet.",
    totalOrgs: 45,
    totalProjects: 120,
    activeYears: [2020, 2021, 2022, 2023, 2024],
  },
  "machine-learning": {
    slug: "machine-learning",
    title: "Machine Learning",
    description: "Organizations focused on ML libraries, models, data science tools, and AI research. Shape the future of artificial intelligence.",
    totalOrgs: 32,
    totalProjects: 85,
    activeYears: [2020, 2021, 2022, 2023, 2024],
  },
  "systems-programming": {
    slug: "systems-programming",
    title: "Systems Programming",
    description: "Low-level systems, operating systems, compilers, and performance-critical software. Build the foundation of computing.",
    totalOrgs: 28,
    totalProjects: 72,
    activeYears: [2019, 2020, 2021, 2022, 2023, 2024],
  },
};

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    slug: "python-software-foundation",
    name: "Python Software Foundation",
    logo: null,
    description: "The mission of the Python Software Foundation is to promote, protect, and advance the Python programming language.",
    topics: ["Web Development", "Systems Programming", "Data Science"],
    techStack: ["Python", "C", "JavaScript"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 12,
    difficulty: "Beginner Friendly",
  },
  {
    slug: "mozilla",
    name: "Mozilla",
    logo: null,
    description: "Mozilla champions a healthy internet and believes in an internet that is truly public resource.",
    topics: ["Web Development", "Privacy", "Open Web"],
    techStack: ["Rust", "JavaScript", "C++"],
    yearsActive: [2019, 2020, 2021, 2022, 2023, 2024],
    projectCount: 15,
    difficulty: "Intermediate",
  },
  {
    slug: "apache-software-foundation",
    name: "Apache Software Foundation",
    logo: null,
    description: "The Apache Software Foundation provides organizational, legal, and financial support for open source projects.",
    topics: ["Web Development", "Big Data", "Cloud Computing"],
    techStack: ["Java", "Python", "Go"],
    yearsActive: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    projectCount: 25,
    difficulty: "All Levels",
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    logo: null,
    description: "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
    topics: ["Web Development", "Cloud Computing", "DevOps"],
    techStack: ["Go", "Python", "Shell"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 18,
    difficulty: "Intermediate",
  },
  {
    slug: "react",
    name: "React",
    logo: null,
    description: "A JavaScript library for building user interfaces. Maintained by Meta and the community.",
    topics: ["Web Development", "Mobile Development"],
    techStack: ["JavaScript", "TypeScript", "React"],
    yearsActive: [2021, 2022, 2023, 2024],
    projectCount: 8,
    difficulty: "Beginner Friendly",
  },
  {
    slug: "nodejs",
    name: "Node.js Foundation",
    logo: null,
    description: "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.",
    topics: ["Web Development", "Systems Programming"],
    techStack: ["JavaScript", "C++", "Python"],
    yearsActive: [2019, 2020, 2021, 2022, 2023, 2024],
    projectCount: 14,
    difficulty: "All Levels",
  },
];

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: topicSlug } = await params;
  const topic = MOCK_TOPICS[topicSlug];

  if (!topic) {
    return (
      <div className="text-center py-20">
        <Heading variant="section">Topic Not Found</Heading>
        <Text className="mt-4 text-muted-foreground">
          The topic you&apos;re looking for doesn&apos;t exist.
        </Text>
        <Button asChild className="mt-6">
          <Link href="/organizations">View All Organizations</Link>
        </Button>
      </div>
    );
  }

  // Pass data to client component
  return <TopicPageClient topic={topic} organizations={MOCK_ORGANIZATIONS} />;
}

