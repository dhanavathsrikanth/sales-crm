import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, activities, stageHistory, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const { stage, notes } = await req.json();
  if (!stage) return NextResponse.json({ error: "Stage is required" }, { status: 400 });

  const [existing] = await db
    .select({ stage: leads.stage, companyName: leads.companyName })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const updateData: Record<string, any> = { stage, updatedAt: new Date() };
  if (stage === "lost") updateData.lostReason = notes;

  const [updated] = await db
    .update(leads)
    .set(updateData)
    .where(eq(leads.id, id))
    .returning();

  const activityType = stage === "won" ? "won" : stage === "lost" ? "lost" : "stage_changed";
  const activityDesc =
    stage === "won"
      ? `Lead won: ${existing.companyName}`
      : stage === "lost"
        ? `Lead lost: ${existing.companyName}${notes ? ` - ${notes}` : ""}`
        : `Stage changed from ${existing.stage} to ${stage}`;

  await Promise.all([
    db.insert(activities).values({
      leadId: id,
      userId: user.id,
      type: activityType as any,
      description: activityDesc,
      metadata: { fromStage: existing.stage, toStage: stage, notes },
    }),
    db.insert(stageHistory).values({
      leadId: id,
      userId: user.id,
      fromStage: existing.stage,
      toStage: stage,
      notes,
    }),
  ]);

  return NextResponse.json(updated);
}
