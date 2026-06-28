"use server";

import { db } from "@/lib/db";
import { constrFollowups, constrLeads, constrCustomers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getOrCreateUser } from "../users";

export async function getFollowups(filters?: { status?: string; leadId?: string }) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(constrFollowups.status, filters.status as any));
  }
  if (filters?.leadId) {
    conditions.push(eq(constrFollowups.leadId, filters.leadId as any));
  }

  return db
    .select({
      id: constrFollowups.id,
      followupDate: constrFollowups.followupDate,
      followupTime: constrFollowups.followupTime,
      type: constrFollowups.type,
      priority: constrFollowups.priority,
      status: constrFollowups.status,
      notes: constrFollowups.notes,
      completedAt: constrFollowups.completedAt,
      createdAt: constrFollowups.createdAt,
      leadId: constrFollowups.leadId,
      projectName: constrLeads.projectName,
      customerName: constrCustomers.name,
    })
    .from(constrFollowups)
    .leftJoin(constrLeads, eq(constrFollowups.leadId, constrLeads.id))
    .leftJoin(constrCustomers, eq(constrLeads.customerId, constrCustomers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(constrFollowups.followupDate));
}

export async function createFollowup(data: {
  leadId: string;
  followupDate: string;
  followupTime?: string;
  type?: string;
  priority?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  const user = await getOrCreateUser(userId ?? undefined);
  if (!user.data) throw new Error("Unauthorized");

  const [followup] = await db.insert(constrFollowups).values({
    leadId: data.leadId as any,
    userId: user.data.id,
    followupDate: data.followupDate,
    followupTime: data.followupTime,
    type: data.type as any,
    priority: data.priority as any,
    notes: data.notes,
  }).returning();
  return followup;
}

export async function completeFollowup(id: string) {
  const [followup] = await db
    .update(constrFollowups)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(constrFollowups.id, id))
    .returning();
  return followup;
}
