import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { visits, activities, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const existing = await db
    .select()
    .from(visits)
    .where(and(eq(visits.id, id), eq(visits.userId, user.id)))
    .limit(1);
  if (!existing.length) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

  const checkInTime = existing[0].checkInTime;
  const checkOutTime = new Date();
  const durationMinutes = checkInTime
    ? Math.round((checkOutTime.getTime() - new Date(checkInTime).getTime()) / 60000)
    : null;

  const [updated] = await db
    .update(visits)
    .set({
      checkOutTime,
      checkOutLat: body.checkOutLat || null,
      checkOutLng: body.checkOutLng || null,
      durationMinutes,
      notes: body.notes || existing[0].notes,
    })
    .where(eq(visits.id, id))
    .returning();

  await db.insert(activities).values({
    leadId: existing[0].leadId,
    userId: user.id,
    type: "visit",
    description: `Site visit completed (${durationMinutes} min)`,
    metadata: { durationMinutes, visitId: id },
  });

  return NextResponse.json(updated);
}
