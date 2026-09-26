import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getRequestIdentity, hasSameOrigin } from "@/lib/authz";
import { createAdminClient } from "@/lib/admin";
import { getS3Bucket, getS3Client } from "@/lib/s3";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not allowed." }, { status: 403 });
  }

  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "CV not found." }, { status: 404 });

  const { data: cv } = await identity.supabase
    .from("cvs")
    .select("id, user_id, file_key, snapshot_key")
    .eq("id", id)
    .maybeSingle();

  if (!cv || cv.user_id !== identity.userId) {
    return NextResponse.json({ error: "CV not found." }, { status: 404 });
  }

  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "CV metadata storage is not configured yet." }, { status: 503 });
  }

  try {
    await Promise.all([
      getS3Client().send(new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: cv.file_key })),
      getS3Client().send(new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: cv.snapshot_key })),
    ]);
  } catch {
    return NextResponse.json({ error: "The CV could not be removed from storage. Please try again." }, { status: 503 });
  }

  const { error } = await createAdminClient().from("cvs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "The files were removed, but the CV record could not be cleared." }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}