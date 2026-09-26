import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, hasSameOrigin } from "@/lib/authz";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not allowed." }, { status: 403 });
  }

  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (identity.role === "admin") {
    return NextResponse.json({ error: "Recruiter accounts cannot upload applicant CVs." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const fileSizeBytes = payload.fileSizeBytes;
  const snapshotSizeBytes = payload.snapshotSizeBytes;

  if (
    payload.contentType !== "application/pdf" ||
    typeof fileSizeBytes !== "number" ||
    !Number.isSafeInteger(fileSizeBytes) ||
    fileSizeBytes < 5 ||
    fileSizeBytes > MAX_PDF_BYTES ||
    typeof snapshotSizeBytes !== "number" ||
    !Number.isSafeInteger(snapshotSizeBytes) ||
    snapshotSizeBytes < 8 ||
    snapshotSizeBytes > MAX_SNAPSHOT_BYTES
  ) {
    return NextResponse.json({ error: "Choose a PDF up to 10 MB." }, { status: 400 });
  }

  const uploadId = crypto.randomUUID();
  const prefix = `${identity.userId}/${uploadId}`;
  const fileKey = `${prefix}/resume.pdf`;
  const snapshotKey = `${prefix}/snapshot.png`;

  const missingSettings = [
    ["AWS_REGION", process.env.AWS_REGION],
    ["AWS_S3_BUCKET", process.env.AWS_S3_BUCKET],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missingSettings.length > 0) {
    return NextResponse.json(
      { error: `CV storage is missing server settings: ${missingSettings.join(", ")}.` },
      { status: 503 },
    );
  }

  try {
    const s3 = getS3Client();
    const bucket = getS3Bucket();
    const [filePutUrl, snapshotPutUrl] = await Promise.all([
      getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: bucket, Key: fileKey, ContentType: "application/pdf" }),
        { expiresIn: 300 },
      ),
      getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: bucket, Key: snapshotKey, ContentType: "image/png" }),
        { expiresIn: 300 },
      ),
    ]);

    return NextResponse.json({ uploadId, fileKey, snapshotKey, filePutUrl, snapshotPutUrl });
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "UnknownError";
    console.error(`Unable to sign CV upload URLs (${errorType})`);
    const message = ["CredentialsProviderError", "ProviderError"].includes(errorType)
      ? "The server has no usable AWS credentials. Configure a local AWS profile or a deployment IAM role."
      : "AWS could not sign the CV upload. Check the server's AWS region, bucket, and signing configuration.";

    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }
}