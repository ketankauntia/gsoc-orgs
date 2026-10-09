import { readJsonBody } from "@/lib/security";

// Control, line-separator and bidi characters could forge or hide log lines.
const LOG_UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;

/** A visitor-supplied value made safe for one log line, or null. */
function logValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(LOG_UNSAFE_CHARACTERS, " ").trim().slice(0, maxLength);
  return text || null;
}

/**
 * 404 monitor sink. A not-found page can beacon the bad path here.
 * For now it just logs server-side, one JSON object per line.
 */
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req, 4 * 1024);
    const { path, referrer } = (body && typeof body === "object" ? body : {}) as { path?: unknown; referrer?: unknown };
    console.warn(JSON.stringify({
      event: "not_found",
      path: logValue(path, 300),
      referrer: logValue(referrer, 300),
      userAgent: logValue(req.headers.get("user-agent"), 200),
    }));
  } catch {
    // ignore malformed beacons
  }
  return new Response(null, { status: 204 });
}
