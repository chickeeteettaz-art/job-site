import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/authz";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; asset: string }> },
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id, asset } = await params;
  if (!UUID_PATTERN.test(id) || (asset !== "file" && asset !== "snapshot")) {
    return NextResponse.json({ error: "CV not found." }, { status: 404 });
  }

  const { data: cv, error } = await identity.supabase
    .from("cvs")
    .select("id, user_id, file_key, snapshot_key, file_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !cv) return NextResponse.json({ error: "CV not found." }, { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: asset === "snapshot" ? cv.snapshot_key : cv.file_key,
    ...(asset === "file"
      ? {
          ResponseContentDisposition: download
            ? `attachment; filename="${cv.file_name.replace(/["\\\r\n]/g, "_")}"`
            : `inline; filename="${cv.file_name.replace(/["\\\r\n]/g, "_")}"`,
          ResponseContentType: "application/pdf",
        }
      : { ResponseContentType: "image/png" }),
  });

  try {
    const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 60 });
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json({ error: "CV storage is unavailable." }, { status: 503 });
  }
}