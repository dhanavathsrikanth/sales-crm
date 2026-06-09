import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  leads, visits, followups, activities, users, callLog, odometerLogs,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count, desc, isNotNull } from "drizzle-orm";
import {
  startOfMonth, endOfMonth, subMonths, format,
} from "date-fns";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from") || format(startOfMonth(new Date()), "yyyy-MM-dd");
  const dateTo = searchParams.get("to") || format(endOfMonth(new Date()), "yyyy-MM-dd");
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  const periodFilter = and(
    gte(leads.createdAt, from),
    lte(leads.createdAt, to),
  );
  const userFilter = eq(leads.userId, user.id);

  // ── Summary ──
  const leadsCreated = await db.$count(leads, and(userFilter, periodFilter));

  const leadsWon = await db.$count(leads, and(userFilter, periodFilter, eq(leads.stage, "won")));
  const leadsLost = await db.$count(leads, and(userFilter, periodFilter, eq(leads.stage, "lost")));

  const conversionRate = leadsCreated > 0
    ? Math.round((leadsWon / leadsCreated) * 100)
    : 0;

  const totalVisits = await db.$count(visits, and(
    eq(visits.userId, user.id),
    gte(visits.createdAt, from),
    lte(visits.createdAt, to),
  ));

  const followupsCompleted = await db.$count(followups, and(
    eq(followups.userId, user.id),
    eq(followups.status, "completed"),
    gte(followups.createdAt, from),
    lte(followups.createdAt, to),
  ));

  const totalM3 = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
    .from(leads)
    .where(and(
      userFilter,
      eq(leads.stage, "won"),
      sql`estimated_m3 IS NOT NULL`,
    ));

  const estimatedRevenue = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_value), 0)` })
    .from(leads)
    .where(and(
      userFilter,
      eq(leads.stage, "won"),
      sql`estimated_value IS NOT NULL`,
    ));

  // ── Monthly Trend (last 12 months) ──
  const monthlyData: { month: string; created: number; won: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = startOfMonth(subMonths(new Date(), i));
    const mEnd = endOfMonth(subMonths(new Date(), i));
    const created = await db.$count(leads, and(
      userFilter,
      gte(leads.createdAt, mStart),
      lte(leads.createdAt, mEnd),
    ));
    const won = await db.$count(leads, and(
      userFilter,
      eq(leads.stage, "won"),
      gte(leads.createdAt, mStart),
      lte(leads.createdAt, mEnd),
    ));
    monthlyData.push({ month: format(mStart, "MMM yy"), created, won });
  }

  // ── Stage Funnel ──
  const stageOrder = [
    "new", "contacted", "meeting_scheduled", "site_visited",
    "requirement_received", "quotation_sent", "negotiation",
    "trial_order", "won", "lost",
  ];
  const stageLabels: Record<string, string> = {
    new: "New", contacted: "Contacted", meeting_scheduled: "Meeting",
    site_visited: "Site Visit", requirement_received: "Requirement",
    quotation_sent: "Quotation", negotiation: "Negotiation",
    trial_order: "Trial Order", won: "Won", lost: "Lost",
  };
  const stageData = await db
    .select({
      stage: leads.stage,
      count: count(),
    })
    .from(leads)
    .where(userFilter)
    .groupBy(leads.stage);
  const stageCounts = Object.fromEntries(stageData.map((s) => [s.stage, Number(s.count)]));
  const stageFunnel = stageOrder
    .filter((s) => s !== "lost")
    .map((s) => ({ name: stageLabels[s] || s, value: stageCounts[s] || 0 }));

  // ── Follow-up Type Distribution ──
  const followupTypeData = await db
    .select({
      type: followups.type,
      count: count(),
    })
    .from(followups)
    .where(and(
      eq(followups.userId, user.id),
      gte(followups.createdAt, from),
      lte(followups.createdAt, to),
    ))
    .groupBy(followups.type);
  const followupTypes = followupTypeData.map((f) => ({
    name: f.type ? f.type.charAt(0).toUpperCase() + f.type.slice(1) : "Other",
    value: Number(f.count),
  }));

  // ── City-wise Distribution ──
  const cityData = await db
    .select({
      city: leads.city,
      count: count(),
    })
    .from(leads)
    .where(and(userFilter, sql`city IS NOT NULL`))
    .groupBy(leads.city)
    .orderBy(sql`count DESC`)
    .limit(10);
  const cityDistribution = cityData.map((c) => ({
    name: c.city || "Unknown",
    value: Number(c.count),
  }));

  // ── Project Type Breakdown ──
  const projectTypeData = await db
    .select({
      type: leads.projectType,
      count: count(),
    })
    .from(leads)
    .where(and(userFilter, sql`project_type IS NOT NULL`))
    .groupBy(leads.projectType);
  const projectTypes = projectTypeData.map((p) => ({
    name: p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Other",
    value: Number(p.count),
  }));

  // ── Concrete Grade Demand ──
  const allLeads = await db
    .select({ gradeRequirements: leads.gradeRequirements })
    .from(leads)
    .where(and(userFilter, sql`grade_requirements IS NOT NULL`));
  const gradeCounts: Record<string, number> = {};
  for (const l of allLeads) {
    if (l.gradeRequirements) {
      for (const g of l.gradeRequirements as string[]) {
        gradeCounts[g] = (gradeCounts[g] || 0) + 1;
      }
    }
  }
  const gradeDemand = Object.entries(gradeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ── Top Leads by m³ ──
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
      const recent = await db
        .select({ description: activities.description, createdAt: activities.createdAt })
        .from(activities)
        .where(eq(activities.leadId, l.id))
        .orderBy(desc(activities.createdAt))
        .limit(1);
      return {
        ...l,
        estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
        estimatedM3: l.estimatedM3 ? Number(l.estimatedM3) : null,
        lastActivity: recent[0]?.description || null,
        lastActivityDate: recent[0]?.createdAt || null,
      };
    }),
  );

  // ── Full data for export ──
  const allLeadsExport = await db
    .select()
    .from(leads)
    .where(userFilter);
  const allVisitsExport = await db
    .select({
      id: visits.id,
      leadId: visits.leadId,
      checkInTime: visits.checkInTime,
      checkOutTime: visits.checkOutTime,
      checkInAddress: visits.checkInAddress,
      durationMinutes: visits.durationMinutes,
      notes: visits.notes,
      createdAt: visits.createdAt,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
    })
    .from(visits)
    .leftJoin(leads, eq(visits.leadId, leads.id))
    .where(and(eq(visits.userId, user.id), gte(visits.createdAt, from), lte(visits.createdAt, to)));
  const allFollowupsExport = await db
    .select({
      id: followups.id,
      leadId: followups.leadId,
      followupDate: followups.followupDate,
      type: followups.type,
      priority: followups.priority,
      status: followups.status,
      notes: followups.notes,
      createdAt: followups.createdAt,
      leadCompanyName: leads.companyName,
    })
    .from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(and(eq(followups.userId, user.id), gte(followups.createdAt, from), lte(followups.createdAt, to)));
  const allActivitiesExport = await db
    .select()
    .from(activities)
    .where(and(eq(activities.userId, user.id), gte(activities.createdAt, from), lte(activities.createdAt, to)))
    .orderBy(desc(activities.createdAt));

  // ── Odometer / Mileage ──
  const odometerData = await db
    .select()
    .from(odometerLogs)
    .where(and(
      eq(odometerLogs.userId, user.id),
      gte(odometerLogs.logDate, dateFrom),
      lte(odometerLogs.logDate, dateTo),
    ))
    .orderBy(desc(odometerLogs.logDate));

  const mileageSummary = {
    totalDistance: 0,
    totalTaAmount: 0,
    totalFuelCost: 0,
    netCost: 0,
    daysOnField: odometerData.filter((o) => o.endReading).length,
  };
  for (const o of odometerData) {
    mileageSummary.totalDistance += Number(o.distanceKm || 0);
    mileageSummary.totalTaAmount += Number(o.taAmount || 0);
    mileageSummary.totalFuelCost += Number(o.fuelCost || 0);
  }
  mileageSummary.netCost = mileageSummary.totalFuelCost - mileageSummary.totalTaAmount;

  const mileageDaily = odometerData
    .filter((o) => o.distanceKm)
    .map((o) => ({
      date: o.logDate,
      distanceKm: Number(o.distanceKm),
      fuelCost: Number(o.fuelCost || 0),
      taAmount: Number(o.taAmount || 0),
      isProfitable: Number(o.taAmount || 0) > Number(o.fuelCost || 0),
    }));

  // ── Build odometer lookup by date for export enrichment ──
  const odometerByDate: Record<string, { start: string; end: string; distance: string }> = {};
  for (const o of odometerData) {
    if (o.logDate) {
      odometerByDate[o.logDate] = {
        start: o.startReading,
        end: o.endReading || "",
        distance: o.distanceKm || "",
      };
    }
  }

  // Enrich visits with odometer data
  const allVisitsExportWithOdo = allVisitsExport.map((v) => {
    const visitDate = v.checkInTime ? format(new Date(v.checkInTime), "yyyy-MM-dd") : "";
    const odo = visitDate ? odometerByDate[visitDate] : undefined;
    return {
      ...v,
      odometerStart: odo?.start || "",
      odometerEnd: odo?.end || "",
      odometerDistance: odo?.distance || "",
    };
  });

  return NextResponse.json({
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
    stageFunnel: stageFunnel.filter((s) => s.value > 0),
    followupTypes,
    cityDistribution,
    projectTypes,
    gradeDemand,
    topLeads: topLeadsWithActivity,
    mileageSummary,
    mileageDaily,
    exportData: {
      leads: allLeadsExport,
      visits: allVisitsExportWithOdo,
      followups: allFollowupsExport,
      activities: allActivitiesExport,
      mileage: odometerData,
    },
  });
}
