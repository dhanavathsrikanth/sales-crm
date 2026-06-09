import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { callLog, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const existing = await db
    .select()
    .from(callLog)
    .where(and(eq(callLog.id, id), eq(callLog.userId, user.id)))
    .limit(1);
  if (!existing.length) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const [updated] = await db
    .update(callLog)
    .set({
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.contactId !== undefined && { contactId: body.contactId }),
      ...(body.leadId !== undefined && { leadId: body.leadId }),
      ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber }),
    })
    .where(eq(callLog.id, id))
    .returning();

  return NextResponse.json(updated);
}
