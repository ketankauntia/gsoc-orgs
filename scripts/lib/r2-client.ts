/**
 * Cloudflare R2 client utilities
 *
 * S3-compatible client for uploading images to Cloudflare R2.
 * Env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID,
 *           R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

/**
 * Reads a required environment variable or throws an error if it is not set.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws If the environment variable is not set.
 */
function getEnvOrThrow(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}. See .env.example`);
    }
    return value;
}

let _client: S3Client | null = null;

/**
 * Returns a lazily-initialized S3Client configured for Cloudflare R2
 * with socket and connection timeouts via NodeHttpHandler.
 */
function getClient(): S3Client {
    if (_client) return _client;

    const accountId = getEnvOrThrow("R2_ACCOUNT_ID");

    _client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: getEnvOrThrow("R2_ACCESS_KEY_ID"),
            secretAccessKey: getEnvOrThrow("R2_SECRET_ACCESS_KEY"),
        },
        requestHandler: new NodeHttpHandler({
            socketTimeout: 30_000,
            connectionTimeout: 10_000,
        }),
    });

    return _client;
}

/**
 * Uploads a buffer to Cloudflare R2 and returns its public URL.
 *
 * @param key - The object key (path) in the R2 bucket.
 * @param body - The file contents to upload.
 * @param contentType - The MIME type of the file (e.g. "image/webp").
 * @returns The public URL of the uploaded object.
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string,
): Promise<string> {
    const bucket = getEnvOrThrow("R2_BUCKET_NAME");
    const client = getClient();

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );

    return getR2PublicUrl(key);
}

/**
 * Constructs the public URL for an object stored in R2.
 *
 * @param key - The object key (path) in the R2 bucket.
 * @returns The full public URL.
 */
export function getR2PublicUrl(key: string): string {
    const publicUrl = getEnvOrThrow("R2_PUBLIC_URL");
    return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}
