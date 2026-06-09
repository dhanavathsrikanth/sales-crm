import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { followups, leads, activities, users } from "@/lib/db/schema";
import { eq, and, gte, lte, inArray, desc, asc, sql, count } from "drizzle-orm";
import { format, startOfWeek, endOfWeek } from "date-fns";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const tab = searchParams.get("tab") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const leadId = searchParams.get("leadId") || "";
  const viewDate = searchParams.get("viewDate") || "";

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const conditions = [eq(followups.userId, user.id)];

  if (leadId) {
    conditions.push(eq(followups.leadId, leadId));
  }

  if (tab === "today") {
    conditions.push(eq(followups.followupDate, todayStr));
  } else if (tab === "upcoming") {
    conditions.push(gte(followups.followupDate, todayStr));
    conditions.push(eq(followups.status, "pending"));
  } else if (tab === "completed") {
    conditions.push(eq(followups.status, "completed"));
  } else if (tab === "missed") {
    conditions.push(eq(followups.status, "pending"));
    conditions.push(sql`${followups.followupDate} < ${todayStr}`);
  } else if (tab === "all") {
  } else if (status) {
    conditions.push(eq(followups.status, status as any));
  }

  if (viewDate) {
    conditions.push(eq(followups.followupDate, viewDate));
  }

  const result = await db
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
    .where(eq(followups.userId, user.id))
    .groupBy(followups.followupDate);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const todayStats = await db
    .select({ status: followups.status, count: count() })
    .from(followups)
    .where(and(
      eq(followups.userId, user.id),
      eq(followups.followupDate, todayStr)
    ))
    .groupBy(followups.status);

  const weekTotal = await db
    .$count(followups, and(
      eq(followups.userId, user.id),
      gte(followups.followupDate, format(weekStart, "yyyy-MM-dd")),
      lte(followups.followupDate, format(weekEnd, "yyyy-MM-dd"))
    ));

  return NextResponse.json({
    followups: result,
    daysWithFollowups: daysWithFollowups.map((d) => d.date),
    stats: {
      todayPending: Number(todayStats.find((s) => s.status === "pending")?.count || 0),
      todayCompleted: Number(todayStats.find((s) => s.status === "completed")?.count || 0),
      weekTotal,
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  if (!body.leadId || !body.followupDate) {
    return NextResponse.json({ error: "leadId and followupDate are required" }, { status: 400 });
  }

  const [followup] = await db
    .insert(followups)
    .values({
      leadId: body.leadId,
      userId: user.id,
      followupDate: body.followupDate,
      followupTime: body.followupTime || null,
      type: body.type || "call",
      priority: body.priority || "medium",
      status: "pending",
      notes: body.notes || null,
    })
    .returning();

  await db.insert(activities).values({
    leadId: body.leadId,
    userId: user.id,
    type: "followup_added",
    description: `Follow-up scheduled for ${format(new Date(body.followupDate), "MMM d, yyyy")}`,
    metadata: { followupId: followup.id, type: body.type, priority: body.priority },
  });

  return NextResponse.json(followup, { status: 201 });
}
