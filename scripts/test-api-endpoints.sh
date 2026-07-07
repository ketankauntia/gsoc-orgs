#!/bin/bash

# Test script for API endpoints
# Make sure your dev server is running: npm run dev

BASE_URL="${API_BASE:-http://localhost:3000}"
ADMIN_KEY="${ADMIN_KEY:-test-admin-key}"

echo "🧪 Testing API Endpoints"
echo "========================"
echo ""

# Test 1: Basic organizations endpoint
echo "1️⃣  Testing basic organizations endpoint..."
curl -s "${BASE_URL}/api/organizations?page=1&limit=2" | jq -r '.page, .total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 2: Multiple years filter
echo "2️⃣  Testing multiple years filter (years=2025,2024)..."
curl -s "${BASE_URL}/api/organizations?years=2025,2024&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 3: Multiple techs filter
echo "3️⃣  Testing multiple techs filter (techs=python,rust)..."
curl -s "${BASE_URL}/api/organizations?techs=python,rust&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 4: Multiple topics filter
echo "4️⃣  Testing multiple topics filter (topics=web,ai)..."
curl -s "${BASE_URL}/api/organizations?topics=web,ai&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 5: Multiple categories filter
echo "5️⃣  Testing multiple categories filter (categories=Security,Web Development)..."
curl -s "${BASE_URL}/api/organizations?categories=Security,Web Development&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 6: Combined filters (years + techs)
echo "6️⃣  Testing combined filters (years=2025,2024&techs=python)..."
curl -s "${BASE_URL}/api/organizations?years=2025,2024&techs=python&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 7: First-time organizations filter
echo "7️⃣  Testing first-time organizations filter (firstTimeOnly=true&years=2025)..."
curl -s "${BASE_URL}/api/organizations?firstTimeOnly=true&years=2025&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 8: Complex combined filters
echo "8️⃣  Testing complex combined filters (years=2025,2024&techs=python&topics=web)..."
curl -s "${BASE_URL}/api/organizations?years=2025,2024&techs=python&topics=web&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 9: Search + filters
echo "9️⃣  Testing search + filters (q=mozilla&years=2025)..."
curl -s "${BASE_URL}/api/organizations?q=mozilla&years=2025&limit=2" | jq -r '.total, .items[0].name // "No items"' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 10: Pagination
echo "🔟 Testing pagination (page=2&limit=5)..."
curl -s "${BASE_URL}/api/organizations?page=2&limit=5" | jq -r '.page, .limit, .total, .pages' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 11: Admin endpoint without auth (should fail)
echo "1️⃣1️⃣  Testing admin endpoint without auth (should return 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/admin/compute-first-time?year=2025")
if [ "$STATUS" = "401" ]; then
  echo "✅ Correctly returned 401 Unauthorized"
else
  echo "❌ Expected 401, got $STATUS"
fi
echo ""

# Test 12: Admin endpoint with auth (should work if ADMIN_KEY is set)
echo "1️⃣2️⃣  Testing admin endpoint with auth..."
if [ -n "$ADMIN_KEY" ] && [ "$ADMIN_KEY" != "test-admin-key" ]; then
  curl -s -X POST -H "x-admin-key: ${ADMIN_KEY}" "${BASE_URL}/api/admin/compute-first-time?year=2025" | jq -r '.success, .data.firstTimeCount // .error.message' 2>/dev/null || echo "❌ Failed"
else
  echo "⚠️  Skipped - Set ADMIN_KEY env variable to test"
fi
echo ""

# Test 13: Admin GET endpoint (public, no auth needed)
echo "1️⃣3️⃣  Testing admin GET endpoint (public)..."
curl -s "${BASE_URL}/api/admin/compute-first-time?year=2025" | jq -r '.success, .data.firstTimeOrganizations // .error.message' 2>/dev/null || echo "❌ Failed"
echo ""

echo "✅ Testing complete!"
echo ""
echo "Note: Make sure your dev server is running (npm run dev)"
echo "Note: Set ADMIN_KEY environment variable to test admin endpoints"

