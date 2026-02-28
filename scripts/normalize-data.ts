import fs from "fs";
import path from "path";

// Each sub-array has the "Standard Name" first, followed by its alternate variations.
export const TECH_ALIASES = [
  ["Vue", "vue.js", "vuejs"],
  ["React", "react.js", "reactjs"],
  ["C++", "c/c++", "cpp"],
  ["C#", "c #", "csharp", ".net", "dotnet"],
  ["Node.js", "node", "nodejs"],
  ["Angular", "angular.js", "angularjs"],
  ["Python", "python3", "python2"],
  ["JavaScript", "js", "vanilla js"],
  ["TypeScript", "ts"],
  ["Go", "golang"],
  ["Ruby", "ruby on rails", "rails"],
  ["PostgreSQL", "postgres", "psql"],
  ["MongoDB", "mongo", "mongodb"],
  ["MySQL", "mysql"],
  ["Docker", "docker"],
  ["Kubernetes", "k8s"],
  ["AWS", "amazon web services", "aws cloud"],
  ["GCP", "google cloud platform", "google cloud"],
  ["Azure", "microsoft azure"],
];

// Each sub-array has the "Standard Name" first, followed by its alternate variations.
export const ORG_ALIASES: string[][] = [
  ["Ceph Foundation", "ceph", "ceph-foundation"],
  ["OpenMS", "openms", "openms-inc"]
];

/**
 * Normalizes a technology name.
 * If the raw name matches any of the variations (case-insensitive),
 * it returns the Standard Name (the first element of the array).
 * Otherwise, it falls back to the original trimmed name.
 */
export function getStandardTechName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const aliases of TECH_ALIASES) {
    const [standard, ...alts] = aliases;
    if (standard.toLowerCase() === lower || alts.map(a => a.toLowerCase()).includes(lower)) {
      return standard;
    }
  }
  return raw.trim();
}

/**
 * Normalizes an organization name.
 * Runs through ORG_ALIASES mapping.
 */
export function getStandardOrgName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const aliases of ORG_ALIASES) {
    const [standard, ...alts] = aliases;
    if (standard.toLowerCase() === lower || alts.map(a => a.toLowerCase()).includes(lower)) {
      return standard;
    }
  }
  return raw.trim();
}

// ---------------------------------------------------------------------------
// Run logic to modify new-api-details/organizations/*.json
// ---------------------------------------------------------------------------

async function main() {
  // Only execute logic if run directly (not imported)
  // Using import.meta.url is the reliable ESM pattern, avoids __filename issues with tsx
  const { fileURLToPath } = await import("url");
  const scriptPath = fileURLToPath(import.meta.url);
  if (process.argv[1] !== scriptPath) return;

  const ROOT = process.cwd();
  const ORGS_DIR = path.join(ROOT, "new-api-details", "organizations");

  if (!fs.existsSync(ORGS_DIR)) {
    console.error(`[ERROR] Directory not found: ${ORGS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(ORGS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json" && f !== "metadata.json");

  console.log(`[START] Normalizing data for ${files.length} organization files...`);

  let modifiedCount = 0;

  for (const file of files) {
    const filePath = path.join(ORGS_DIR, file);
    try {
      const dbBytes = fs.readFileSync(filePath, "utf-8");
      const org = JSON.parse(dbBytes);

      let hasChanges = false;

      // Normalize technologies
      if (Array.isArray(org.technologies)) {
        const newTechs: string[] = [];
        const seenTechs = new Set<string>();

        for (const rawTech of org.technologies) {
          const standard = getStandardTechName(rawTech);
          if (!seenTechs.has(standard.toLowerCase())) {
            newTechs.push(standard);
            seenTechs.add(standard.toLowerCase());
          }
          if (standard !== rawTech) {
            hasChanges = true;
          }
        }

        if (org.technologies.length !== newTechs.length) {
          hasChanges = true;
        }

        if (hasChanges) {
          org.technologies = newTechs;
        }
      }

      // Normalize Organization Name
      if (org.name) {
        const stdOrgName = getStandardOrgName(org.name);
        if (stdOrgName !== org.name) {
          org.name = stdOrgName;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, JSON.stringify(org, null, 2) + "\n");
        modifiedCount++;
      }
    } catch (e) {
      console.error(`[ERROR] Failed processing ${file}:`, e);
    }
  }

  console.log(`[DONE] Modified ${modifiedCount} files. Data normalization complete!`);
}

main();
