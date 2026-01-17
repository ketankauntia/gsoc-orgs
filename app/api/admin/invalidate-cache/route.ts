import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { CacheTags } from "@/lib/cache";

/**
 * Admin endpoint for cache invalidation.
 *
 * This endpoint allows manual cache invalidation when:
 * - New GSoC year data is added
 * - Organization data is corrected
 * - Bulk updates are performed
 *
 * Authentication: Requires x-admin-key header matching ADMIN_KEY env var
 *
 * POST /api/admin/invalidate-cache
 *
 * Body options:
 * - { "type": "all" } - Invalidate entire cache
 * - { "type": "year", "year": 2025 } - Invalidate specific year
 * - { "type": "organization", "slug": "apache" } - Invalidate specific org
 * - { "type": "tags", "tags": ["stats", "organizations"] } - Invalidate specific tags
 * - { "type": "path", "path": "/organizations" } - Invalidate specific path
 */

/**
 * Default cache profile for revalidation.
 * In Next.js 16, revalidateTag requires a second parameter specifying the cache profile.
 * Using "default" for immediate full invalidation.
 */
const CACHE_PROFILE = "default";

// Secure comparison to prevent timing attacks
function isAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    console.warn("ADMIN_KEY environment variable not set. Admin endpoint is unprotected!");
    return false;
  }

  if (!adminKey) {
    return false;
  }

  if (adminKey.length !== expectedKey.length) {
    return false;
  }

  // Constant-time string comparison
  let result = 0;
  for (let i = 0; i < expectedKey.length; i++) {
    result |= adminKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  return result === 0;
}

// Invalidation request body types
interface InvalidateAllRequest {
  type: "all";
}

interface InvalidateYearRequest {
  type: "year";
  year: number;
}

interface InvalidateOrganizationRequest {
  type: "organization";
  slug: string;
}

interface InvalidateTagsRequest {
  type: "tags";
  tags: string[];
}

interface InvalidatePathRequest {
  type: "path";
  path: string;
}

type InvalidateRequest =
  | InvalidateAllRequest
  | InvalidateYearRequest
  | InvalidateOrganizationRequest
  | InvalidateTagsRequest
  | InvalidatePathRequest;

export async function POST(request: NextRequest) {
  // Check authentication
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Unauthorized. Admin key required.",
          code: "UNAUTHORIZED",
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as InvalidateRequest;
    const invalidatedTags: string[] = [];
    const invalidatedPaths: string[] = [];

    switch (body.type) {
      case "all": {
        // Invalidate the global "all" tag - this will bust the entire cache
        revalidateTag(CacheTags.ALL, CACHE_PROFILE);
        invalidatedTags.push(CacheTags.ALL);

        // Also invalidate key paths
        const keyPaths = [
          "/",
          "/organizations",
          "/tech-stack",
          "/topics",
        ];
        keyPaths.forEach((p) => {
          revalidatePath(p, "page");
          invalidatedPaths.push(p);
        });

        console.log("[Cache] Invalidated entire cache");
        break;
      }

      case "year": {
        const { year } = body;
        if (!year || year < 2005 || year > 2100) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "Invalid year parameter. Must be between 2005 and 2100.",
                code: "INVALID_YEAR",
              },
            },
            { status: 400 }
          );
        }

        // Invalidate year-specific tag
        const yearTag = CacheTags.year(year);
        revalidateTag(yearTag, CACHE_PROFILE);
        invalidatedTags.push(yearTag);

        // Also invalidate related tags
        revalidateTag(CacheTags.STATS, CACHE_PROFILE);
        invalidatedTags.push(CacheTags.STATS);

        revalidateTag(CacheTags.YEARS, CACHE_PROFILE);
        invalidatedTags.push(CacheTags.YEARS);

        // Invalidate year page path
        const yearPath = `/gsoc-${year}-organizations`;
        revalidatePath(yearPath, "page");
        invalidatedPaths.push(yearPath);

        console.log(`[Cache] Invalidated cache for year ${year}`);
        break;
      }

      case "organization": {
        const { slug } = body;
        if (!slug || typeof slug !== "string") {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "Invalid slug parameter.",
                code: "INVALID_SLUG",
              },
            },
            { status: 400 }
          );
        }

        // Invalidate organization-specific tag
        const orgTag = CacheTags.organization(slug);
        revalidateTag(orgTag, CACHE_PROFILE);
        invalidatedTags.push(orgTag);

        // Invalidate organization page path
        const orgPath = `/organizations/${slug}`;
        revalidatePath(orgPath, "page");
        invalidatedPaths.push(orgPath);

        console.log(`[Cache] Invalidated cache for organization ${slug}`);
        break;
      }

      case "tags": {
        const { tags } = body;
        if (!Array.isArray(tags) || tags.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "Tags must be a non-empty array.",
                code: "INVALID_TAGS",
              },
            },
            { status: 400 }
          );
        }

        // Invalidate each tag
        tags.forEach((tag) => {
          revalidateTag(tag, CACHE_PROFILE);
          invalidatedTags.push(tag);
        });

        console.log(`[Cache] Invalidated tags: ${tags.join(", ")}`);
        break;
      }

      case "path": {
        const { path } = body;
        if (!path || typeof path !== "string" || !path.startsWith("/")) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "Path must be a string starting with /",
                code: "INVALID_PATH",
              },
            },
            { status: 400 }
          );
        }

        revalidatePath(path, "page");
        invalidatedPaths.push(path);

        console.log(`[Cache] Invalidated path: ${path}`);
        break;
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            error: {
              message:
                'Invalid invalidation type. Must be one of: all, year, organization, tags, path',
              code: "INVALID_TYPE",
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          type: body.type,
          invalidated_tags: invalidatedTags,
          invalidated_paths: invalidatedPaths,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Cache] Invalidation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to invalidate cache",
          code: "INVALIDATION_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/invalidate-cache
 *
 * Returns available invalidation options and cache status.
 * Public endpoint (no auth required) for documentation.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        description: "Cache invalidation endpoint",
        authentication: "Requires x-admin-key header",
        available_types: {
          all: {
            description: "Invalidate entire cache",
            example: { type: "all" },
          },
          year: {
            description: "Invalidate specific year data",
            example: { type: "year", year: 2025 },
          },
          organization: {
            description: "Invalidate specific organization",
            example: { type: "organization", slug: "apache" },
          },
          tags: {
            description: "Invalidate specific cache tags",
            example: { type: "tags", tags: ["stats", "organizations"] },
            available_tags: Object.keys(CacheTags).filter(
              (k) => typeof CacheTags[k as keyof typeof CacheTags] === "string"
            ),
          },
          path: {
            description: "Invalidate specific URL path",
            example: { type: "path", path: "/organizations" },
          },
        },
        common_workflows: {
          new_gsoc_year: {
            description: "When new GSoC year data is added",
            steps: [
              '1. Upload new data to database',
              '2. Call POST /api/admin/invalidate-cache with { "type": "year", "year": 2026 }',
              '3. Call POST /api/admin/invalidate-cache with { "type": "all" } if needed',
            ],
          },
          organization_update: {
            description: "When an organization is updated",
            steps: [
              '1. Update organization in database',
              '2. Call POST /api/admin/invalidate-cache with { "type": "organization", "slug": "org-slug" }',
            ],
          },
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
