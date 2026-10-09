import { privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { getMyParticipations } from "@/lib/hub/queries";

export async function GET() {
  const gate = await apiViewer();
  if (gate.response) return gate.response;
  try {
    const participations = await getMyParticipations(gate.viewer.user.id);
    return privateApiData({ profile: gate.viewer.profile, email: gate.viewer.user.email, isAdmin: gate.viewer.isAdmin, participations });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me");
  }
}
