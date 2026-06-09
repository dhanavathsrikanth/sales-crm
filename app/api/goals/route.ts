import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, visits, followups, activities, users, personalGoals } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import {
  startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek,
  eachWeekOfInterval, format, differenceInDays,
} from "date-fns";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthNum = now.getMonth() + 1;
  const yearNum = now.getFullYear();
  const daysInMonth = monthEnd.getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;

  // ── Current goals ──
  const [currentGoals] = await db
    .select()
    .from(personalGoals)
    .where(and(
      eq(personalGoals.userId, user.id),
      eq(personalGoals.month, monthNum),
      eq(personalGoals.year, yearNum),
    ))
    .limit(1);

  // ── Current month progress ──
  const leadsCreated = await db.$count(leads, and(
    eq(leads.userId, user.id),
    gte(leads.createdAt, monthStart),
    lte(leads.createdAt, monthEnd),
  ));

  const visitsDone = await db.$count(visits, and(
    eq(visits.userId, user.id),
    gte(visits.createdAt, monthStart),
    lte(visits.createdAt, monthEnd),
  ));

  const followupsDone = await db.$count(followups, and(
    eq(followups.userId, user.id),
    eq(followups.status, "completed"),
    gte(followups.createdAt, monthStart),
    lte(followups.createdAt, monthEnd),
  ));

  const m3Pipeline = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
    .from(leads)
    .where(and(
      eq(leads.userId, user.id),
      sql`estimated_m3 IS NOT NULL`,
    ));

  const dealsWon = await db.$count(leads, and(
    eq(leads.userId, user.id),
    eq(leads.stage, "won"),
    gte(leads.createdAt, monthStart),
    lte(leads.createdAt, monthEnd),
  ));

  const revenue = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_value), 0)` })
    .from(leads)
    .where(and(
      eq(leads.userId, user.id),
      eq(leads.stage, "won"),
      sql`estimated_value IS NOT NULL`,
      gte(leads.createdAt, monthStart),
      lte(leads.createdAt, monthEnd),
    ));

  // ── Progress status ──
  const getStatus = (current: number, target: number) => {
    if (!target) return "on_track" as const;
    const pct = current / target;
    if (pct >= 1) return "exceeded" as const;
    const expected = dayOfMonth / daysInMonth;
    const ratio = pct / expected;
    if (ratio >= 0.85) return "on_track" as const;
    if (ratio >= 0.6) return "behind" as const;
    return "at_risk" as const;
  };

  const dailyRateNeeded = (target: number, done: number) =>
    target > 0 ? Math.max(0, Math.ceil((target - done) / daysLeft)) : 0;

  const progress = currentGoals ? {
    leadsCreated,
    visitsDone,
    followupsDone,
    m3Pipeline: Number(m3Pipeline[0].total),
    dealsWon,
    revenue: Number(revenue[0].total),
    status: {
      leads: getStatus(leadsCreated, currentGoals.targetLeads || 0),
      visits: getStatus(visitsDone, currentGoals.targetVisits || 0),
      followups: getStatus(followupsDone, currentGoals.targetConversions || 0),
      m3: getStatus(Number(m3Pipeline[0].total), Number(currentGoals.targetM3 || 0)),
      deals: getStatus(dealsWon, currentGoals.targetConversions || 0),
      revenue: getStatus(Number(revenue[0].total), Number(currentGoals.targetRevenue || 0)),
    },
    dailyRate: {
      leads: dailyRateNeeded(currentGoals.targetLeads || 0, leadsCreated),
      visits: dailyRateNeeded(currentGoals.targetVisits || 0, visitsDone),
      m3: dailyRateNeeded(Number(currentGoals.targetM3 || 0), Number(m3Pipeline[0].total)),
    },
    daysLeft,
    dayOfMonth,
    daysInMonth,
  } : null;

  // ── Weekly breakdown ──
  const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  const weeklyData = await Promise.all(
    weekStarts.map(async (ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const wLeads = await db.$count(leads, and(
        eq(leads.userId, user.id),
        gte(leads.createdAt, ws), lte(leads.createdAt, we),
      ));
      const wVisits = await db.$count(visits, and(
        eq(visits.userId, user.id),
        gte(visits.createdAt, ws), lte(visits.createdAt, we),
      ));
      return { week: `W${format(ws, "d/M")}`, leads: wLeads, visits: wVisits };
    }),
  );

  const weeklyPace = currentGoals
    ? Math.round((currentGoals.targetVisits || 0) / (daysInMonth / 7))
    : 0;

  // ── Performance history (last 6 months) ──
  const historyData = [];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const ms = startOfMonth(m);
    const me = endOfMonth(m);
    const hLeads = await db.$count(leads, and(
      eq(leads.userId, user.id), gte(leads.createdAt, ms), lte(leads.createdAt, me),
    ));
    const hVisits = await db.$count(visits, and(
      eq(visits.userId, user.id), gte(visits.createdAt, ms), lte(visits.createdAt, me),
    ));
    const hWon = await db.$count(leads, and(
      eq(leads.userId, user.id), eq(leads.stage, "won"), gte(leads.createdAt, ms), lte(leads.createdAt, me),
    ));
    const hM3 = await db
      .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
      .from(leads)
      .where(and(
        eq(leads.userId, user.id), gte(leads.createdAt, ms), lte(leads.createdAt, me), sql`estimated_m3 IS NOT NULL`,
      ));
    historyData.push({
      month: format(ms, "MMM yy"),
      leads: hLeads,
      visits: hVisits,
      won: hWon,
      m3: Number(hM3[0].total),
    });
  }

  // ── Streak ──
  let streak = 0;
  for (let d = 0; d < 30; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const hasActivity = await db.$count(activities, and(
      eq(activities.userId, user.id),
      gte(activities.createdAt, dayStart),
      lte(activities.createdAt, dayEnd),
    ));
    if (hasActivity > 0) streak++;
    else if (d > 0) break;
  }

  // ── Badges ──
  const badges: string[] = [];
  if (dealsWon >= 1) badges.push("first_deal");
  if (Number(m3Pipeline[0].total) >= 100) badges.push("pipeline_100");
  if (visitsDone >= 10) badges.push("visits_10_week");
  const maxLeadsDay = await db
    .select({ count: count() })
    .from(activities)
    .where(and(
      eq(activities.userId, user.id),
      eq(activities.type, "lead_created" as any),
      gte(activities.createdAt, monthStart),
    ))
    .groupBy(sql`DATE(${activities.createdAt})`)
    .orderBy(sql`count DESC`)
    .limit(1)
    .then((r) => Number(r[0]?.count || 0));
  if (maxLeadsDay >= 5) badges.push("leads_5_day");
  if (streak >= 7) badges.push("streak_7");
  if (streak >= 30) badges.push("streak_30");

  // ── This month vs last month ──
  const lm = subMonths(now, 1);
  const lmStart = startOfMonth(lm);
  const lmEnd = endOfMonth(lm);
  const lmLeads = await db.$count(leads, and(
    eq(leads.userId, user.id), gte(leads.createdAt, lmStart), lte(leads.createdAt, lmEnd),
  ));
  const lmVisits = await db.$count(visits, and(
    eq(visits.userId, user.id), gte(visits.createdAt, lmStart), lte(visits.createdAt, lmEnd),
  ));
  const lmWon = await db.$count(leads, and(
    eq(leads.userId, user.id), eq(leads.stage, "won"), gte(leads.createdAt, lmStart), lte(leads.createdAt, lmEnd),
  ));
  const lmM3 = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
    .from(leads)
    .where(and(eq(leads.userId, user.id), gte(leads.createdAt, lmStart), lte(leads.createdAt, lmEnd), sql`estimated_m3 IS NOT NULL`));

  return NextResponse.json({
    goals: currentGoals || null,
    progress,
    weeklyData,
    weeklyPace,
    history: historyData,
    streak,
    badges,
    comparison: {
      thisMonth: { leads: leadsCreated, visits: visitsDone, won: dealsWon, m3: Number(m3Pipeline[0].total) },
      lastMonth: { leads: lmLeads, visits: lmVisits, won: lmWon, m3: Number(lmM3[0].total) },
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existing = await db
    .select()
    .from(personalGoals)
    .where(and(
      eq(personalGoals.userId, user.id),
      eq(personalGoals.month, month),
      eq(personalGoals.year, year),
    ))
    .limit(1);

  if (existing.length) {
    const [updated] = await db
      .update(personalGoals)
      .set({
        targetLeads: body.targetLeads ? parseInt(body.targetLeads) : null,
        targetVisits: body.targetVisits ? parseInt(body.targetVisits) : null,
        targetConversions: body.targetConversions ? parseInt(body.targetConversions) : null,
        targetM3: body.targetM3 || null,
        targetRevenue: body.targetRevenue || null,
        notes: body.notes || null,
      })
      .where(eq(personalGoals.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(personalGoals)
    .values({
      userId: user.id,
      month,
      year,
      targetLeads: body.targetLeads ? parseInt(body.targetLeads) : null,
      targetVisits: body.targetVisits ? parseInt(body.targetVisits) : null,
      targetConversions: body.targetConversions ? parseInt(body.targetConversions) : null,
      targetM3: body.targetM3 || null,
      targetRevenue: body.targetRevenue || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
