import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/**
 * Entry point for "this project is mine" links on public pages. It keeps the
 * archived project through sign-in so the claim picker opens prefilled.
 */
export async function GET(request: Request) {
  const projectParam = new URL(request.url).searchParams.get("project")?.trim();
  const project = projectParam && projectParam.length <= 200 ? projectParam : null;
  const destination = `/account/claim${project ? `?project=${encodeURIComponent(project)}` : ""}`;
  if (!(await getSessionUser())) redirect(`/login?next=${encodeURIComponent(destination)}`);
  redirect(destination);
}
