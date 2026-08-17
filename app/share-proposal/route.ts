import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Entry point for "this selection is mine" from public search.
 *
 * Routing the invitation through here keeps the prefill: a signed-out visitor
 * comes back from Google to a wizard that already knows which archived project
 * they picked.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectParam = url.searchParams.get("project")?.trim();
  const yearParam = url.searchParams.get("year")?.trim();
  const project = projectParam && projectParam.length <= 200 ? projectParam : null;
  const year = yearParam && /^\d{4}$/.test(yearParam) ? yearParam : null;

  const target = new URLSearchParams();
  if (project) target.set("project", project);
  if (year) target.set("year", year);
  const destination = `/account/proposals/new${target.size ? `?${target}` : ""}`;

  if (isSupabaseConfigured() && !(await getUser())) {
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }
  redirect(destination);
}
