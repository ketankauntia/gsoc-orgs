import { privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { getAdminProposals, getAdminQueue } from "@/lib/hub/admin";

export async function GET() {
  const gate = await apiAdmin();
  if (gate.response) return gate.response;
  try {
    const [queue, proposals] = await Promise.all([getAdminQueue(), getAdminProposals()]);
    return privateApiData({ ...queue, proposals });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/queue");
  }
}
