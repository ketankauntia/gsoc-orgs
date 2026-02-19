/**
 * Fetch raw GSoC organization data from Google's API for any year.
 *
 * Writes:
 *   new-api-details/yearly/google-summer-of-code-{year}-organizations-raw.json
 *
 * Usage:
 *   npx tsx scripts/fetch-year-data.ts --year 2026
 *   npx tsx scripts/fetch-year-data.ts --year 2027
 *   npx tsx scripts/fetch-year-data.ts               (defaults to current year)
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const yearFlagIdx = args.indexOf("--year");
const YEAR =
  yearFlagIdx !== -1 && args[yearFlagIdx + 1]
    ? parseInt(args[yearFlagIdx + 1], 10)
    : new Date().getFullYear();

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
  console.error("Invalid year. Usage: npx tsx scripts/fetch-year-data.ts --year 2026");
  process.exit(1);
}

const fetchYearData = async () => {
  const url = `https://summerofcode.withgoogle.com/api/program/${YEAR}/organizations/`;
  console.log(`[FETCH] GSoC ${YEAR} organizations from ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch GSoC ${YEAR} organizations: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  const outputDir = path.join(process.cwd(), "new-api-details", "yearly");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(
    outputDir,
    `google-summer-of-code-${YEAR}-organizations-raw.json`,
  );
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

  const orgCount = Array.isArray(data) ? data.length : "unknown";
  console.log(`[DONE] Saved ${orgCount} organizations to ${outputFile}`);
};

fetchYearData().catch((err) => {
  console.error(`[ERROR] Failed to fetch GSoC ${YEAR} data`);
  console.error(err);
  process.exit(1);
});
