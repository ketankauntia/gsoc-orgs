import fs from "fs";
import path from "path";

const fetch2026Data = async () => {
  const url =
    "https://summerofcode.withgoogle.com/api/program/2026/organizations/";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch GSoC 2026 organizations: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const outputDir = path.join(
    process.cwd(),
    "new-api-details",
    "yearly"
  );

  // create folder if it does not exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(
    outputDir,
    "google-summer-of-code-2026-organizations-raw.json"
  );

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

  console.log(
    "✅ Saved GSoC 2026 organizations data to:",
    outputFile
  );
};

fetch2026Data().catch((err) => {
  console.error("❌ Error fetching GSoC 2026 data");
  console.error(err);
  process.exit(1);
});
