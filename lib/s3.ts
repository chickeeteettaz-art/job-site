import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function getS3Bucket() {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
        throw new Error("AWS_S3_BUCKET is not configured");
    }

    return bucket;
}

export function getS3Client() {
    const region = process.env.AWS_REGION;

    if (!region) {
        throw new Error("AWS_REGION is not configured");
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId) {
        throw new Error("AWS_ACCESS_KEY_ID is not configured");
    }

    if (!secretAccessKey) {
        throw new Error("AWS_SECRET_ACCESS_KEY is not configured");
    }

    client ??= new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return client;
}