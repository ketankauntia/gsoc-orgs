import fs from "node:fs";
import path from "node:path";

const aliases: Record<string, string> = {
  "forschungszentrum-jülich": "forschungszentrum-julich",
  "institut-für-angewandte-informatik-infai-ev": "institut-fur-angewandte-informatik-infai-ev",
};
const write = process.argv.includes("--write");
const dataRoot = path.join(process.cwd(), "new-api-details");

function replaceExactStrings(value: unknown): unknown {
  if (typeof value === "string") return aliases[value] ?? value;
  if (Array.isArray(value)) return value.map(replaceExactStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceExactStrings(item)]));
  }
  return value;
}

function jsonFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? jsonFiles(target) : entry.name.endsWith(".json") ? [target] : [];
  });
}

let changedFiles = 0;
for (const file of jsonFiles(dataRoot)) {
  const source = fs.readFileSync(file, "utf8");
  const normalized = JSON.stringify(replaceExactStrings(JSON.parse(source)), null, 2);
  if (normalized === source) continue;
  changedFiles += 1;
  if (write) fs.writeFileSync(file, normalized);
}

for (const [legacy, canonical] of Object.entries(aliases)) {
  const legacyPath = path.join(dataRoot, "organizations", `${legacy}.json`);
  const canonicalPath = path.join(dataRoot, "organizations", `${canonical}.json`);
  if (!fs.existsSync(legacyPath)) continue;
  if (fs.existsSync(canonicalPath)) throw new Error(`Refusing to overwrite ${canonicalPath}`);
  if (write) fs.renameSync(legacyPath, canonicalPath);
}

console.log(`${write ? "Normalized" : "Would normalize"} ${changedFiles} JSON files.`);
