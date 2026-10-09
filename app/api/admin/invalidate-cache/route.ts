import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { CacheTags } from "@/lib/cache";
import { isAdminKeyAuthorized } from "@/lib/admin-key";
import { readJsonBody } from "@/lib/security";

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
  // Without ADMIN_KEY set the route does not exist.
  if (!process.env.ADMIN_KEY) {
    return NextResponse.json({ success: false, error: { message: "Not found", code: "NOT_FOUND" } }, { status: 404 });
  }
  if (!isAdminKeyAuthorized(request)) {
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
    const body = (await readJsonBody(request, 16 * 1024)) as InvalidateRequest;
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
        const yearPath = `/yearly/google-summer-of-code-${year}`;
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
        },
      },
      { status: 500 }
    );
  }
}
