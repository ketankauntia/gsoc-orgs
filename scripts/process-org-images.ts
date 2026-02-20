/**
 * GSoC Org Image Processing Pipeline
 *
 * Downloads org logos from the GSoC API, compresses to WebP,
 * saves locally, and optionally uploads to Cloudflare R2.
 *
 * Usage:
 *   npx tsx scripts/process-org-images.ts --year 2026
 *   npx tsx scripts/process-org-images.ts --year 2026 --dry-run
 *   npx tsx scripts/process-org-images.ts --year 2026 --local-only
 */

import fs from "fs";
import path from "path";
import { downloadImage, compressToWebP, sleep } from "./lib/image-processor";
import { uploadToR2 } from "./lib/r2-client";

const args = process.argv.slice(2);
const yearFlagIdx = args.indexOf("--year");
const YEAR =
    yearFlagIdx !== -1 && args[yearFlagIdx + 1]
        ? parseInt(args[yearFlagIdx + 1], 10)
        : new Date().getFullYear();

const DRY_RUN = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const LOCAL_ONLY = args.includes("--local-only");

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
    console.error(
        "Invalid year. Usage: npx tsx scripts/process-org-images.ts --year 2026",
    );
    process.exit(1);
}

const ROOT = process.cwd();
const ORGS_DIR = path.join(ROOT, "new-api-details", "organizations");
const RAW_FILE = path.join(
    ROOT,
    "new-api-details",
    "yearly",
    `google-summer-of-code-${YEAR}-organizations-raw.json`,
);
const IMAGES_DIR = path.join(ROOT, "images", String(YEAR));

const R2_URL_PREFIX = "https://pub-268c3a1efc8b4f8a99115507a760ca14.r2.dev/";
const DOWNLOAD_DELAY_MS = 500;

interface RawOrg {
    name: string;
    slug: string;
    logo_url: string;
}

async function main() {
    console.log(`\n[IMAGES] GSoC ${YEAR} — Image Processing Pipeline`);
    console.log(`  Mode: ${DRY_RUN ? "DRY RUN" : LOCAL_ONLY ? "LOCAL ONLY" : "FULL (download + upload)"}\n`);

    if (!fs.existsSync(RAW_FILE)) {
        console.error(`[ERROR] Raw file not found: ${RAW_FILE}`);
        console.error(`  Run: npx tsx scripts/fetch-year-data.ts first`);
        process.exit(1);
    }

    const rawOrgs: RawOrg[] = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
    console.log(`[READ] ${rawOrgs.length} organizations from raw data`);

    const toProcess: RawOrg[] = [];
    const skipped: string[] = [];

    for (const raw of rawOrgs) {
        if (!raw.logo_url) {
            skipped.push(`${raw.slug} (no logo_url)`);
            continue;
        }

        const orgFile = path.join(ORGS_DIR, `${raw.slug}.json`);
        if (fs.existsSync(orgFile)) {
            try {
                const orgData = JSON.parse(fs.readFileSync(orgFile, "utf-8"));
                const currentR2 = orgData.img_r2_url || orgData.logo_r2_url || "";
                if (currentR2.startsWith(R2_URL_PREFIX)) {
                    skipped.push(`${raw.slug} (already has R2 URL)`);
                    continue;
                }
            } catch {
                // If we can't read/parse the file, process anyway
            }
        }

        toProcess.push(raw);
    }

    console.log(`[ANALYSIS] ${toProcess.length} orgs to process, ${skipped.length} skipped`);

    if (DRY_RUN) {
        console.log("\n[DRY RUN] Would process:");
        toProcess.forEach((o) => console.log(`  - ${o.slug}: ${o.logo_url}`));
        console.log("\n[DRY RUN] Skipped:");
        skipped.forEach((s) => console.log(`  - ${s}`));
        console.log("\n[DRY RUN] No files modified.");
        return;
    }

    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    let processed = 0;
    let failed = 0;
    const failures: Array<{ slug: string; error: string }> = [];

    for (let i = 0; i < toProcess.length; i++) {
        const raw = toProcess[i];
        const progress = `[${i + 1}/${toProcess.length}]`;

        try {
            console.log(`${progress} Downloading ${raw.slug}...`);
            const imageBuffer = await downloadImage(raw.logo_url);

            const webpBuffer = await compressToWebP(imageBuffer);
            const localPath = path.join(IMAGES_DIR, `${raw.slug}.webp`);
            fs.writeFileSync(localPath, webpBuffer);

            const sizeBefore = (imageBuffer.length / 1024).toFixed(1);
            const sizeAfter = (webpBuffer.length / 1024).toFixed(1);
            console.log(`${progress} Compressed: ${sizeBefore}KB → ${sizeAfter}KB`);

            let r2Url = "";
            if (!LOCAL_ONLY) {
                const r2Key = `${raw.slug}.webp`;
                r2Url = await uploadToR2(r2Key, webpBuffer, "image/webp");
                console.log(`${progress} Uploaded to R2: ${r2Url}`);
            }

            if (!LOCAL_ONLY) {
                updateOrgJson(raw.slug, r2Url);
            }

            processed++;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`${progress} FAILED ${raw.slug}: ${errorMsg}`);
            failures.push({ slug: raw.slug, error: errorMsg });
            failed++;
        }

        if (i < toProcess.length - 1) {
            await sleep(DOWNLOAD_DELAY_MS);
        }
    }
    console.log("\n[DONE] Image processing complete!");
    console.log(`  Processed: ${processed}`);
    console.log(`  Skipped:   ${skipped.length}`);
    console.log(`  Failed:    ${failed}`);

    if (failures.length > 0) {
        console.log("\n[FAILURES]");
        failures.forEach((f) => console.log(`  - ${f.slug}: ${f.error}`));
    }

    if (LOCAL_ONLY) {
        console.log(`\n  Local files saved to: ${IMAGES_DIR}`);
        console.log("  Re-run without --local-only to upload to R2.");
    }
}

function updateOrgJson(slug: string, r2Url: string) {
    const orgFile = path.join(ORGS_DIR, `${slug}.json`);
    if (!fs.existsSync(orgFile)) return;

    try {
        const data = JSON.parse(fs.readFileSync(orgFile, "utf-8"));
        data.img_r2_url = r2Url;
        data.logo_r2_url = r2Url;
        fs.writeFileSync(orgFile, JSON.stringify(data, null, 2));
    } catch (err) {
        console.warn(`  [WARN] Could not update ${orgFile}: ${err}`);
    }
}

main().catch((err) => {
    console.error("[FATAL]", err);
    process.exit(1);
});
