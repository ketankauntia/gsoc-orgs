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
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Downloads an image from the given URL with retry logic and a per-attempt timeout.
 * Uses an AbortController to abort stalled requests after FETCH_TIMEOUT_MS.
 *
 * @param url - The URL of the image to download.
 * @returns A Buffer containing the raw image data.
 * @throws If all retry attempts are exhausted.
 */
export async function downloadImage(url: string): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, { signal: controller.signal });

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
        } finally {
            clearTimeout(timer);
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

/**
 * Compresses a raw image buffer to WebP format using sharp.
 *
 * @param input - The raw image buffer to compress.
 * @param options - Optional width and quality settings.
 * @returns A Buffer containing the compressed WebP image.
 */
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

export interface ProcessResult {
    outputPath: string;
    originalSize: number;
    compressedSize: number;
}

/**
 * Downloads an image, compresses it to WebP, and saves it locally.
 *
 * @param url - The URL of the image to download.
 * @param outputDir - The directory to save the compressed image to.
 * @param slug - The slug used for the output filename ({slug}.webp).
 * @param options - Optional compression settings.
 * @returns The output path and original/compressed sizes in bytes.
 */
export async function processAndSaveLocally(
    url: string,
    outputDir: string,
    slug: string,
    options?: CompressOptions,
): Promise<ProcessResult> {
    const raw = await downloadImage(url);
    const webp = await compressToWebP(raw, options);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${slug}.webp`);
    fs.writeFileSync(outputPath, webp);
    return {
        outputPath,
        originalSize: raw.length,
        compressedSize: webp.length,
    };
}

/**
 * Returns a promise that resolves after the specified delay.
 *
 * @param ms - The number of milliseconds to sleep.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
