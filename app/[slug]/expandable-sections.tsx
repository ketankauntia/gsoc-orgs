"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Code } from "lucide-react";
import { Button, Badge, Grid, Text } from "@/components/ui";

interface Organization {
  slug: string;
  name: string;
  logo: string;
  description: string;
  topics: string[];
  techStack: string[];
  projectCount: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  isNew?: boolean;
}

// Client Component for Expandable New Orgs
export function ExpandableNewOrgs({ 
  organizations
}: { 
  organizations: Organization[]; 
  year: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const newOrgs = organizations.filter((org) => org.isNew);
  const displayedOrgs = showAll ? newOrgs : newOrgs.slice(0, 5);
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {displayedOrgs.map((org) => (
          <Link key={org.slug} href={`/organizations/${org.slug}`}>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {org.name}
            </Badge>
          </Link>
        ))}
      </div>
      {newOrgs.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All {newOrgs.length} Organizations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Client Component for Expandable Beginner-Friendly Orgs
export function ExpandableBeginnerOrgs({ 
  organizations 
}: { 
  organizations: Organization[];
}) {
  const [showAll, setShowAll] = useState(false);
  const beginnerOrgs = organizations.filter((org) => org.difficulty === "Beginner");
  const displayedOrgs = showAll ? beginnerOrgs : beginnerOrgs.slice(0, 6);
  
  return (
    <div className="space-y-4">
      <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
        {displayedOrgs.map((org) => (
          <Link
            key={org.slug}
            href={`/organizations/${org.slug}`}
            className="group"
          >
            <div className="p-3 rounded-lg border bg-card hover:border-foreground/50 transition-all">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border flex items-center justify-center shrink-0 overflow-hidden">
                  {org.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {org.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-medium text-sm line-clamp-1">
                    {org.name}
                  </Text>
                  <Text variant="small" className="text-muted-foreground">
                    {org.projectCount} projects
                  </Text>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </Grid>
      {beginnerOrgs.length > 6 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All {beginnerOrgs.length} Organizations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Client Component for Expandable Tech Stack Browse
export function ExpandableTechStacks({ 
  techStacks, 
  organizations 
}: { 
  techStacks: string[]; 
  organizations: Organization[];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedStacks = showAll ? techStacks : techStacks.slice(0, 12);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {displayedStacks.map((tech) => {
          const count = organizations.filter((org) =>
            org.techStack.includes(tech)
          ).length;
          return (
            <Link key={tech} href={`/tech-stack/${tech.toLowerCase()}`}>
              <Button variant="outline" size="sm" className="group">
                <Code className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                {tech}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {count}
                </Badge>
              </Button>
            </Link>
          );
        })}
      </div>
      {techStacks.length > 12 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              View All {techStacks.length} Tech Stacks
            </>
          )}
        </Button>
      )}
    </div>
  );
}

