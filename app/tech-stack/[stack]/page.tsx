import Link from "next/link";
import { Heading, Text, Button } from "@/components/ui";
import { TechStackPageClient } from "./stack-client";

// Mock tech stacks data
const MOCK_TECH_STACKS: Record<string, any> = {
  python: {
    slug: "python",
    name: "Python",
    description: "Python is a high-level, general-purpose programming language known for its simplicity and readability. It's widely used in web development, data science, machine learning, automation, and scientific computing.",
    color: "#3776AB",
    totalOrgs: 68,
    totalProjects: 185,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Web Development", "Machine Learning", "Data Science", "Automation"],
  },
  javascript: {
    slug: "javascript",
    name: "JavaScript",
    description: "JavaScript is a dynamic programming language for web development, used both on the client-side (browsers) and server-side (Node.js). It powers interactive websites, web applications, and modern frontend frameworks.",
    color: "#F7DF1E",
    totalOrgs: 52,
    totalProjects: 142,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Web Development", "Frontend", "Backend", "Full Stack"],
  },
  java: {
    slug: "java",
    name: "Java",
    description: "Java is a robust, object-oriented programming language widely used for enterprise applications, Android development, and large-scale systems. It runs on the Java Virtual Machine (JVM).",
    color: "#007396",
    totalOrgs: 45,
    totalProjects: 120,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Android", "Enterprise", "Backend", "Cloud"],
  },
  cpp: {
    slug: "cpp",
    name: "C++",
    description: "C++ is a high-performance language for systems programming, game engines, and performance-critical applications. It provides low-level memory manipulation with object-oriented features.",
    color: "#00599C",
    totalOrgs: 38,
    totalProjects: 98,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Systems Programming", "Game Development", "Graphics", "Performance"],
  },
  rust: {
    slug: "rust",
    name: "Rust",
    description: "Rust is a systems programming language focused on safety, concurrency, and performance. It prevents memory errors and provides zero-cost abstractions for building reliable and efficient software.",
    color: "#CE422B",
    totalOrgs: 28,
    totalProjects: 65,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Systems Programming", "WebAssembly", "Blockchain", "Security"],
  },
  go: {
    slug: "go",
    name: "Go",
    description: "Go (Golang) is a statically typed language designed for simplicity and efficiency in concurrent systems. It's popular for cloud infrastructure, microservices, and DevOps tools.",
    color: "#00ADD8",
    totalOrgs: 32,
    totalProjects: 78,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Cloud Infrastructure", "Backend", "DevOps", "Microservices"],
  },
  typescript: {
    slug: "typescript",
    name: "TypeScript",
    description: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static typing and modern features for building large-scale applications with better tooling and error detection.",
    color: "#3178C6",
    totalOrgs: 35,
    totalProjects: 88,
    activeYears: [2020, 2021, 2022, 2023, 2024],
    relatedTopics: ["Web Development", "Frontend", "Full Stack", "Node.js"],
  },
};

// Mock organizations using this tech stack
const MOCK_ORGANIZATIONS = [
  {
    slug: "python-software-foundation",
    name: "Python Software Foundation",
    logo: null,
    description: "The Python Software Foundation manages the development of the Python programming language and supports the Python community.",
    techStack: ["Python", "C"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 12,
    difficulty: "Beginner Friendly",
  },
  {
    slug: "mozilla",
    name: "Mozilla",
    description: "Mozilla is the non-profit behind Firefox and other open-source projects promoting a healthy internet.",
    logo: null,
    techStack: ["JavaScript", "Rust", "C++"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 15,
    difficulty: "Intermediate",
  },
  {
    slug: "apache-software-foundation",
    name: "Apache Software Foundation",
    description: "The Apache Software Foundation provides organizational, legal, and financial support for Apache open-source software projects.",
    logo: null,
    techStack: ["Java", "Python", "C++"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 20,
    difficulty: "All Levels",
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    description: "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
    logo: null,
    techStack: ["Go", "Python"],
    yearsActive: [2021, 2022, 2023, 2024],
    projectCount: 10,
    difficulty: "Intermediate",
  },
  {
    slug: "react",
    name: "React",
    description: "React is a JavaScript library for building user interfaces, maintained by Meta and a community of developers.",
    logo: null,
    techStack: ["JavaScript", "TypeScript"],
    yearsActive: [2022, 2023, 2024],
    projectCount: 8,
    difficulty: "Beginner Friendly",
  },
  {
    slug: "nodejs",
    name: "Node.js Foundation",
    description: "Node.js is a JavaScript runtime built on Chrome's V8 engine for building scalable network applications.",
    logo: null,
    techStack: ["JavaScript", "C++"],
    yearsActive: [2020, 2021, 2022, 2023, 2024],
    projectCount: 14,
    difficulty: "Intermediate",
  },
];

export default async function TechStackDetailPage({ params }: { params: Promise<{ stack: string }> }) {
  const { stack: stackSlug } = await params;
  const stack = MOCK_TECH_STACKS[stackSlug];

  if (!stack) {
    return (
      <div className="text-center py-20">
        <Heading variant="section">Technology Not Found</Heading>
        <Text className="mt-4 text-muted-foreground">
          The technology you&apos;re looking for doesn&apos;t exist.
        </Text>
        <Button asChild className="mt-6">
          <Link href="/tech-stack">View All Technologies</Link>
        </Button>
      </div>
    );
  }

  // Pass data to client component
  return <TechStackPageClient stack={stack} organizations={MOCK_ORGANIZATIONS} />;
}
