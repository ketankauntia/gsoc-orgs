/**
 * Image download and compression utilities
 *
 * Reusable functions for fetching remote images,
 * converting them to WebP via sharp, and saving locally.
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function downloadImage(url: string): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw new Error(
        `Failed to download ${url} after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    );
}

export interface CompressOptions {
    width?: number;
    quality?: number;
}

export async function compressToWebP(
    input: Buffer,
    options: CompressOptions = {},
): Promise<Buffer> {
    const { width = 400, quality = 80 } = options;

    return sharp(input)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
}

export async function processAndSaveLocally(
    url: string,
    outputDir: string,
    slug: string,
    options?: CompressOptions,
): Promise<string> {
    const raw = await downloadImage(url);
    const webp = await compressToWebP(raw, options);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${slug}.webp`);
    fs.writeFileSync(outputPath, webp);
    return outputPath;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
