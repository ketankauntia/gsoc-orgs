import { NextResponse } from 'next/server'

/**
 * GET /api/v1/meta
 * 
 * Returns API metadata and endpoint information
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        api_version: 'v1',
        description: 'GSoC Organizations Public API',
        documentation_url: 'https://github.com/ketankauntia/gsoc-orgs',
        base_url: '/api/v1',
        status: 'stable',
        features: {
          read_only: true,
          authentication_required: false,
          rate_limiting: false,
          cors_enabled: true,
        },
        endpoints: {
          organizations: {
            list: {
              method: 'GET',
              path: '/api/v1/organizations',
              description: 'List all organizations with filters',
              parameters: {
                page: 'number (default: 1)',
                limit: 'number (default: 20, max: 100)',
                q: 'string (search query)',
                year: 'number (filter by year)',
                technology: 'string (filter by technology)',
                category: 'string (filter by category)',
                active: 'boolean (filter by active status)',
                sort: 'string (name|projects|year)',
              },
            },
            detail: {
              method: 'GET',
              path: '/api/v1/organizations/{slug}',
              description: 'Get detailed organization information',
            },
          },
          years: {
            list: {
              method: 'GET',
              path: '/api/v1/years',
              description: 'List all GSoC years with stats',
            },
            organizations: {
              method: 'GET',
              path: '/api/v1/years/{year}/organizations',
              description: 'Get organizations for a specific year',
              parameters: {
                page: 'number (default: 1)',
                limit: 'number (default: 50, max: 100)',
              },
            },
            stats: {
              method: 'GET',
              path: '/api/v1/years/{year}/stats',
              description: 'Get statistics for a specific year',
            },
          },
          projects: {
            list: {
              method: 'GET',
              path: '/api/v1/projects',
              description: 'List all projects with filters',
              parameters: {
                page: 'number (default: 1)',
                limit: 'number (default: 20, max: 100)',
                q: 'string (search query)',
                year: 'number (filter by year)',
                org: 'string (filter by organization slug)',
              },
            },
            detail: {
              method: 'GET',
              path: '/api/v1/projects/{id}',
              description: 'Get detailed project information',
            },
          },
          tech_stack: {
            list: {
              method: 'GET',
              path: '/api/v1/tech-stack',
              description: 'List all technologies',
              parameters: {
                limit: 'number (default: 100, max: 500)',
                q: 'string (search query)',
                min_usage: 'number (minimum organization count)',
              },
            },
            detail: {
              method: 'GET',
              path: '/api/v1/tech-stack/{slug}',
              description: 'Get organizations using a specific technology',
              parameters: {
                page: 'number (default: 1)',
                limit: 'number (default: 20, max: 100)',
              },
            },
          },
          stats: {
            overview: {
              method: 'GET',
              path: '/api/v1/stats',
              description: 'Get overall platform statistics',
            },
          },
          health: {
            check: {
              method: 'GET',
              path: '/api/v1/health',
              description: 'API health check',
            },
          },
          meta: {
            info: {
              method: 'GET',
              path: '/api/v1/meta',
              description: 'API metadata and documentation',
            },
          },
        },
        response_format: {
          success_response: {
            success: true,
            data: '{ ... response data ... }',
            meta: {
              timestamp: 'ISO 8601 timestamp',
              version: 'API version',
            },
          },
          error_response: {
            success: false,
            error: {
              message: 'Error description',
              code: 'ERROR_CODE',
            },
          },
        },
        cache_policy: {
          organizations: '1 hour (s-maxage=3600)',
          projects: '30 minutes (s-maxage=1800)',
          stats: '1 hour (s-maxage=3600)',
          health: 'no-cache',
        },
        contact: {
          github: 'https://github.com/ketankauntia/gsoc-orgs',
          issues: 'https://github.com/ketankauntia/gsoc-orgs/issues',
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}

