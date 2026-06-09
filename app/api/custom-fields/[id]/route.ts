import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { customFields, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(customFields)
    .set({
      ...(body.fieldLabel && { fieldLabel: body.fieldLabel }),
      ...(body.fieldName && { fieldName: body.fieldName }),
      ...(body.fieldType && { fieldType: body.fieldType }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .where(and(eq(customFields.id, id), eq(customFields.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Field not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const [deleted] = await db
    .delete(customFields)
    .where(and(eq(customFields.id, id), eq(customFields.userId, user.id)))
    .returning({ id: customFields.id });

  if (!deleted) return NextResponse.json({ error: "Field not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
