"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  followups,
  leads,
  constrFollowups,
  constrLeads,
  constrCustomers,
} from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { getOrCreateUser } from "./users";
import { format } from "date-fns";

export interface ScheduledItem {
  id: string;
  followupDate: string | null;
  followupTime: string | null;
  type: string | null;
  priority: string | null;
  notes: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
  source: string;
}

export async function getTodayScheduledItems() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const todayStr = format(new Date(), "yyyy-MM-dd");

    const main = await db
      .select({
        id: followups.id,
        followupDate: followups.followupDate,
        followupTime: followups.followupTime,
        type: followups.type,
        priority: followups.priority,
        notes: followups.notes,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
        source: sql<string>`'main'`,
      })
      .from(followups)
      .leftJoin(leads, eq(followups.leadId, leads.id))
      .where(
        and(
          eq(followups.userId, user.data.id),
          eq(followups.followupDate, todayStr),
          eq(followups.status, "pending"),
        ),
      )
      .orderBy(asc(followups.followupTime));

    const construction = await db
      .select({
        id: constrFollowups.id,
        followupDate: constrFollowups.followupDate,
        followupTime: constrFollowups.followupTime,
        type: constrFollowups.type,
        priority: constrFollowups.priority,
        notes: constrFollowups.notes,
        leadCompanyName: constrCustomers.name,
        leadContactPerson: constrLeads.projectName,
        source: sql<string>`'construction'`,
      })
      .from(constrFollowups)
      .leftJoin(constrLeads, eq(constrFollowups.leadId, constrLeads.id))
      .leftJoin(constrCustomers, eq(constrLeads.customerId, constrCustomers.id))
      .where(
        and(
          eq(constrFollowups.userId, user.data.id),
          eq(constrFollowups.followupDate, todayStr),
          eq(constrFollowups.status, "pending"),
        ),
      )
      .orderBy(asc(constrFollowups.followupTime));

    return { success: true as const, data: [...main, ...construction], error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
