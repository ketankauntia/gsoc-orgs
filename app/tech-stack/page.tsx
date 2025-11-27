"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, TrendingUp, Code } from "lucide-react";
import {
  SectionHeader,
  Grid,
  CardWrapper,
  Heading,
  Text,
  Badge,
  Input,
} from "@/components/ui";

/**
 * Tech Stack Index Page
 * Route: /tech-stack
 * 
 * Shows all available programming languages and technologies with:
 * - Search functionality
 * - Tech stack cards with org/project counts
 * - Trending technologies
 * - Language indicators
 * 
 * Each tech stack links to /tech-stack/[stack] for SEO-optimized detail pages
 */

interface TechStack {
  slug: string;
  name: string;
  description: string;
  color: string; // hex color for the language
  orgCount: number;
  projectCount: number;
  trending?: boolean;
  popular?: boolean;
}

// All available tech stacks
const ALL_TECH_STACKS: TechStack[] = [
  {
    slug: "python",
    name: "Python",
    description: "High-level, general-purpose programming language known for simplicity and readability.",
    color: "#3776AB",
    orgCount: 68,
    projectCount: 185,
    trending: true,
    popular: true,
  },
  {
    slug: "javascript",
    name: "JavaScript",
    description: "Dynamic programming language for web development, both client and server-side.",
    color: "#F7DF1E",
    orgCount: 52,
    projectCount: 142,
    trending: true,
    popular: true,
  },
  {
    slug: "java",
    name: "Java",
    description: "Object-oriented language widely used for enterprise applications and Android development.",
    color: "#007396",
    orgCount: 45,
    projectCount: 120,
    popular: true,
  },
  {
    slug: "cpp",
    name: "C++",
    description: "High-performance language for systems programming, game engines, and performance-critical applications.",
    color: "#00599C",
    orgCount: 38,
    projectCount: 98,
    popular: true,
  },
  {
    slug: "rust",
    name: "Rust",
    description: "Systems programming language focused on safety, concurrency, and performance.",
    color: "#CE422B",
    orgCount: 28,
    projectCount: 65,
    trending: true,
  },
  {
    slug: "go",
    name: "Go",
    description: "Statically typed language designed for simplicity and efficiency in concurrent systems.",
    color: "#00ADD8",
    orgCount: 32,
    projectCount: 78,
    trending: true,
  },
  {
    slug: "typescript",
    name: "TypeScript",
    description: "Typed superset of JavaScript that compiles to plain JavaScript for large-scale applications.",
    color: "#3178C6",
    orgCount: 35,
    projectCount: 88,
    trending: true,
  },
  {
    slug: "c",
    name: "C",
    description: "Low-level language for operating systems, embedded systems, and performance-critical software.",
    color: "#A8B9CC",
    orgCount: 30,
    projectCount: 72,
  },
  {
    slug: "ruby",
    name: "Ruby",
    description: "Dynamic language known for elegant syntax and the Ruby on Rails web framework.",
    color: "#CC342D",
    orgCount: 22,
    projectCount: 55,
  },
  {
    slug: "php",
    name: "PHP",
    description: "Server-side scripting language widely used for web development and content management systems.",
    color: "#777BB4",
    orgCount: 18,
    projectCount: 42,
  },
  {
    slug: "kotlin",
    name: "Kotlin",
    description: "Modern language for Android development and server-side applications, interoperable with Java.",
    color: "#7F52FF",
    orgCount: 15,
    projectCount: 38,
  },
  {
    slug: "swift",
    name: "Swift",
    description: "Powerful language for iOS, macOS, watchOS, and tvOS app development.",
    color: "#FA7343",
    orgCount: 12,
    projectCount: 30,
  },
  {
    slug: "scala",
    name: "Scala",
    description: "Functional and object-oriented language that runs on the JVM, used for big data processing.",
    color: "#DC322F",
    orgCount: 14,
    projectCount: 35,
  },
  {
    slug: "r",
    name: "R",
    description: "Statistical computing language for data analysis, visualization, and machine learning.",
    color: "#276DC3",
    orgCount: 16,
    projectCount: 40,
  },
  {
    slug: "perl",
    name: "Perl",
    description: "High-level language excellent for text processing, system administration, and web development.",
    color: "#39457E",
    orgCount: 10,
    projectCount: 25,
  },
  {
    slug: "dart",
    name: "Dart",
    description: "Client-optimized language for fast apps on any platform, powers Flutter framework.",
    color: "#0175C2",
    orgCount: 8,
    projectCount: 22,
  },
];

