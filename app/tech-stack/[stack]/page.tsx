import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiFetchServer } from "@/lib/api.server";
import { TechStackClient } from "./tech-stack-client";

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
    img_r2_url: string | null;
    category: string;
    total_projects: number;
    is_currently_active: boolean;
    technologies: string[];
    active_years: number[];
  }>;
}

async function getTechStack(slug: string): Promise<TechStackDetail | null> {
  try {
    return await apiFetchServer<TechStackDetail>(`/api/tech-stack/${slug}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
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

  return (
    <Suspense fallback={
      <div className="min-h-[800px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading tech stack...</p>
        </div>
      </div>
    }>
      <TechStackClient initialData={data} />
    </Suspense>
  );
}
