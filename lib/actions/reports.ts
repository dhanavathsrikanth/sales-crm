"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  leads, visits, followups, activities, users,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count, desc, isNotNull } from "drizzle-orm";
import {
  startOfMonth, endOfMonth, subMonths, format,
} from "date-fns";
import { getOrCreateUser } from "./users";

export async function getDashboardData(userId?: string) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const userFilter = eq(leads.userId, targetUserId);

    const [
      leadsCreatedThisMonth,
      visitsThisMonth,
      dealsWonThisMonth,
    ] = await Promise.all([
      db.$count(leads, and(userFilter, gte(leads.createdAt, monthStart), lte(leads.createdAt, monthEnd))),
      db.$count(visits, and(eq(visits.userId, targetUserId), gte(visits.createdAt, monthStart), lte(visits.createdAt, monthEnd))),
      db.$count(leads, and(userFilter, eq(leads.stage, "won"), gte(leads.createdAt, monthStart), lte(leads.createdAt, monthEnd))),
    ]);

    const m3Pipeline = await db
      .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
      .from(leads)
      .where(and(userFilter, sql`${leads.stage} NOT IN ('won', 'lost')`, sql`estimated_m3 IS NOT NULL`));

    const pendingFollowups = await db
      .$count(followups, and(eq(followups.userId, targetUserId), eq(followups.status, "pending")));

    const overdueCount = await db
      .$count(followups, and(
        eq(followups.userId, targetUserId),
        eq(followups.status, "pending"),
        sql`${followups.followupDate} < ${todayStr}`,
      ));

    return {
      success: true as const,
      data: {
        leadsCreatedThisMonth,
        visitsThisMonth,
        dealsWonThisMonth,
        m3Pipeline: Number(m3Pipeline[0].total),
        pendingFollowups,
        overdueFollowups: overdueCount,
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getReportData(userId?: string, dateRange?: { from: Date; to: Date }) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const from = dateRange?.from || startOfMonth(new Date());
    const to = dateRange?.to || endOfMonth(new Date());
    to.setHours(23, 59, 59, 999);

    const userFilter = eq(leads.userId, user.data.id);
    const periodFilter = and(gte(leads.createdAt, from), lte(leads.createdAt, to));

    const [leadsCreated, leadsWon, leadsLost] = await Promise.all([
      db.$count(leads, and(userFilter, periodFilter)),
      db.$count(leads, and(userFilter, periodFilter, eq(leads.stage, "won"))),
      db.$count(leads, and(userFilter, periodFilter, eq(leads.stage, "lost"))),
    ]);

    const conversionRate = leadsCreated > 0 ? Math.round((leadsWon / leadsCreated) * 100) : 0;

    const totalVisits = await db.$count(visits, and(
      eq(visits.userId, user.data.id),
      gte(visits.createdAt, from),
      lte(visits.createdAt, to),
    ));

    const followupsCompleted = await db.$count(followups, and(
      eq(followups.userId, user.data.id),
      eq(followups.status, "completed"),
      gte(followups.createdAt, from),
      lte(followups.createdAt, to),
    ));

    const totalM3 = await db
      .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
      .from(leads)
      .where(and(userFilter, eq(leads.stage, "won"), sql`estimated_m3 IS NOT NULL`));

    const estimatedRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(estimated_value), 0)` })
      .from(leads)
      .where(and(userFilter, eq(leads.stage, "won"), sql`estimated_value IS NOT NULL`));

    // Monthly trend (last 12 months)
    const monthlyData: { month: string; created: number; won: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(new Date(), i));
      const mEnd = endOfMonth(subMonths(new Date(), i));
      const [created, won] = await Promise.all([
        db.$count(leads, and(userFilter, gte(leads.createdAt, mStart), lte(leads.createdAt, mEnd))),
        db.$count(leads, and(userFilter, eq(leads.stage, "won"), gte(leads.createdAt, mStart), lte(leads.createdAt, mEnd))),
      ]);
      monthlyData.push({ month: format(mStart, "MMM yy"), created, won });
    }

    // Stage funnel
    const stageOrder = ["new", "contacted", "meeting_scheduled", "site_visited", "requirement_received", "quotation_sent", "negotiation", "trial_order", "won", "lost"];
    const stageLabels: Record<string, string> = {
      new: "New", contacted: "Contacted", meeting_scheduled: "Meeting",
      site_visited: "Site Visit", requirement_received: "Requirement",
      quotation_sent: "Quotation", negotiation: "Negotiation",
      trial_order: "Trial Order", won: "Won", lost: "Lost",
    };
    const stageData = await db
      .select({ stage: leads.stage, count: count() })
      .from(leads)
      .where(userFilter)
      .groupBy(leads.stage);
    const stageCounts = Object.fromEntries(stageData.map((s) => [s.stage, Number(s.count)]));
    const stageFunnel = stageOrder
      .filter((s) => s !== "lost")
      .map((s) => ({ name: stageLabels[s] || s, value: stageCounts[s] || 0 }))
      .filter((s) => s.value > 0);

    // Follow-up type distribution
    const followupTypeData = await db
      .select({ type: followups.type, count: count() })
      .from(followups)
      .where(and(eq(followups.userId, user.data.id), gte(followups.createdAt, from), lte(followups.createdAt, to)))
      .groupBy(followups.type);
    const followupTypes = followupTypeData.map((f) => ({
      name: f.type ? f.type.charAt(0).toUpperCase() + f.type.slice(1) : "Other",
      value: Number(f.count),
    }));

    // City distribution
    const cityData = await db
      .select({ city: leads.city, count: count() })
      .from(leads)
      .where(and(userFilter, sql`city IS NOT NULL`))
      .groupBy(leads.city)
      .orderBy(sql`count DESC`)
      .limit(10);
    const cityDistribution = cityData.map((c) => ({ name: c.city || "Unknown", value: Number(c.count) }));

    // Project type breakdown
    const projectTypeData = await db
      .select({ type: leads.projectType, count: count() })
      .from(leads)
      .where(and(userFilter, sql`project_type IS NOT NULL`))
      .groupBy(leads.projectType);
    const projectTypes = projectTypeData.map((p) => ({
      name: p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Other",
      value: Number(p.count),
    }));

    // Grade demand
    const allGradeLeads = await db
      .select({ gradeRequirements: leads.gradeRequirements })
      .from(leads)
      .where(and(userFilter, sql`grade_requirements IS NOT NULL`));
    const gradeCounts: Record<string, number> = {};
    for (const l of allGradeLeads) {
      if (l.gradeRequirements) {
        for (const g of l.gradeRequirements as string[]) {
          gradeCounts[g] = (gradeCounts[g] || 0) + 1;
        }
      }
    }
    const gradeDemand = Object.entries(gradeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Top leads by M3
    const topLeads = await db
      .select({
        id: leads.id,
        companyName: leads.companyName,
        stage: leads.stage,
        estimatedM3: leads.estimatedM3,
        estimatedValue: leads.estimatedValue,
        city: leads.city,
        contactPerson: leads.contactPerson,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(and(userFilter, sql`estimated_m3 IS NOT NULL`))
      .orderBy(desc(leads.estimatedM3))
      .limit(10);

    const topLeadsWithActivity = await Promise.all(
      topLeads.map(async (l) => {
        const [recent] = await db
          .select({ description: activities.description, createdAt: activities.createdAt })
          .from(activities)
          .where(eq(activities.leadId, l.id))
          .orderBy(desc(activities.createdAt))
          .limit(1);
        return {
          ...l,
          estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
          estimatedM3: l.estimatedM3 ? Number(l.estimatedM3) : null,
          lastActivity: recent?.description || null,
          lastActivityDate: recent?.createdAt || null,
        };
      }),
    );

    return {
      success: true as const,
      data: {
        summary: {
          leadsCreated,
          leadsWon,
          leadsLost,
          conversionRate,
          totalVisits,
          followupsCompleted,
          totalPotentialM3: Number(totalM3[0].total),
          estimatedRevenue: Number(estimatedRevenue[0].total),
        },
        monthlyData,
        stageFunnel,
        followupTypes,
        cityDistribution,
        projectTypes,
        gradeDemand,
        topLeads: topLeadsWithActivity,
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function exportLeadsData(userId?: string, filters?: {
  search?: string;
  stages?: string[];
  projectType?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  existingVendor?: string;
  sort?: string;
}) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const conditions = [eq(leads.userId, user.data.id)];

    if (filters) {
      const { search, stages, projectType, city, dateFrom, dateTo, existingVendor } = filters;
      if (search) {
        conditions.push(sql`(${leads.companyName} ILIKE ${`%${search}%`} OR ${leads.contactPerson} ILIKE ${`%${search}%`} OR ${leads.mobile} ILIKE ${`%${search}%`})`);
      }
      if (stages && stages.length > 0) {
        conditions.push(sql`${leads.stage} = ANY(${stages})`);
      }
      if (projectType) conditions.push(eq(leads.projectType, projectType as any));
      if (city) conditions.push(sql`${leads.city} ILIKE ${`%${city}%`}`);
      if (dateFrom) conditions.push(gte(leads.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(leads.createdAt, new Date(dateTo)));
      if (existingVendor === "yes") conditions.push(sql`${leads.existingVendor} IS NOT NULL AND ${leads.existingVendor} != ''`);
      else if (existingVendor === "no") conditions.push(sql`(${leads.existingVendor} IS NULL OR ${leads.existingVendor} = '')`);
    }

    const allLeads = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt));

    return { success: true as const, data: allLeads, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
