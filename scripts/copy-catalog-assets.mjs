import fs from "node:fs";
import path from "node:path";

// Runs after `opennextjs-cloudflare build`. The Worker reads catalog JSON from
// these static assets through its ASSETS binding (lib/catalog-data.ts); the
// Worker itself returns 404 for public requests to /_catalog/.
const root = process.cwd();
const source = path.join(root, "new-api-details");
const target = path.join(root, ".open-next", "assets", "_catalog");

if (!fs.existsSync(path.join(root, ".open-next", "assets"))) {
  console.error("Missing .open-next/assets. Run `opennextjs-cloudflare build` first.");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
let copied = 0;
fs.cpSync(source, target, {
  recursive: true,
  filter: (file) => {
    if (fs.statSync(file).isDirectory()) return true;
    if (!file.endsWith(".json")) return false;
    copied++;
    return true;
  },
});
console.log(`Copied ${copied} catalog files to static assets.`);
