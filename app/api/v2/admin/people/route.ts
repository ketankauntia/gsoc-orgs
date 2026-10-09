import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { searchPeople } from "@/lib/hub/admin";

/** ?q=<name, project title or project id>&role=any */
export async function GET(request: Request) {
  const gate = await apiAdmin();
  if (gate.response) return gate.response;
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) return apiError("VALIDATION_ERROR", "Type at least two characters", 422);
  try {
    return privateApiData({ people: await searchPeople(query, params.get("role") !== "any") });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/people");
  }
}
