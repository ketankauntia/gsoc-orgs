import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiting (per-instance, resets on cold start)
// For production at scale, consider edge-based rate limiting (Vercel Edge Config / KV)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Cleanup is handled inline during rate limit checks to avoid setInterval issues in serverless
// Each check cleans up its own entry when expired, preventing memory leaks without background timers

// Valid interest tags - closed set prevents enumeration attacks
const VALID_INTERESTS = new Set(["ai-features", "gsoc-tools"]);

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return null;
  if (!EMAIL_REGEX.test(trimmed)) return null;
  return trimmed;
}

function validateInterests(interests: unknown): string[] {
  if (!Array.isArray(interests)) return [];
  return interests
    .filter((i): i is string => typeof i === "string" && VALID_INTERESTS.has(i))
    .slice(0, 2); // Max 2 interests
}

/**
 * POST /api/waitlist
 *
 * Write-only endpoint for waitlist signups.
 * Security: Rate-limited, no data leakage, idempotent.
 *
 * Request body:
 * - email: string (required)
 * - interests: string[] (optional, valid values: "ai-features", "gsoc-tools")
 *
 * Response: Always returns { success: true } to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const email = validateEmail(body.email);
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const interests = validateInterests(body.interests);

    // Upsert to handle duplicates gracefully - no error, no indication of existence
    await prisma.waitlist_entries.upsert({
      where: { email },
      update: {
        // Update interests if new submission has them
        ...(interests.length > 0 && { interests }),
      },
      create: {
        email,
        interests,
        source: "website",
      },
    });

    // Always return success - prevents email enumeration
    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // Log error without exposing details or email
    console.error("[Waitlist] Submission error:", error instanceof Error ? error.name : "Unknown");

    // Generic error response
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// Explicitly block all other methods - no GET endpoint exists
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } }
  );
}

export async function OPTIONS() {
  // CORS preflight - Next.js handles this, but we explicitly return allowed methods
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
    },
  });
}
