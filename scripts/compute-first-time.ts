import "./load-env";

/**
 * Script to compute and update first_time field for organizations
 * 
 * Usage:
 *   npx tsx scripts/compute-first-time.ts [year]
 * 
 * Examples:
 *   npx tsx scripts/compute-first-time.ts 2025
 *   npx tsx scripts/compute-first-time.ts     (uses current year)
 * 
 * This script calls the API endpoint to compute first_time for all organizations.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const ADMIN_KEY = process.env.ADMIN_KEY
const TARGET_YEAR = process.argv[2] ? parseInt(process.argv[2]) : new Date().getFullYear()

async function computeFirstTime() {
  if (!ADMIN_KEY) {
    console.error('❌ Error: ADMIN_KEY environment variable is not set.')
    console.error('   Please set ADMIN_KEY in your .env file or environment variables.')
    process.exit(1)
  }

  try {
    console.log(`Computing first_time field for year ${TARGET_YEAR}...`)
    console.log(`Calling API: ${API_BASE}/api/admin/compute-first-time?year=${TARGET_YEAR}`)

    const response = await fetch(`${API_BASE}/api/admin/compute-first-time?year=${TARGET_YEAR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error:', data.error)
      process.exit(1)
    }

    console.log('\n✅ Success!')
    console.log(`Target Year: ${data.data.targetYear}`)
    console.log(`Total Organizations: ${data.data.totalOrganizations}`)
    console.log(`Updated: ${data.data.updatedCount}`)
    console.log(`First-time Organizations: ${data.data.firstTimeCount}`)
    console.log(`Timestamp: ${data.data.timestamp}`)
  } catch (error) {
    console.error('Failed to compute first_time:', error)
    process.exit(1)
  }
}

computeFirstTime()
