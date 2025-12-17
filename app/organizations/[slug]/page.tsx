import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Github, Globe } from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Grid,
} from "@/components/ui";
import { Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";

/**
 * Organization Detail Page
 * Route: /organizations/[slug]
 */

async function getOrganization(slug: string): Promise<Organization | null> {
  try {
    return await apiFetchServer<Organization>(`/api/organizations/${slug}`);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
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

  const websiteUrl = org.social?.blog || org.contact?.guide_url;
  const githubUrl = org.social?.github;

  return (
    <div className="space-y-12">
      {/* Organization Header */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-muted flex items-center justify-center shrink-0 border overflow-hidden">
            {org.img_r2_url ? (
              <img
                src={org.img_r2_url}
                alt={`${org.name} logo`}
                className="w-full h-full object-cover"
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
              {websiteUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              )}
              {githubUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={githubUrl}
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
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardWrapper className="p-4">
            <Text variant="small" className="text-muted-foreground mb-1">
              Total Projects
            </Text>
            <Heading variant="small">{org.total_projects}</Heading>
          </CardWrapper>
          <CardWrapper className="p-4">
            <Text variant="small" className="text-muted-foreground mb-1">
              Years Active
            </Text>
            <Heading variant="small">{org.active_years.length}</Heading>
          </CardWrapper>
          <CardWrapper className="p-4">
            <Text variant="small" className="text-muted-foreground mb-1">
              First Year
            </Text>
            <Heading variant="small">{org.first_year}</Heading>
          </CardWrapper>
          <CardWrapper className="p-4">
            <Text variant="small" className="text-muted-foreground mb-1">
              Last Year
            </Text>
            <Heading variant="small">{org.last_year}</Heading>
          </CardWrapper>
        </div>
      </section>

      {/* Topics & Tech Stack */}
      <section className="space-y-6">
        {/* Topics */}
        {org.topics && org.topics.length > 0 && (
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
        )}

        {/* Tech Stack */}
        {org.technologies && org.technologies.length > 0 && (
          <div>
            <Heading variant="small" className="mb-3">
              Technologies
            </Heading>
            <div className="flex flex-wrap gap-2">
              {org.technologies.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Years Active */}
      <section>
        <Heading variant="small" className="mb-4">
          GSoC Participation History
        </Heading>
        <div className="flex flex-wrap gap-2">
          {org.active_years.map((year) => (
            <Button key={year} variant="outline" size="sm" asChild>
              <Link href={`/gsoc-${year}-organizations`}>
                GSoC {year}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* Category Badge */}
      <section>
        <div className="inline-flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground">Category:</Text>
          <Badge variant="default">{org.category}</Badge>
        </div>
        <div className="mt-2">
          <Badge variant={org.is_currently_active ? "default" : "secondary"}>
            {org.is_currently_active ? "Currently Active" : "Inactive"}
          </Badge>
        </div>
      </section>
    </div>
  );
}
