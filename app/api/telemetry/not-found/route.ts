export const dynamic = "force-static";

/**
 * 404 monitor sink. The not-found page beacons the bad path here.
 * For now it just logs server-side; at deploy, forward to analytics/a store.
 */
export async function POST(req: Request) {
  try {
    const { path, referrer } = (await req.json()) as { path?: string; referrer?: string };
    // eslint-disable-next-line no-console
    console.warn(`[404] ${path ?? "?"}${referrer ? ` (from ${referrer})` : ""}`);
  } catch {
    // ignore malformed beacons
  }
  return new Response(null, { status: 204 });
}