export default function TechStackPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tech stacks based on search
  const filteredStacks = ALL_TECH_STACKS.filter(
    (stack) =>
      stack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stack.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate trending and popular tech stacks
  const trendingStacks = ALL_TECH_STACKS.filter((t) => t.trending);

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <SectionHeader
        badge="Browse by Technology"
        title="Programming Languages & Technologies"
        description="Explore Google Summer of Code organizations and projects filtered by programming language. Find opportunities that match your technical expertise."
        align="center"
        className="max-w-3xl mx-auto"
      />

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search technologies by name..."
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Trending Technologies */}
      {!searchQuery && trendingStacks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <Heading variant="subsection">Trending Technologies</Heading>
          </div>
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {trendingStacks.map((stack) => (
              <TechStackCard key={stack.slug} stack={stack} />
            ))}
          </Grid>
        </section>
      )}

      {/* All Tech Stacks */}
      <section>
        <Heading variant="section" className="mb-6">
          {searchQuery ? "Search Results" : "All Technologies"}
        </Heading>
        
        {filteredStacks.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Heading variant="small" className="mb-2">
              No technologies found
            </Heading>
            <Text className="text-muted-foreground">
              Try a different search term
            </Text>
          </CardWrapper>
        ) : (
          <>
            <Text variant="small" className="text-muted-foreground mb-6">
              Showing {filteredStacks.length} technolog{filteredStacks.length !== 1 ? "ies" : "y"}
            </Text>
            <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
              {filteredStacks.map((stack) => (
                <TechStackCard key={stack.slug} stack={stack} />
              ))}
            </Grid>
          </>
        )}
      </section>

      {/* Stats Section */}
      {!searchQuery && (
        <section className="text-center py-12">
          <Heading variant="section" className="mb-4">
            Explore by Language
          </Heading>
          <Text className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Each technology has dedicated organizations, project ideas, and resources to help you contribute using your preferred programming language.
          </Text>
          <div className="flex flex-wrap justify-center gap-8 p-8 rounded-xl bg-muted/50 border">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">16</div>
              <Text variant="small" className="text-muted-foreground">
                Languages
              </Text>
            </div>
            <div className="hidden sm:block w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">200+</div>
              <Text variant="small" className="text-muted-foreground">
                Organizations
              </Text>
            </div>
            <div className="hidden sm:block w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">800+</div>
              <Text variant="small" className="text-muted-foreground">
                Projects
              </Text>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Reusable Tech Stack Card Component
 */
function TechStackCard({ stack }: { stack: TechStack }) {
  return (
    <Link href={`/tech-stack/${stack.slug}`}>
      <CardWrapper hover className="h-full flex flex-col group">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xl"
            style={{ backgroundColor: stack.color }}
          >
            {stack.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Heading variant="small" className="group-hover:text-primary transition-colors">
                {stack.name}
              </Heading>
              {stack.trending && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  🔥 Trending
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Text variant="muted" className="text-sm line-clamp-2 mb-4 flex-1">
          {stack.description}
        </Text>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
          <span>{stack.orgCount} orgs</span>
          <span>•</span>
          <span>{stack.projectCount} projects</span>
        </div>
      </CardWrapper>
    </Link>
  );
}

