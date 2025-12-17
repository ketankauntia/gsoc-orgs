"use client";

import { useState, useEffect } from "react";
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

/**
 * Tech Stack Index Page
 * Route: /tech-stack
 * Fetches tech stacks from API
 */

interface TechStack {
  name: string;
  slug: string;
  usage_count: number;
}

export default function TechStackPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTechStacks() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        
        const response = await fetch(`/api/tech-stack?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setTechStacks(data.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load technologies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(() => {
      fetchTechStacks();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const trendingStacks = techStacks.slice(0, 6); // Top 6 as trending

  // Generate structured data for SEO
  const jsonLd = techStacks.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Google Summer of Code Programming Languages & Technologies",
    "description": "Browse GSoC organizations filtered by programming language and technology stack",
    "url": "https://gsoc-orgs.vercel.app/tech-stack",
    "numberOfItems": techStacks.length,
    "itemListElement": techStacks.slice(0, 20).map((stack, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Thing",
        "name": stack.name,
        "url": `https://gsoc-orgs.vercel.app/tech-stack/${stack.slug}`,
        "description": `${stack.usage_count} GSoC organizations using ${stack.name}`
      }
    }))
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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

        {/* Error State */}
        {error && (
          <CardWrapper className="text-center py-8 bg-destructive/10">
            <Text className="text-destructive">{error}</Text>
          </CardWrapper>
        )}

        {/* Loading State */}
        {loading && (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardWrapper key={i} className="h-48 animate-pulse">
                <div className="h-full bg-muted/50 rounded-md" />
              </CardWrapper>
            ))}
          </Grid>
        )}

        {/* Trending Technologies */}
        {!loading && !searchQuery && trendingStacks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <Heading variant="subsection">Top Technologies</Heading>
            </div>
            <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
              {trendingStacks.map((stack, index) => (
                <TechStackCard key={`trending-${stack.name}-${index}`} stack={stack} />
              ))}
            </Grid>
          </section>
        )}

        {/* All Tech Stacks */}
        {!loading && !error && (
          <section>
            <Heading variant="section" className="mb-6">
              {searchQuery ? "Search Results" : "All Technologies"}
            </Heading>
            
            {techStacks.length === 0 ? (
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
                  Showing {techStacks.length} technolog{techStacks.length !== 1 ? "ies" : "y"}
                </Text>
                <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
                  {techStacks.map((stack, index) => (
                    <TechStackCard key={`${stack.name}-${index}`} stack={stack} />
                  ))}
                </Grid>
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}

/**
 * Tech Stack Card Component
 */
function TechStackCard({ stack }: { stack: TechStack }) {
  // Generate a color based on the tech name for consistency
  const getColor = (name: string) => {
    const colors = [
      "#3776AB", "#F7DF1E", "#007396", "#00599C", "#CE422B", 
      "#00ADD8", "#3178C6", "#A8B9CC", "#CC342D", "#777BB4"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Link href={`/tech-stack/${stack.slug}`}>
      <CardWrapper hover className="h-full flex flex-col group">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xl"
            style={{ backgroundColor: getColor(stack.name) }}
          >
            {stack.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <Heading variant="small" className="group-hover:text-primary transition-colors">
              {stack.name}
            </Heading>
            <Text variant="small" className="text-muted-foreground">
              {stack.usage_count} organization{stack.usage_count !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t">
          <Text variant="small" className="text-primary group-hover:underline">
            View organizations →
          </Text>
        </div>
      </CardWrapper>
    </Link>
  );
}
