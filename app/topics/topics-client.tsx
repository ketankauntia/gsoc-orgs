'use client'

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import {
  SectionHeader,
  Grid,
  CardWrapper,
  Heading,
  Text,
  Badge,
  Input,
} from "@/components/ui";
import { TopicsIndexData } from "@/lib/topics-page-types";

interface TopicsClientProps {
  topics: TopicsIndexData['topics'];
  trendingTopics: TopicsIndexData['topics'];
  total: number;
}

export function TopicsClient({ topics, trendingTopics, total }: TopicsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter topics based on search (client-side)
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return topics;
    }
    const searchLower = searchQuery.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(searchLower) ||
        topic.slug.toLowerCase().includes(searchLower)
    );
  }, [topics, searchQuery]);

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <SectionHeader
        badge="Browse by Interest"
        titleAs="h1"
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
            <Heading variant="subsection">Popular Topics</Heading>
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
              Showing {filteredTopics.length} of {total} topic{total !== 1 ? "s" : ""}
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
              <div className="text-4xl font-bold mb-1">{total}</div>
              <Text variant="small" className="text-muted-foreground">
                Topics
              </Text>
            </div>
            <div className="hidden sm:block w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">
                {topics.reduce((sum, t) => sum + t.organizationCount, 0)}+
              </div>
              <Text variant="small" className="text-muted-foreground">
                Organizations
              </Text>
            </div>
            <div className="hidden sm:block w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">
                {topics.reduce((sum, t) => sum + t.projectCount, 0)}+
              </div>
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
function TopicCard({ topic }: { topic: TopicsIndexData['topics'][0] }) {
  const isPopular = topic.organizationCount >= 20;

  return (
    <Link href={`/topics/${topic.slug}`} prefetch={true}>
      <CardWrapper hover className="h-full flex flex-col group">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <span className="text-2xl">🏷️</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Heading variant="small" className="group-hover:text-primary transition-colors">
                {topic.name}
              </Heading>
              {isPopular && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Popular
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Text variant="muted" className="text-sm mb-4 flex-1">
          {topic.years.length > 0 && (
            <span className="text-xs">
              Active in {topic.years.length} year{topic.years.length !== 1 ? 's' : ''} ({Math.min(...topic.years)}-{Math.max(...topic.years)})
            </span>
          )}
        </Text>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
          <span>{topic.organizationCount} org{topic.organizationCount !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{topic.projectCount} project{topic.projectCount !== 1 ? 's' : ''}</span>
        </div>
      </CardWrapper>
    </Link>
  );
}
