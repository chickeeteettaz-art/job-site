import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, hasSameOrigin, isJobType } from "@/lib/authz";
import { createAdminClient } from "@/lib/admin";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function hasFileSignature(key: string, expected: "pdf" | "png") {
  const object = await getS3Client().send(
    new GetObjectCommand({ Bucket: getS3Bucket(), Key: key, Range: "bytes=0-7" }),
  );
  const bytes = await object.Body?.transformToByteArray();

  if (!bytes) return false;
  if (expected === "pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";

  return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
}

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
    return NextResponse.json({ error: "Invalid CV details." }, { status: 400 });
  }

  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid CV details." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const uploadId = payload.uploadId;
  const fileName = payload.fileName;
  const fileSizeBytes = payload.fileSizeBytes;
  const email = identity.claims.email;

  if (
    typeof uploadId !== "string" ||
    !UUID_PATTERN.test(uploadId) ||
    !isJobType(payload.jobType) ||
    typeof fileName !== "string" ||
    fileName.length < 1 ||
    fileName.length > 160 ||
    /[\u0000-\u001f]/.test(fileName) ||
    typeof fileSizeBytes !== "number" ||
    !Number.isSafeInteger(fileSizeBytes) ||
    fileSizeBytes < 5 ||
    fileSizeBytes > 10 * 1024 * 1024 ||
    typeof email !== "string"
  ) {
    return NextResponse.json({ error: "CV details are incomplete or invalid." }, { status: 400 });
  }

  const prefix = `${identity.userId}/${uploadId}`;
  const fileKey = `${prefix}/resume.pdf`;
  const snapshotKey = `${prefix}/snapshot.png`;
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "CV metadata storage is not configured yet." }, { status: 503 });
  }

  let bucket: string;
  let s3: S3Client;
  try {
    bucket = getS3Bucket();
    s3 = getS3Client();
  } catch {
    return NextResponse.json({ error: "CV storage is not configured yet." }, { status: 503 });
  }

  try {
    const [fileHead, snapshotHead] = await Promise.all([
      s3.send(new HeadObjectCommand({ Bucket: bucket, Key: fileKey })),
      s3.send(new HeadObjectCommand({ Bucket: bucket, Key: snapshotKey })),
    ]);

    if (
      fileHead.ContentLength !== fileSizeBytes ||
      fileHead.ContentType !== "application/pdf" ||
      !snapshotHead.ContentLength ||
      snapshotHead.ContentLength > 4 * 1024 * 1024 ||
      snapshotHead.ContentType !== "image/png" ||
      !(await hasFileSignature(fileKey, "pdf")) ||
      !(await hasFileSignature(snapshotKey, "png"))
    ) {
      throw new Error("Uploaded files did not pass validation.");
    }

    const { error } = await createAdminClient().from("cvs").insert({
      id: uploadId,
      user_id: identity.userId,
      owner_email: email,
      job_type: payload.jobType,
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      file_key: fileKey,
      snapshot_key: snapshotKey,
    });

    if (error) {
      await Promise.all([
        s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey })),
        s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: snapshotKey })),
      ]);
      return NextResponse.json({ error: "The CV record could not be saved." }, { status: 400 });
    }

    return NextResponse.json({ id: uploadId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The uploaded files could not be verified." }, { status: 400 });
  }
}