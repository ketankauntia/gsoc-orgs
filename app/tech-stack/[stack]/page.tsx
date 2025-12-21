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
    <Suspense fallback={<div className="text-center py-20">Loading tech stack...</div>}>
      <TechStackClient initialData={data} />
    </Suspense>
  );
}
