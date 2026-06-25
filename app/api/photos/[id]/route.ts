import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { photos, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash, createHmac } from "crypto";

function hmac(key: string | Buffer, str: string) {
  return createHmac("sha256", key).update(str).digest();
}

async function deleteFromR2(key: string) {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET_NAME!;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
  const date = amzDate.slice(0, 8);

  const bodyHash = createHash("sha256").update("").digest("hex");

  const canonicalRequest = [
    "DELETE",
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

  await fetch(endpoint, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": bodyHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), eq(photos.userId, user.id)))
    .limit(1);
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  try {
    const publicUrlBase = process.env.R2_PUBLIC_URL;
    if (publicUrlBase && photo.url.startsWith(publicUrlBase)) {
      const key = photo.url.replace(publicUrlBase + "/", "");
      await deleteFromR2(key);
    }
  } catch (err) {
    console.error("R2 delete error:", err);
  }

  await db.delete(photos).where(eq(photos.id, id));

  return NextResponse.json({ success: true });
}
