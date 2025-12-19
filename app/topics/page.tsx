"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, TrendingUp, Code, Database, Globe, Cpu, Lock, Layers } from "lucide-react";
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
 * Topics Index Page
 * Route: /topics
 * 
 * Shows all available GSoC topics/categories with:
 * - Search functionality
 * - Topic cards with org/project counts
 * - Trending topics
 * - Icon indicators
 * 
 * Each topic links to /topics/[topic] for SEO-optimized detail pages
 */

interface Topic {
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  orgCount: number;
  projectCount: number;
  trending?: boolean;
  popular?: boolean;
}

// All available topics
const ALL_TOPICS: Topic[] = [
  {
    slug: "web-development",
    title: "Web Development",
    description: "Web frameworks, browsers, tooling, and web standards. Build the future of the internet.",
    icon: Globe,
    orgCount: 45,
    projectCount: 120,
    trending: true,
    popular: true,
  },
  {
    slug: "machine-learning",
    title: "Machine Learning",
    description: "ML libraries, models, data science tools, and AI research. Shape the future of AI.",
    icon: Cpu,
    orgCount: 32,
    projectCount: 85,
    trending: true,
    popular: true,
  },
  {
    slug: "systems-programming",
    title: "Systems Programming",
    description: "Operating systems, compilers, and performance-critical software. Build computing foundations.",
    icon: Code,
    orgCount: 28,
    projectCount: 72,
    popular: true,
  },
  {
    slug: "data-science",
    title: "Data Science",
    description: "Data analysis, visualization, and scientific computing tools for researchers and analysts.",
    icon: Database,
    orgCount: 24,
    projectCount: 58,
  },
  {
    slug: "security-privacy",
    title: "Security & Privacy",
    description: "Cryptography, security tools, privacy software, and secure communication platforms.",
    icon: Lock,
    orgCount: 18,
    projectCount: 42,
    trending: true,
  },
  {
    slug: "cloud-infrastructure",
    title: "Cloud & Infrastructure",
    description: "Cloud platforms, containers, orchestration, and infrastructure automation tools.",
    icon: Layers,
    orgCount: 22,
    projectCount: 56,
  },
  {
    slug: "mobile-development",
    title: "Mobile Development",
    description: "iOS, Android, React Native, and cross-platform mobile frameworks and tools.",
    icon: Globe,
    orgCount: 15,
    projectCount: 38,
  },
  {
    slug: "devtools",
    title: "Developer Tools",
    description: "IDEs, debuggers, testing frameworks, and productivity tools for developers.",
    icon: Code,
    orgCount: 19,
    projectCount: 45,
  },
  {
    slug: "graphics-multimedia",
    title: "Graphics & Multimedia",
    description: "Game engines, 3D graphics, audio/video processing, and creative tools.",
    icon: Layers,
    orgCount: 14,
    projectCount: 32,
  },
  {
    slug: "databases",
    title: "Databases",
    description: "SQL and NoSQL databases, query engines, and data storage solutions.",
    icon: Database,
    orgCount: 16,
    projectCount: 40,
  },
  {
    slug: "programming-languages",
    title: "Programming Languages",
    description: "Language design, compilers, interpreters, and language tooling ecosystems.",
    icon: Code,
    orgCount: 12,
    projectCount: 35,
  },
  {
    slug: "documentation",
    title: "Documentation",
    description: "Technical writing, documentation tools, and knowledge management systems.",
    icon: Globe,
    orgCount: 10,
    projectCount: 25,
  },
];

export default function TopicsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter topics based on search
  const filteredTopics = ALL_TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate trending and popular topics
  const trendingTopics = ALL_TOPICS.filter((t) => t.trending);
  // const popularTopics = ALL_TOPICS.filter((t) => t.popular); // Reserved for future use

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <SectionHeader
        badge="Browse by Interest"
        title="GSoC Topics & Categories"
        description="Explore Google Summer of Code organizations and projects organized by topic. Find the perfect match for your skills and interests."
        align="center"
        className="max-w-3xl mx-auto"
      />

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search topics by name or keyword..."
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Trending Topics */}
      {!searchQuery && trendingTopics.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <Heading variant="subsection">Trending This Year</Heading>
          </div>
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {trendingTopics.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </Grid>
        </section>
      )}

      {/* All Topics */}
      <section>
        <Heading variant="section" className="mb-6">
          {searchQuery ? "Search Results" : "All Topics"}
        </Heading>
        
        {filteredTopics.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Heading variant="small" className="mb-2">
              No topics found
            </Heading>
            <Text className="text-muted-foreground">
              Try a different search term
            </Text>
          </CardWrapper>
        ) : (
          <>
            <Text variant="small" className="text-muted-foreground mb-6">
              Showing {filteredTopics.length} topic{filteredTopics.length !== 1 ? "s" : ""}
            </Text>
            <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
              {filteredTopics.map((topic) => (
                <TopicCard key={topic.slug} topic={topic} />
              ))}
            </Grid>
          </>
        )}
      </section>

      {/* Stats Section */}
      {!searchQuery && (
        <section className="text-center py-12">
          <Heading variant="section" className="mb-4">
            Explore by Category
          </Heading>
          <Text className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Each topic has dedicated organizations, project ideas, and resources to help you find the perfect GSoC opportunity.
          </Text>
          <div className="flex flex-wrap justify-center gap-8 p-8 rounded-xl bg-muted/50 border">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">12</div>
              <Text variant="small" className="text-muted-foreground">
                Topics
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
              <div className="text-4xl font-bold mb-1">600+</div>
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
 * Reusable Topic Card Component
 */
function TopicCard({ topic }: { topic: Topic }) {
  const Icon = topic.icon;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <CardWrapper hover className="h-full flex flex-col group">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Heading variant="small" className="group-hover:text-primary transition-colors">
                {topic.title}
              </Heading>
              {topic.trending && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  🔥 Trending
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Text variant="muted" className="text-sm line-clamp-2 mb-4 flex-1">
          {topic.description}
        </Text>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
          <span>{topic.orgCount} orgs</span>
          <span>•</span>
          <span>{topic.projectCount} projects</span>
        </div>
      </CardWrapper>
    </Link>
  );
}

