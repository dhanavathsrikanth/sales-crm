import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { callLog, leads, contacts, users } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, count, or, like, isNotNull } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";
  const search = searchParams.get("search") || "";
  const now = new Date();

  const conditions = [eq(callLog.userId, user.id)];
  if (period === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000);
    conditions.push(gte(callLog.calledAt, start), lte(callLog.calledAt, end));
  } else if (period === "week") {
    conditions.push(
      gte(callLog.calledAt, startOfWeek(now, { weekStartsOn: 1 })),
      lte(callLog.calledAt, endOfWeek(now, { weekStartsOn: 1 })),
    );
  } else if (period === "month") {
    conditions.push(
      gte(callLog.calledAt, startOfMonth(now)),
      lte(callLog.calledAt, endOfMonth(now)),
    );
  }

  const allCalls = await db
    .select({
      id: callLog.id,
      userId: callLog.userId,
      contactId: callLog.contactId,
      leadId: callLog.leadId,
      phoneNumber: callLog.phoneNumber,
      direction: callLog.direction,
      status: callLog.status,
      duration: callLog.duration,
      notes: callLog.notes,
      calledAt: callLog.calledAt,
      createdAt: callLog.createdAt,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactCompany: contacts.company,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
    })
    .from(callLog)
    .leftJoin(contacts, eq(callLog.contactId, contacts.id))
    .leftJoin(leads, eq(callLog.leadId, leads.id))
    .where(and(...conditions))
    .orderBy(desc(callLog.calledAt));

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const callsToday = await db.$count(callLog,
    and(eq(callLog.userId, user.id), gte(callLog.calledAt, todayStart)));

  const callsThisWeek = await db.$count(callLog,
    and(eq(callLog.userId, user.id), gte(callLog.calledAt, weekStart)));

  const avgDuration = await db
    .select({ avg: sql<number>`COALESCE(AVG(duration), 0)` })
    .from(callLog)
    .where(and(eq(callLog.userId, user.id), isNotNull(callLog.duration), sql`duration > 0`));

  const connectedCalls = await db.$count(callLog,
    and(eq(callLog.userId, user.id), eq(callLog.status, "connected"), gte(callLog.calledAt, todayStart)));

  const totalDurationToday = await db
    .select({ total: sql<number>`COALESCE(SUM(duration), 0)` })
    .from(callLog)
    .where(and(eq(callLog.userId, user.id), gte(callLog.calledAt, todayStart), isNotNull(callLog.duration)));

  const frequent = await db
    .select({
      contactId: callLog.contactId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      company: contacts.company,
      phoneNumber: callLog.phoneNumber,
      callCount: count(),
    })
    .from(callLog)
    .leftJoin(contacts, eq(callLog.contactId, contacts.id))
    .where(and(eq(callLog.userId, user.id), isNotNull(callLog.contactId)))
    .groupBy(callLog.contactId, contacts.firstName, contacts.lastName, contacts.company, callLog.phoneNumber)
    .orderBy(sql`count DESC`)
    .limit(5);

  const missedCalls = await db
    .select({
      id: callLog.id,
      userId: callLog.userId,
      contactId: callLog.contactId,
      leadId: callLog.leadId,
      phoneNumber: callLog.phoneNumber,
      direction: callLog.direction,
      status: callLog.status,
      duration: callLog.duration,
      notes: callLog.notes,
      calledAt: callLog.calledAt,
      createdAt: callLog.createdAt,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactCompany: contacts.company,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
    })
    .from(callLog)
    .leftJoin(contacts, eq(callLog.contactId, contacts.id))
    .leftJoin(leads, eq(callLog.leadId, leads.id))
    .where(and(
      eq(callLog.userId, user.id),
      or(eq(callLog.status, "missed"), eq(callLog.status, "no_answer")),
    ))
    .orderBy(desc(callLog.calledAt))
    .limit(20);

  return NextResponse.json({
    calls: search
      ? allCalls.filter((c) =>
          (c.contactFirstName && c.contactFirstName.toLowerCase().includes(search.toLowerCase())) ||
          (c.contactLastName && c.contactLastName.toLowerCase().includes(search.toLowerCase())) ||
          (c.phoneNumber && c.phoneNumber.includes(search)) ||
          (c.leadCompanyName && c.leadCompanyName.toLowerCase().includes(search.toLowerCase()))
        )
      : allCalls,
    stats: {
      callsToday,
      callsThisWeek,
      avgDuration: Math.round(Number(avgDuration[0]?.avg || 0)),
      connectRate: callsToday > 0 ? Math.round((connectedCalls / callsToday) * 100) : 0,
      totalDurationToday: Math.round(Number(totalDurationToday[0]?.total || 0)),
    },
    frequentContacts: frequent.map((f) => ({
      id: f.contactId,
      firstName: f.firstName || "Unknown",
      lastName: f.lastName,
      company: f.company,
      phoneNumber: f.phoneNumber,
      callCount: Number(f.callCount),
    })),
    missedCalls,
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  if (!body.direction || !body.status) {
    return NextResponse.json({ error: "direction and status are required" }, { status: 400 });
  }

  const [log] = await db
    .insert(callLog)
    .values({
      userId: user.id,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      phoneNumber: body.phoneNumber || null,
      direction: body.direction,
      status: body.status,
      duration: body.duration || null,
      notes: body.notes || null,
      calledAt: new Date(),
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}
