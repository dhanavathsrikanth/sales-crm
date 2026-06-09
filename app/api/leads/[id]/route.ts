import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, activities, followups, visits, photos, stageHistory, customFieldValues, customFields } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const leadFollowups = await db
    .select()
    .from(followups)
    .where(eq(followups.leadId, id))
    .orderBy(desc(followups.createdAt));

  const leadVisits = await db
    .select()
    .from(visits)
    .where(eq(visits.leadId, id))
    .orderBy(desc(visits.createdAt));

  const leadPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.leadId, id))
    .orderBy(desc(photos.createdAt));

  const leadActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.createdAt));

  const leadStageHistory = await db
    .select()
    .from(stageHistory)
    .where(eq(stageHistory.leadId, id))
    .orderBy(desc(stageHistory.createdAt));

  const leadCustomFieldValues = await db
    .select()
    .from(customFieldValues)
    .where(eq(customFieldValues.leadId, id));

  const userCustomFields = await db
    .select()
    .from(customFields)
    .where(eq(customFields.userId, lead.userId!));

  const fieldMap = Object.fromEntries(userCustomFields.map((f) => [f.id, f]));
  const enrichedCustomFieldValues = leadCustomFieldValues.map((cfv) => ({
    ...cfv,
    fieldName: fieldMap[cfv.fieldId]?.fieldName ?? null,
    fieldLabel: fieldMap[cfv.fieldId]?.fieldLabel ?? null,
    fieldType: fieldMap[cfv.fieldId]?.fieldType ?? null,
    options: fieldMap[cfv.fieldId]?.options ?? null,
  }));

  return NextResponse.json({
    ...lead,
    followups: leadFollowups,
    visits: leadVisits,
    photos: leadPhotos,
    activities: leadActivities,
    stageHistory: leadStageHistory,
    customFieldValues: enrichedCustomFieldValues,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { customFieldValues: cfvBody, ...leadBody } = body;

  const [updated] = await db
    .update(leads)
    .set({ ...leadBody, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (cfvBody && Array.isArray(cfvBody)) {
    for (const cfv of cfvBody) {
      if (cfv.fieldId) {
        const [existing] = await db
          .select()
          .from(customFieldValues)
          .where(and(eq(customFieldValues.leadId, id), eq(customFieldValues.fieldId, cfv.fieldId)))
          .limit(1);
        if (existing) {
          await db
            .update(customFieldValues)
            .set({ value: String(cfv.value ?? ""), updatedAt: new Date() })
            .where(eq(customFieldValues.id, existing.id));
        } else {
          await db.insert(customFieldValues).values({
            leadId: id,
            fieldId: cfv.fieldId,
            value: String(cfv.value ?? ""),
          });
        }
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [deleted] = await db
    .delete(leads)
    .where(eq(leads.id, id))
    .returning({ id: leads.id, companyName: leads.companyName });

  if (!deleted) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json({ message: `Lead ${deleted.companyName} deleted` });
}
