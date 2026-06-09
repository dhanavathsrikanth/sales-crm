"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { followups, leads, activities } from "@/lib/db/schema";
import { eq, and, gte, lte, asc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { getOrCreateUser } from "./users";

export interface FollowupFilters {
  tab?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  leadId?: string;
  viewDate?: string;
}

export async function getFollowups(filters: FollowupFilters = {}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const { tab, status, dateFrom, dateTo, leadId, viewDate } = filters;
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    const conditions = [eq(followups.userId, user.data.id)];

    if (leadId) conditions.push(eq(followups.leadId, leadId));
    if (viewDate) conditions.push(eq(followups.followupDate, viewDate));

    if (tab === "today") {
      conditions.push(eq(followups.followupDate, todayStr));
    } else if (tab === "upcoming") {
      conditions.push(gte(followups.followupDate, todayStr), eq(followups.status, "pending"));
    } else if (tab === "completed") {
      conditions.push(eq(followups.status, "completed"));
    } else if (tab === "missed") {
      conditions.push(eq(followups.status, "pending"), sql`${followups.followupDate} < ${todayStr}`);
    } else if (status) {
      conditions.push(eq(followups.status, status as any));
    }

    const data = await db
      .select({
        id: followups.id,
        leadId: followups.leadId,
        userId: followups.userId,
        followupDate: followups.followupDate,
        followupTime: followups.followupTime,
        type: followups.type,
        priority: followups.priority,
        status: followups.status,
        notes: followups.notes,
        completedAt: followups.completedAt,
        createdAt: followups.createdAt,
        updatedAt: followups.updatedAt,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
        leadBuilderName: leads.builderName,
      })
      .from(followups)
      .leftJoin(leads, eq(followups.leadId, leads.id))
      .where(and(...conditions))
      .orderBy(asc(followups.followupDate), asc(followups.followupTime));

    const daysWithFollowups = await db
      .select({ date: followups.followupDate })
      .from(followups)
      .where(eq(followups.userId, user.data.id))
      .groupBy(followups.followupDate);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const todayStats = await db
      .select({ status: followups.status, count: count() })
      .from(followups)
      .where(and(eq(followups.userId, user.data.id), eq(followups.followupDate, todayStr)))
      .groupBy(followups.status);

    const weekTotal = await db.$count(followups, and(
      eq(followups.userId, user.data.id),
      gte(followups.followupDate, format(weekStart, "yyyy-MM-dd")),
      lte(followups.followupDate, format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")),
    ));

    return {
      success: true as const,
      data: {
        followups: data,
        daysWithFollowups: daysWithFollowups.map((d) => d.date),
        stats: {
          todayPending: Number(todayStats.find((s) => s.status === "pending")?.count || 0),
          todayCompleted: Number(todayStats.find((s) => s.status === "completed")?.count || 0),
          weekTotal,
        },
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function createFollowup(data: {
  leadId: string;
  followupDate: string;
  followupTime?: string;
  type?: string;
  priority?: string;
  notes?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    if (!data.leadId || !data.followupDate) {
      return { success: false as const, data: null, error: "leadId and followupDate are required" };
    }

    const [followup] = await db
      .insert(followups)
      .values({
        leadId: data.leadId,
        userId: user.data.id,
        followupDate: data.followupDate,
        followupTime: data.followupTime || null,
        type: (data.type as any) || "call",
        priority: (data.priority as any) || "medium",
        status: "pending",
        notes: data.notes || null,
      })
      .returning();

    await db.insert(activities).values({
      leadId: data.leadId,
      userId: user.data.id,
      type: "followup_added",
      description: `Follow-up scheduled for ${format(new Date(data.followupDate), "MMM d, yyyy")}`,
      metadata: { followupId: followup.id, type: data.type, priority: data.priority },
    });

    revalidatePath("/followups");
    revalidatePath(`/leads/${data.leadId}`);
    return { success: true as const, data: followup, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function updateFollowup(id: string, data: {
  followupDate?: string;
  followupTime?: string;
  type?: string;
  priority?: string;
  notes?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [updated] = await db
      .update(followups)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(followups.id, id))
      .returning();

    if (!updated) return { success: false as const, data: null, error: "Follow-up not found" };

    revalidatePath("/followups");
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function completeFollowup(id: string, notes?: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const [followup] = await db
      .select()
      .from(followups)
      .where(eq(followups.id, id))
      .limit(1);

    if (!followup) return { success: false as const, data: null, error: "Follow-up not found" };

    const [updated] = await db
      .update(followups)
      .set({
        status: "completed",
        completedAt: new Date(),
        notes: notes || followup.notes,
        updatedAt: new Date(),
      })
      .where(eq(followups.id, id))
      .returning();

    await db.insert(activities).values({
      leadId: followup.leadId,
      userId: user.data.id,
      type: "followup_added",
      description: `Follow-up completed`,
      metadata: { followupId: id, completed: true, notes },
    });

    revalidatePath("/followups");
    revalidatePath(`/leads/${followup.leadId}`);
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getFollowupStats(userId?: string) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    const [total, pending, completed, todayPending, todayCompleted] = await Promise.all([
      db.$count(followups, eq(followups.userId, targetUserId)),
      db.$count(followups, and(eq(followups.userId, targetUserId), eq(followups.status, "pending"))),
      db.$count(followups, and(eq(followups.userId, targetUserId), eq(followups.status, "completed"))),
      db.$count(followups, and(eq(followups.userId, targetUserId), eq(followups.status, "pending"), eq(followups.followupDate, todayStr))),
      db.$count(followups, and(eq(followups.userId, targetUserId), eq(followups.status, "completed"), eq(followups.followupDate, todayStr))),
    ]);

    return {
      success: true as const,
      data: { total, pending, completed, todayPending, todayCompleted },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getTodayFollowups(userId?: string) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const data = await db
      .select({
        id: followups.id,
        leadId: followups.leadId,
        followupTime: followups.followupTime,
        type: followups.type,
        priority: followups.priority,
        status: followups.status,
        notes: followups.notes,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
      })
      .from(followups)
      .leftJoin(leads, eq(followups.leadId, leads.id))
      .where(and(eq(followups.userId, targetUserId), eq(followups.followupDate, todayStr)))
      .orderBy(asc(followups.followupTime));

    return { success: true as const, data, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
