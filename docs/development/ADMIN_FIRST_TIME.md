# First-Time Organizations Computation

## Overview

The `first_time` field identifies organizations that are participating in GSoC for the first time in a given year. This field needs to be computed and updated whenever new organizations are added for a new GSoC year.

## API Endpoint

### POST `/api/admin/compute-first-time?year={year}`

Computes and updates the `first_time` field for all organizations based on a target year.

**Authentication:**
- **Required Header**: `x-admin-key` - Must match the `ADMIN_KEY` environment variable
- Set `ADMIN_KEY` in your `.env` file or environment variables

**Query Parameters:**
- `year` (optional): Target year to compute first-time organizations for. Defaults to current year if not provided.

**Logic:**
- An organization is "first-time" for a target year if `first_year === targetYear`
- This means the organization never appeared in GSoC before this year

**Response:**
```json
{
  "success": true,
  "data": {
    "targetYear": 2025,
    "totalOrganizations": 504,
    "updatedCount": 504,
    "firstTimeCount": 14,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### GET `/api/admin/compute-first-time?year={year}`

Returns statistics about first-time organizations for a given year.

**Note:** This endpoint is **public** (no authentication required) for open source usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "targetYear": 2025,
    "totalOrganizations": 504,
    "organizationsForYear": 150,
    "firstTimeOrganizations": 14,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## Usage

### Via API Call

```bash
# Set your admin key (or use .env file)
export ADMIN_KEY=your-secret-key-here

# Compute for current year (default)
curl -X POST http://localhost:3000/api/admin/compute-first-time \
  -H "x-admin-key: $ADMIN_KEY"

# Compute for specific year
curl -X POST http://localhost:3000/api/admin/compute-first-time?year=2025 \
  -H "x-admin-key: $ADMIN_KEY"

# Check statistics (public endpoint, no auth needed)
curl http://localhost:3000/api/admin/compute-first-time?year=2025
```

### Via Script

```bash
# Using the provided script
npx tsx scripts/compute-first-time.ts 2025

# Or for current year
npx tsx scripts/compute-first-time.ts
```

### When to Run

Run this computation:
1. **After new GSoC organizations are added** for a new year
2. **At the beginning of each GSoC cycle** to refresh first-time status
3. **After bulk data imports** to ensure accuracy

## Example Workflow for 2026

When GSoC 2026 organizations are released:

1. Import new organizations into the database
2. Run the computation:
   ```bash
   curl -X POST http://localhost:3000/api/admin/compute-first-time?year=2026 \
     -H "x-admin-key: $ADMIN_KEY"
   ```
3. Verify results (public endpoint):
   ```bash
   curl http://localhost:3000/api/admin/compute-first-time?year=2026
   ```

## Database Schema

The `first_time` field is stored in the `organizations` table:

```prisma
model organizations {
  // ... other fields
  first_time Boolean?  // Computed field: true if org is first-time in the target year
  // ... other fields
}
```

## Filtering in API

The `/api/organizations` endpoint supports filtering by first-time organizations:

- `?firstTimeOnly=true` - Returns only first-time organizations
- `?firstTimeOnly=true&years=2025` - Returns organizations that are first-time in 2025
- `?firstTimeOnly=true&years=2025,2024` - Returns organizations that are first-time in either 2025 or 2024

## Notes

- The computation processes all organizations in the database
- Progress is logged every 50 organizations
- The field is updated in-place (no migration needed for existing data)
- The computation is idempotent (safe to run multiple times)

