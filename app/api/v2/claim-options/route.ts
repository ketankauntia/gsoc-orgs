import { apiData, apiError } from "@/lib/api-response";
import { isDatabaseConfigured } from "@/lib/db";
import { getClaimOrganizations, getClaimProjects, getClaimYears } from "@/lib/hub/queries";

// Options for the claim picker: years, then a year's organizations, then an
// organization's projects with the people the archive lists on each.
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return apiError("UNAVAILABLE", "Claims are not available right now", 503);
  const params = new URL(request.url).searchParams;
  const year = Number(params.get("year"));
  const organization = params.get("organization")?.trim();
  const cache = { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } };
  try {
    if (!params.has("year")) return apiData({ years: await getClaimYears() }, undefined, cache);
    if (!Number.isInteger(year) || year < 2005 || year > 2100) return apiError("VALIDATION_ERROR", "Choose a year", 422);
    if (!organization) return apiData({ organizations: await getClaimOrganizations(year) }, undefined, cache);
    if (organization.length > 120) return apiError("VALIDATION_ERROR", "Choose an organization", 422);
    return apiData({ projects: await getClaimProjects(year, organization) }, undefined, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[api/v2/claim-options]", error);
    return apiError("SERVER_ERROR", "Could not load the archive. Try again.", 500);
  }
}
