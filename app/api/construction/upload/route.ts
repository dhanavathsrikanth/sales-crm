import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { constrProducts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createHash, createHmac } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

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
    const productId = formData.get("productId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP`,
      }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 5MB" }, { status: 400 });
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
    const key = `products/${productId}/${randomUUID()}.${ext}`;
    const body = new Uint8Array(await file.arrayBuffer());

    await uploadToR2(bucket, key, body, file.type, accountId, accessKeyId, secretAccessKey);

    const url = `${publicUrlBase}/${key}`;

    await db.update(constrProducts).set({ imageUrl: url }).where(eq(constrProducts.id, productId));

    return NextResponse.json({ url, success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Product upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
