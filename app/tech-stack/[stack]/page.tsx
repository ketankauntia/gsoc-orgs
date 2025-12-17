import { notFound } from "next/navigation";
import Link from "next/link";
import { Heading, Text, Button, CardWrapper, Grid, Badge } from "@/components/ui";
import { apiFetchServer } from "@/lib/api.server";

/**
 * Tech Stack Detail Page
 * Route: /tech-stack/[stack]
 */

interface TechStackDetail {
  technology: {
    name: string;
    slug: string;
    usage_count: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_r2_url: string | null;
    category: string;
    total_projects: number;
    is_currently_active: boolean;
  }>;
}

async function getTechStack(slug: string): Promise<TechStackDetail | null> {
  try {
    return await apiFetchServer<TechStackDetail>(`/api/tech-stack/${slug}`);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export default async function TechStackDetailPage({ 
  params 
}: { 
  params: Promise<{ stack: string }> 
}) {
  const { stack: stackSlug } = await params;
  const data = await getTechStack(stackSlug);

  if (!data) {
    notFound();
  }

  const { technology, organizations } = data;

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="text-center space-y-4">
        <Heading as="h1" variant="hero" className="text-4xl md:text-5xl">
          {technology.name}
        </Heading>
        <Text variant="lead" className="text-muted-foreground max-w-2xl mx-auto">
          {technology.usage_count} organization{technology.usage_count !== 1 ? 's' : ''} using {technology.name}
        </Text>
      </section>

      {/* Stats */}
      <section>
        <Grid cols={{ default: 2, md: 3 }} gap="md">
          <CardWrapper className="p-6 text-center">
            <Text variant="small" className="text-muted-foreground mb-2">
              Organizations
            </Text>
            <Heading variant="small">{technology.usage_count}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center">
            <Text variant="small" className="text-muted-foreground mb-2">
              Active Orgs
            </Text>
            <Heading variant="small">
              {organizations.filter(o => o.is_currently_active).length}
            </Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center col-span-2 md:col-span-1">
            <Text variant="small" className="text-muted-foreground mb-2">
              Total Projects
            </Text>
            <Heading variant="small">
              {organizations.reduce((sum, org) => sum + org.total_projects, 0)}
            </Heading>
          </CardWrapper>
        </Grid>
      </section>

      {/* Organizations */}
      <section>
        <Heading variant="section" className="mb-6">
          Organizations Using {technology.name}
        </Heading>
        
        {organizations.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Text className="text-muted-foreground">
              No organizations found for this technology
            </Text>
          </CardWrapper>
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {organizations.map((org) => (
              <Link key={org.id} href={`/organizations/${org.slug}`}>
                <CardWrapper hover className="h-full flex flex-col">
                  {/* Logo & Name */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {org.logo_r2_url ? (
                        <img
                          src={org.logo_r2_url}
                          alt={`${org.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">
                          {org.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Heading variant="small" className="line-clamp-1">
                        {org.name}
                      </Heading>
                      <Text variant="small" className="text-muted-foreground">
                        {org.total_projects} projects
                      </Text>
                    </div>
                  </div>

                  {/* Description */}
                  <Text variant="muted" className="text-sm line-clamp-2 mb-3 flex-1">
                    {org.description}
                  </Text>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {org.category}
                    </Badge>
                    <Badge variant={org.is_currently_active ? "default" : "outline"} className="text-xs">
                      {org.is_currently_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardWrapper>
              </Link>
            ))}
          </Grid>
        )}
      </section>

      {/* CTA */}
      <section className="text-center">
        <Button size="lg" asChild>
          <Link href="/tech-stack">View All Technologies</Link>
        </Button>
      </section>
    </div>
  );
}
