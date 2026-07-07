# Feature: Secure Waitlist for AI Features

## Summary

Implemented a security-first waitlist system for future paid AI features and custom GSoC tools.
This is a write-only system designed for an open-source repository where source code is publicly visible.

## Files Created

- `prisma/schema.prisma` - Added `waitlist_entries` model
- `app/api/waitlist/route.ts` - Write-only POST endpoint
- `components/waitlist-cta.tsx` - Client component for waitlist form

## Security Architecture

### Threat Model

Since this is an OSS project, we assume:
- Attackers can read all source code
- No security through obscurity
- All protection must be in server-side logic and env vars

### Security Measures Implemented

1. **Write-Only API**
   - Only POST method allowed
   - GET/PUT/DELETE/PATCH explicitly blocked with 405
   - No endpoint to read, list, or count entries
   - No admin read routes by default

2. **Rate Limiting**
   - IP-based rate limiting: 5 requests/minute per IP
   - In-memory with automatic cleanup (suitable for Vercel serverless)
   - Returns 429 with Retry-After header

3. **Email Enumeration Prevention**
   - Always returns `{ success: true }` on valid submission
   - Uses upsert to handle duplicates silently
   - Error messages are generic, never reveal existence

4. **Input Validation**
   - Server-side email validation (regex + length checks)
   - Emails normalized: lowercased and trimmed
   - Interests restricted to closed set: `["ai-features", "gsoc-tools"]`
   - Max 2 interests per submission

5. **No Data Leakage**
   - Error logs exclude email addresses
   - No debug endpoints
   - No count or stats endpoints

## Database Model

```prisma
model waitlist_entries {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  email       String    @unique
  interests   String[]
  source      String    @default("website")
  createdAt   DateTime  @default(now()) @db.Date
  invitedAt   DateTime? @db.Date
  convertedAt DateTime? @db.Date
}
```

Fields `invitedAt` and `convertedAt` are for owner's internal use only.

## API Specification

### POST /api/waitlist

**Request:**
```json
{
  "email": "user@example.com",
  "interests": ["ai-features"]
}
```

**Response (always on valid input):**
```json
{ "success": true }
```

**Error Responses:**
- 400: Invalid email or request body
- 429: Rate limited
- 500: Server error

## UI Component

`WaitlistCTA` is a client component that:
- Renders static HTML structure (SEO-safe)
- Uses existing design system (Button, Input, Badge, Section, Heading, Text)
- Provides loading, success, and error states
- Optional interest selection via toggle buttons

## Caching

- API: `force-dynamic`, `Cache-Control: no-store`
- Component: Does not affect page caching
- Surrounding pages remain ISR/static

## What is NOT Implemented (Intentionally)

1. **Admin Read Endpoint** - Owner accesses data directly via MongoDB/Prisma Studio
2. **Email Verification** - Would require email service integration
3. **CAPTCHA** - Rate limiting provides basic abuse protection
4. **Analytics** - No user tracking beyond waitlist entry
5. **GET /api/waitlist** - No read access exists

## Usage

Import and place the component on any page:

```tsx
import { WaitlistCTA } from "@/components/waitlist-cta";

export default function Page() {
  return (
    <>
      {/* Other content */}
      <WaitlistCTA />
    </>
  );
}
```

## Environment Variables

No new environment variables required. The feature uses the existing `DATABASE_URL`.

## Future Considerations

If admin access is needed later:
- Create protected route with `x-admin-key` header (like `/api/admin/invalidate-cache`)
- Admin key MUST come from environment variable
- Route should not be linked or discoverable
