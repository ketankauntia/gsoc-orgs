# API Endpoint Testing Guide

## Overview

This document describes how to test all the API endpoints that were modified or created for the filter sidebar fix.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Set environment variable (for admin endpoints):**
   ```bash
   export ADMIN_KEY=your-secret-key-here
   # Or add to .env file:
   # ADMIN_KEY=your-secret-key-here
   ```

## Test Script

Run the comprehensive test script:

```bash
# Make sure ADMIN_KEY is set if testing admin endpoints
export ADMIN_KEY=your-secret-key-here
./scripts/test-api-endpoints.sh
```

## Manual Testing

### 1. Basic Organizations Endpoint

```bash
curl "http://localhost:3000/api/organizations?page=1&limit=5"
```

**Expected:** Returns paginated list of organizations

---

### 2. Multiple Years Filter

```bash
curl "http://localhost:3000/api/organizations?years=2025,2024,2020&limit=5"
```

**Expected:** Returns organizations that participated in 2025 OR 2024 OR 2020

**Verify:** Check that `active_years` array contains at least one of the selected years

---

### 3. Multiple Technologies Filter

```bash
curl "http://localhost:3000/api/organizations?techs=python,rust,javascript&limit=5"
```

**Expected:** Returns organizations that use python OR rust OR javascript

**Verify:** Check that `technologies` array contains at least one of the selected techs

---

### 4. Multiple Topics Filter

```bash
curl "http://localhost:3000/api/organizations?topics=web,ai,security&limit=5"
```

**Expected:** Returns organizations that have web OR ai OR security topics

**Verify:** Check that `topics` array contains at least one of the selected topics

---

### 5. Multiple Categories Filter

```bash
curl "http://localhost:3000/api/organizations?categories=Security,Web Development&limit=5"
```

**Expected:** Returns organizations in Security OR Web Development category

**Verify:** Check that `category` field matches one of the selected categories

---

### 6. Combined Filters (AND Logic)

```bash
curl "http://localhost:3000/api/organizations?years=2025,2024&techs=python&limit=5"
```

**Expected:** Returns organizations that:
- Participated in 2025 OR 2024 (years filter)
- AND use python (techs filter)

**Verify:** All results should have python in technologies AND have 2025 or 2024 in active_years

---

### 7. First-Time Organizations Filter

```bash
curl "http://localhost:3000/api/organizations?firstTimeOnly=true&years=2025&limit=5"
```

**Expected:** Returns organizations where `first_year === 2025`

**Verify:** All results should have `first_year: 2025`

---

### 8. Complex Combined Filters

```bash
curl "http://localhost:3000/api/organizations?years=2025,2024&techs=python,rust&topics=web&limit=5"
```

**Expected:** Returns organizations that:
- Participated in 2025 OR 2024
- AND use python OR rust
- AND have web topic

**Verify:** All results match all three conditions

---

### 9. Search + Filters

```bash
curl "http://localhost:3000/api/organizations?q=mozilla&years=2025&limit=5"
```

**Expected:** Returns organizations matching "mozilla" in name/description AND participated in 2025

**Verify:** All results contain "mozilla" in name or description AND have 2025 in active_years

---

### 10. Pagination

```bash
curl "http://localhost:3000/api/organizations?page=2&limit=10"
```

**Expected:** Returns page 2 with 10 items per page

**Verify:** Response includes `page: 2`, `limit: 10`, `total`, `pages`, and exactly 10 items (or fewer if last page)

---

### 11. Admin Endpoint - Without Auth (Should Fail)

```bash
curl -X POST "http://localhost:3000/api/admin/compute-first-time?year=2025"
```

**Expected:** Returns `401 Unauthorized`

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized. Admin key required.",
    "code": "UNAUTHORIZED"
  }
}
```

---

### 12. Admin Endpoint - With Auth (POST)

```bash
curl -X POST \
  -H "x-admin-key: ${ADMIN_KEY}" \
  "http://localhost:3000/api/admin/compute-first-time?year=2025"
```

**Expected:** Computes and updates first_time field for all organizations

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

---

### 13. Admin Endpoint - GET (Public)

```bash
curl "http://localhost:3000/api/admin/compute-first-time?year=2025"
```

**Expected:** Returns statistics about first-time organizations (no auth required - public endpoint)

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

---

## Testing Checklist

- [ ] Basic organizations endpoint works
- [ ] Multiple years filter (OR logic) works
- [ ] Multiple techs filter (OR logic) works
- [ ] Multiple topics filter (OR logic) works
- [ ] Multiple categories filter (OR logic) works
- [ ] Combined filters (AND logic) work correctly
- [ ] First-time organizations filter works
- [ ] Search + filters work together
- [ ] Pagination works correctly
- [ ] Admin endpoint rejects requests without auth
- [ ] Admin endpoint accepts requests with correct auth
- [ ] Admin GET endpoint returns statistics

## Common Issues

### Issue: Filters not working

**Check:**
1. Are you using plural parameter names? (`years`, not `year`)
2. Are values comma-separated? (`years=2025,2024`)
3. Is the server running?

### Issue: Admin endpoint returns 401

**Check:**
1. Is `ADMIN_KEY` environment variable set?
2. Is the header name correct? (`x-admin-key`)
3. Is the header value matching `ADMIN_KEY`?

### Issue: No results returned

**Check:**
1. Do organizations exist with those filter criteria?
2. Are the filter values spelled correctly?
3. Check the database to verify data exists

## Browser Testing

You can also test endpoints directly in the browser:

1. Navigate to: `http://localhost:3000/organizations`
2. Use the filter sidebar to select multiple years, techs, topics
3. Check the URL parameters match what you selected
4. Verify the results match the filter criteria

## Notes

- All filter parameters support multiple comma-separated values
- OR logic within filter groups (e.g., years=2025,2024)
- AND logic across filter groups (e.g., years AND techs)
- Pagination works with all filter combinations
- Admin endpoints require authentication

