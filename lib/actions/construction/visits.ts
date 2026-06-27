"use server";

import { db } from "@/lib/db";
import { constrVisits, constrLeads, constrCustomers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "../users";

export async function getVisits() {
  return db
    .select({
      id: constrVisits.id,
      checkInTime: constrVisits.checkInTime,
      checkOutTime: constrVisits.checkOutTime,
      checkInAddress: constrVisits.checkInAddress,
      durationMinutes: constrVisits.durationMinutes,
      notes: constrVisits.notes,
      createdAt: constrVisits.createdAt,
      projectName: constrLeads.projectName,
      customerName: constrCustomers.name,
    })
    .from(constrVisits)
    .leftJoin(constrLeads, eq(constrVisits.leadId, constrLeads.id))
    .leftJoin(constrCustomers, eq(constrLeads.customerId, constrCustomers.id))
    .orderBy(desc(constrVisits.createdAt));
}

export async function checkIn(leadId: string, lat: number, lng: number, address: string, notes?: string) {
  const { userId } = await auth();
  const user = await getOrCreateUser(userId ?? undefined);
  if (!user.data) throw new Error("Unauthorized");

  const [visit] = await db.insert(constrVisits).values({
    leadId: leadId as any,
    userId: user.data.id,
    checkInTime: new Date(),
    checkInLat: lat.toString(),
    checkInLng: lng.toString(),
    checkInAddress: address,
    notes,
  }).returning();

  return visit;
}

export async function checkOut(visitId: string, notes?: string) {
  const [visit] = await db.select().from(constrVisits).where(eq(constrVisits.id, visitId));
  if (!visit) throw new Error("Visit not found");

  const checkIn = visit.checkInTime ? new Date(visit.checkInTime) : new Date();
  const duration = Math.round((Date.now() - checkIn.getTime()) / 60000);

  const [updated] = await db
    .update(constrVisits)
    .set({
      checkOutTime: new Date(),
      durationMinutes: duration,
      notes: notes || visit.notes,
    })
    .where(eq(constrVisits.id, visitId))
    .returning();

  return updated;
}
