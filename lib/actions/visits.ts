"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { visits, leads, activities } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, count, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { getOrCreateUser } from "./users";

export interface VisitFilters {
  period?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getVisits(filters: VisitFilters = {}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const { period, dateFrom, dateTo } = filters;
    const now = new Date();

    const conditions = [eq(visits.userId, user.data.id)];

    if (period === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 86400000);
      conditions.push(gte(visits.createdAt, start), lte(visits.createdAt, end));
    } else if (period === "week") {
      conditions.push(
        gte(visits.createdAt, startOfWeek(now, { weekStartsOn: 1 })),
        lte(visits.createdAt, endOfWeek(now, { weekStartsOn: 1 })),
      );
    } else if (period === "month") {
      conditions.push(
        gte(visits.createdAt, startOfMonth(now)),
        lte(visits.createdAt, endOfMonth(now)),
      );
    } else if (dateFrom) {
      conditions.push(gte(visits.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(visits.createdAt, new Date(dateTo)));
    }

    const allVisits = await db
      .select({
        id: visits.id,
        leadId: visits.leadId,
        userId: visits.userId,
        checkInTime: visits.checkInTime,
        checkOutTime: visits.checkOutTime,
        checkInLat: visits.checkInLat,
        checkInLng: visits.checkInLng,
        checkInAddress: visits.checkInAddress,
        checkOutLat: visits.checkOutLat,
        checkOutLng: visits.checkOutLng,
        durationMinutes: visits.durationMinutes,
        notes: visits.notes,
        createdAt: visits.createdAt,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
        leadCity: leads.city,
        leadSiteAddress: leads.siteAddress,
      })
      .from(visits)
      .leftJoin(leads, eq(visits.leadId, leads.id))
      .where(and(...conditions))
      .orderBy(desc(visits.createdAt));

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const [visitsToday, visitsThisWeek, visitsThisMonth] = await Promise.all([
      db.$count(visits, and(eq(visits.userId, user.data.id), gte(visits.createdAt, todayStart))),
      db.$count(visits, and(eq(visits.userId, user.data.id), gte(visits.createdAt, weekStart))),
      db.$count(visits, and(eq(visits.userId, user.data.id), gte(visits.createdAt, monthStart))),
    ]);

    const avgDuration = await db
      .select({ avg: sql<number>`COALESCE(AVG(duration_minutes), 0)` })
      .from(visits)
      .where(and(eq(visits.userId, user.data.id), sql`duration_minutes IS NOT NULL`));

    const mostVisited = await db
      .select({
        leadId: visits.leadId,
        count: count(),
        companyName: leads.companyName,
      })
      .from(visits)
      .leftJoin(leads, eq(visits.leadId, leads.id))
      .where(eq(visits.userId, user.data.id))
      .groupBy(visits.leadId, leads.companyName)
      .orderBy(sql`count DESC`)
      .limit(1);

    const activeVisit = await db
      .select({
        id: visits.id,
        leadId: visits.leadId,
        checkInTime: visits.checkInTime,
        checkInLat: visits.checkInLat,
        checkInLng: visits.checkInLng,
        checkInAddress: visits.checkInAddress,
        notes: visits.notes,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
        leadSiteAddress: leads.siteAddress,
      })
      .from(visits)
      .leftJoin(leads, eq(visits.leadId, leads.id))
      .where(and(eq(visits.userId, user.data.id), isNull(visits.checkOutTime)))
      .limit(1);

    return {
      success: true as const,
      data: {
        visits: allVisits,
        activeVisit: activeVisit[0] || null,
        stats: {
          visitsToday,
          visitsThisWeek,
          visitsThisMonth,
          avgDuration: Math.round(Number(avgDuration[0].avg)),
          mostVisitedLead: mostVisited[0]
            ? { name: mostVisited[0].companyName, count: Number(mostVisited[0].count) }
            : null,
        },
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function checkIn(leadId: string, lat?: string, lng?: string, address?: string, notes?: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    if (!leadId) return { success: false as const, data: null, error: "leadId is required" };

    const [visit] = await db
      .insert(visits)
      .values({
        leadId,
        userId: user.data.id,
        checkInTime: new Date(),
        checkInLat: lat || null,
        checkInLng: lng || null,
        checkInAddress: address || null,
        notes: notes || null,
      })
      .returning();

    await db.insert(activities).values({
      leadId,
      userId: user.data.id,
      type: "visit",
      description: address ? `Checked in at ${address}` : "Site visit check-in",
    });

    revalidatePath("/visits");
    revalidatePath(`/leads/${leadId}`);
    return { success: true as const, data: visit, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function checkOut(visitId: string, lat?: string, lng?: string, notes?: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const [visit] = await db
      .select()
      .from(visits)
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit) return { success: false as const, data: null, error: "Visit not found" };

    const checkOutTime = new Date();
    const durationMinutes = visit.checkInTime
      ? Math.round((checkOutTime.getTime() - new Date(visit.checkInTime).getTime()) / 60000)
      : null;

    const [updated] = await db
      .update(visits)
      .set({
        checkOutTime,
        checkOutLat: lat || null,
        checkOutLng: lng || null,
        durationMinutes,
        notes: notes || visit.notes,
      })
      .where(eq(visits.id, visitId))
      .returning();

    revalidatePath("/visits");
    revalidatePath(`/leads/${visit.leadId}`);
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getActiveVisit(userId?: string) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const activeVisit = await db
      .select({
        id: visits.id,
        leadId: visits.leadId,
        checkInTime: visits.checkInTime,
        checkInLat: visits.checkInLat,
        checkInLng: visits.checkInLng,
        checkInAddress: visits.checkInAddress,
        notes: visits.notes,
        leadCompanyName: leads.companyName,
        leadContactPerson: leads.contactPerson,
        leadSiteAddress: leads.siteAddress,
      })
      .from(visits)
      .leftJoin(leads, eq(visits.leadId, leads.id))
      .where(and(eq(visits.userId, targetUserId), isNull(visits.checkOutTime)))
      .limit(1);

    return { success: true as const, data: activeVisit[0] || null, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getVisitStats(userId?: string, dateRange?: { from: Date; to: Date }) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;
    const from = dateRange?.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = dateRange?.to || new Date();

    const [totalVisits, periodVisits] = await Promise.all([
      db.$count(visits, eq(visits.userId, targetUserId)),
      db.$count(visits, and(eq(visits.userId, targetUserId), gte(visits.createdAt, from), lte(visits.createdAt, to))),
    ]);

    const avgDuration = await db
      .select({ avg: sql<number>`COALESCE(AVG(duration_minutes), 0)` })
      .from(visits)
      .where(and(eq(visits.userId, targetUserId), sql`duration_minutes IS NOT NULL`));

    return {
      success: true as const,
      data: {
        totalVisits,
        periodVisits,
        avgDuration: Math.round(Number(avgDuration[0].avg)),
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
