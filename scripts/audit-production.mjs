import { execFileSync } from "node:child_process";

// Fails on high or critical advisories in production dependencies, except the
// reviewed ones below. Each exception names why it does not apply and when to drop it.
const ACCEPTED = {
  // better-auth server-side issues. @neondatabase/auth 0.5 pins better-auth 1.6.23;
  // this app only uses its client and cookie helpers, and the auth server runs at Neon.
  // Remove once @neondatabase/auth ships better-auth >= 1.7.7.
  "GHSA-965c-763c-88jm": "better-auth: OAuth state used as a magic link (server plugin)",
  "GHSA-r4xp-prcw-77qf": "better-auth: OAuth proxy sign-in (server plugin)",
  "GHSA-q84f-53jg-9ppm": "better-auth: device login approval (server plugin)",
};
const BLOCKING = new Set(["high", "critical"]);

let report;
try {
  report = execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", shell: process.platform === "win32" });
} catch (error) {
  // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
  report = error.stdout;
}
const { vulnerabilities = {} } = JSON.parse(report);

const advisories = new Map();
for (const entry of Object.values(vulnerabilities)) {
  for (const via of entry.via) {
    if (typeof via === "string" || !BLOCKING.has(via.severity)) continue;
    const id = via.url.split("/").pop();
    advisories.set(id, `${via.severity} ${via.name} ${via.range}: ${via.title} (${via.url})`);
  }
}

const blocking = [...advisories].filter(([id]) => !(id in ACCEPTED));
for (const [id] of advisories) if (id in ACCEPTED) console.log(`accepted ${id}: ${ACCEPTED[id]}`);
for (const id of Object.keys(ACCEPTED)) if (!advisories.has(id)) console.log(`no longer reported, remove from the list: ${id}`);

if (blocking.length > 0) {
  console.error(`\n${blocking.length} high or critical production advisories:`);
  for (const [, line] of blocking) console.error(`- ${line}`);
  process.exit(1);
}
console.log("No unreviewed high or critical production advisories.");
