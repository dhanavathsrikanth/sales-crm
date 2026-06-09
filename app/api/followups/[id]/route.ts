import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { followups, activities, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const existing = await db.select().from(followups).where(eq(followups.id, id)).limit(1);
  if (!existing.length) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });

  if (body.status === "completed") {
    const [updated] = await db
      .update(followups)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(followups.id, id))
      .returning();

    await db.insert(activities).values({
      leadId: existing[0].leadId,
      userId: user.id,
      type: "followup_added",
      description: `Follow-up marked as completed`,
      metadata: { followupId: id },
    });

    return NextResponse.json(updated);
  }

  if (body.followupDate || body.followupTime) {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.followupDate) updateData.followupDate = body.followupDate;
    if (body.followupTime) updateData.followupTime = body.followupTime;

    const [updated] = await db
      .update(followups)
      .set({ ...updateData, status: "pending" })
      .where(eq(followups.id, id))
      .returning();

    await db.insert(activities).values({
      leadId: existing[0].leadId,
      userId: user.id,
      type: "followup_added",
      description: `Follow-up rescheduled`,
      metadata: { followupId: id },
    });

    return NextResponse.json(updated);
  }

  const [updated] = await db
    .update(followups)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(followups.id, id))
    .returning();

  return NextResponse.json(updated);
}
