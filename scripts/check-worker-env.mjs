import path from "node:path";
import { pathToFileURL } from "node:url";

// OpenNext copies every value from local .env* files into the Worker script
// (.open-next/cloudflare/next-env.mjs). A build made on a machine with
// .env.local would upload those secrets inside the code, so deploys stop here.
// Workers Builds checks out a clean tree and only embeds NEXT_PUBLIC_* values.
const file = path.join(process.cwd(), ".open-next", "cloudflare", "next-env.mjs");
const modes = await import(pathToFileURL(file).href);
// Every mode's values ship in the script, whichever NEXTJS_ENV selects at runtime.
const embedded = [...new Set(["production", "development", "test"].flatMap((mode) => Object.keys(modes[mode] ?? {})))]
  .filter((name) => !name.startsWith("NEXT_PUBLIC_"));

if (embedded.length > 0) {
  console.error(
    `Refusing to deploy: the build embedded ${embedded.length} server variable(s) from local .env files ` +
      `(${embedded.join(", ")}). Deploy through Workers Builds, or rebuild without .env/.env.local files.`,
  );
  process.exit(1);
}
console.log("No server variables embedded in the Worker build.");
