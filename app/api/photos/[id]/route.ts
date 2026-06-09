import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { photos, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
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
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;
    if (bucket && publicUrlBase && photo.url.startsWith(publicUrlBase)) {
      const key = photo.url.replace(publicUrlBase + "/", "");
      const client = getR2Client();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  } catch (err) {
    console.error("R2 delete error:", err);
  }

  await db.delete(photos).where(eq(photos.id, id));

  return NextResponse.json({ success: true });
}
