/**
 * Cloudflare R2 client utilities
 *
 * S3-compatible client for uploading images to Cloudflare R2.
 * Env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID,
 *           R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getEnvOrThrow(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}. See .env.example`);
    }
    return value;
}

let _client: S3Client | null = null;

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
    });

    return _client;
}

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

export function getR2PublicUrl(key: string): string {
    const publicUrl = getEnvOrThrow("R2_PUBLIC_URL");
    return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}
