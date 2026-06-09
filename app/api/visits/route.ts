import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { visits, leads, activities, users, followups } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, count, isNull } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";
  const now = new Date();

  const conditions = [eq(visits.userId, user.id)];
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

  const visitsToday = await db.$count(visits,
    and(eq(visits.userId, user.id), gte(visits.createdAt, todayStart)));
  const visitsThisWeek = await db.$count(visits,
    and(eq(visits.userId, user.id), gte(visits.createdAt, weekStart)));
  const visitsThisMonth = await db.$count(visits,
    and(eq(visits.userId, user.id), gte(visits.createdAt, monthStart)));

  const avgDuration = await db
    .select({ avg: sql<number>`COALESCE(AVG(duration_minutes), 0)` })
    .from(visits)
    .where(and(eq(visits.userId, user.id), sql`duration_minutes IS NOT NULL`));

  const mostVisited = await db
    .select({
      leadId: visits.leadId,
      count: count(),
      companyName: leads.companyName,
    })
    .from(visits)
    .leftJoin(leads, eq(visits.leadId, leads.id))
    .where(eq(visits.userId, user.id))
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
    .where(and(eq(visits.userId, user.id), isNull(visits.checkOutTime)))
    .limit(1);

  return NextResponse.json({
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
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  if (!body.leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const [visit] = await db
    .insert(visits)
    .values({
      leadId: body.leadId,
      userId: user.id,
      checkInTime: new Date(),
      checkInLat: body.checkInLat || null,
      checkInLng: body.checkInLng || null,
      checkInAddress: body.checkInAddress || null,
      notes: body.notes || null,
    })
    .returning();

  await db.insert(activities).values({
    leadId: body.leadId,
    userId: user.id,
    type: "visit",
    description: body.checkInAddress
      ? `Checked in at ${body.checkInAddress}`
      : "Site visit check-in",
  });

  return NextResponse.json(visit, { status: 201 });
}
