import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { photos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createHash, createHmac } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

function hmac(key: string | Buffer, str: string) {
  return createHmac("sha256", key).update(str).digest();
}

async function uploadToR2(
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string,
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
  const date = amzDate.slice(0, 8);

  const bodyHash = createHash("sha256").update(Buffer.from(body)).digest("hex");

  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    "",
    `host:${host}`,
    `x-amz-content-sha256:${bodyHash}`,
    `x-amz-date:${amzDate}`,
    "",
    "host;x-amz-content-sha256;x-amz-date",
    bodyHash,
  ].join("\n");

  const credentialScope = `${date}/auto/s3/aws4_request`;

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const dateKey = hmac(`AWS4${secretAccessKey}`, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmac(signingKey, stringToSign).toString("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    "SignedHeaders=host;x-amz-content-sha256;x-amz-date",
    `Signature=${signature}`,
  ].join(",");

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "x-amz-content-sha256": bodyHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
      "Content-Type": contentType,
    },
    body: new Blob([body as BlobPart], { type: contentType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const leadId = formData.get("leadId") as string | null;
    const type = (formData.get("type") as string) || "site";
    const caption = (formData.get("caption") as string) || null;
    const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
    const lng = formData.get("lng") ? Number(formData.get("lng")) : null;
    const address = (formData.get("address") as string) || null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP, PDF`,
      }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const key = `leads/${leadId}/${randomUUID()}.${ext}`;
    const body = new Uint8Array(await file.arrayBuffer());

    await uploadToR2(bucket, key, body, file.type, accountId, accessKeyId, secretAccessKey);

    const url = `${publicUrlBase}/${key}`;

    const [record] = await db
      .insert(photos)
      .values({
        leadId,
        userId: user.id,
        url,
        fileName: file.name,
        fileSize: file.size,
        type: type as any,
        caption,
        latitude: lat ? String(lat) : null,
        longitude: lng ? String(lng) : null,
        address,
        gpsAccuracy: null,
      })
      .returning();

    return NextResponse.json({ ...record, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
