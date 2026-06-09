import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, followups, visits, activities, users, contacts, personalGoals, quickNotes } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count, or, isNull, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, subDays } from "date-fns";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const userId = user.id;

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // ── Section 2: Daily Focus ──

  // Overdue follow-ups (past date, still pending)
  const overdueFollowups = await db
    .select({
      id: followups.id,
      leadId: followups.leadId,
      followupDate: followups.followupDate,
      followupTime: followups.followupTime,
      type: followups.type,
      priority: followups.priority,
      notes: followups.notes,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
    })
    .from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(and(
      eq(followups.userId, userId),
      eq(followups.status, "pending"),
      sql`${followups.followupDate} < ${todayStr}`,
    ))
    .orderBy(followups.followupDate)
    .limit(10);

  // Stale leads: no activity in 21+ days. Find leads with last activity older than 21 days.
  const staleCutoff = subDays(now, 21);
  const leadsWithRecentActivity = db
    .select({ leadId: activities.leadId })
    .from(activities)
    .where(gte(activities.createdAt, staleCutoff))
    .as("recent");
  const staleLeads = await db
    .select({
      id: leads.id,
      companyName: leads.companyName,
      contactPerson: leads.contactPerson,
      stage: leads.stage,
      mobile: leads.mobile,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .leftJoin(leadsWithRecentActivity, eq(leads.id, leadsWithRecentActivity.leadId))
    .where(and(
      eq(leads.userId, userId),
      sql`${leads.stage} NOT IN ('won', 'lost')`,
      isNull(leadsWithRecentActivity.leadId),
    ))
    .limit(10);

  // Hot leads: negotiation or trial_order stage
  const hotLeads = await db
    .select({
      id: leads.id,
      companyName: leads.companyName,
      contactPerson: leads.contactPerson,
      stage: leads.stage,
      estimatedValue: leads.estimatedValue,
      estimatedM3: leads.estimatedM3,
      mobile: leads.mobile,
      email: leads.email,
    })
    .from(leads)
    .where(and(
      eq(leads.userId, userId),
      inArray(leads.stage, ["negotiation", "trial_order"] as any),
    ))
    .limit(10);

  // Today's follow-ups
  const todayFollowups = await db
    .select({
      id: followups.id,
      leadId: followups.leadId,
      followupTime: followups.followupTime,
      type: followups.type,
      priority: followups.priority,
      notes: followups.notes,
      status: followups.status,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
    })
    .from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(and(
      eq(followups.userId, userId),
      eq(followups.followupDate, todayStr),
    ))
    .orderBy(followups.followupTime);

  // Today's visits
  const todayVisits = await db
    .select({
      id: visits.id,
      leadId: visits.leadId,
      checkInAddress: visits.checkInAddress,
      notes: visits.notes,
      leadCompanyName: leads.companyName,
    })
    .from(visits)
    .leftJoin(leads, eq(visits.leadId, leads.id))
    .where(and(
      eq(visits.userId, userId),
      gte(visits.createdAt, new Date(now.getFullYear(), now.getMonth(), now.getDate())),
      lte(visits.createdAt, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)),
    ));

  // Upcoming count (next 7 days)
  const upcomingWeekFollowupsCount = await db
    .$count(followups, and(
      eq(followups.userId, userId),
      eq(followups.status, "pending"),
      gte(followups.followupDate, todayStr),
      lte(followups.followupDate, format(subDays(now, -7), "yyyy-MM-dd")),
    ));

  // ── Section 3: My Numbers ──

  const leadsCreatedThisMonth = await db
    .$count(leads, and(
      eq(leads.userId, userId),
      gte(leads.createdAt, monthStart),
      lte(leads.createdAt, monthEnd),
    ));

  const visitsThisMonth = await db
    .$count(visits, and(
      eq(visits.userId, userId),
      gte(visits.createdAt, monthStart),
      lte(visits.createdAt, monthEnd),
    ));

  const dealsWonThisMonth = await db
    .$count(leads, and(
      eq(leads.userId, userId),
      eq(leads.stage, "won"),
      gte(leads.createdAt, monthStart),
      lte(leads.createdAt, monthEnd),
    ));

  const m3Pipeline = await db
    .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
    .from(leads)
    .where(and(
      eq(leads.userId, userId),
      sql`${leads.stage} NOT IN ('won', 'lost')`,
      sql`estimated_m3 IS NOT NULL`,
    ));

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const goals = await db
    .select()
    .from(personalGoals)
    .where(and(
      eq(personalGoals.userId, userId),
      eq(personalGoals.month, currentMonth),
      eq(personalGoals.year, currentYear),
    ))
    .limit(1);

  // ── Section 4: People to Contact Today ──

  const peopleDueToday = await db
    .select({
      id: followups.id,
      leadId: followups.leadId,
      leadCompanyName: leads.companyName,
      leadContactPerson: leads.contactPerson,
      followupType: followups.type,
      reason: sql<string>`'followup_due'`,
      mobile: leads.mobile,
      contactPerson: leads.contactPerson,
    })
    .from(followups)
    .leftJoin(leads, eq(followups.leadId, leads.id))
    .where(and(
      eq(followups.userId, userId),
      eq(followups.followupDate, todayStr),
      eq(followups.status, "pending"),
    ));

  const monthDay = now.getDate();
  const monthNum = now.getMonth() + 1;
  const tomorrowMonthDay = monthDay + 1;
  const tomorrowMonth = monthNum;

  const birthdayContacts = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      company: contacts.company,
      mobile: contacts.mobile,
      whatsapp: contacts.whatsapp,
      birthday: contacts.birthday,
      leadId: contacts.leadId,
    })
    .from(contacts)
    .where(and(
      eq(contacts.userId, userId),
      or(
        sql`EXTRACT(MONTH FROM ${contacts.birthday}) = ${monthNum} AND EXTRACT(DAY FROM ${contacts.birthday}) = ${monthDay}`,
        sql`EXTRACT(MONTH FROM ${contacts.birthday}) = ${tomorrowMonth} AND EXTRACT(DAY FROM ${contacts.birthday}) = ${tomorrowMonthDay}`,
      ),
    ))
    .limit(10);

  const frequencyDueContacts = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      company: contacts.company,
      mobile: contacts.mobile,
      whatsapp: contacts.whatsapp,
      contactFrequency: contacts.contactFrequency,
      lastContactedAt: contacts.lastContactedAt,
      leadId: contacts.leadId,
    })
    .from(contacts)
    .where(and(
      eq(contacts.userId, userId),
      eq(contacts.isActive, true),
      sql`${contacts.contactFrequency} IS NOT NULL`,
      or(
        and(
          eq(contacts.contactFrequency, "weekly"),
          sql`${contacts.lastContactedAt} IS NOT NULL`,
          sql`${contacts.lastContactedAt} < NOW() - INTERVAL '7 days'`,
        ),
        and(
          eq(contacts.contactFrequency, "monthly"),
          sql`${contacts.lastContactedAt} IS NOT NULL`,
          sql`${contacts.lastContactedAt} < NOW() - INTERVAL '28 days'`,
        ),
        and(
          eq(contacts.contactFrequency, "quarterly"),
          sql`${contacts.lastContactedAt} IS NOT NULL`,
          sql`${contacts.lastContactedAt} < NOW() - INTERVAL '85 days'`,
        ),
        and(
          isNull(contacts.lastContactedAt),
          sql`${contacts.contactFrequency} IS NOT NULL`,
        ),
      ),
    ))
    .limit(10);

  const recentActivityCutoff = subDays(now, 7);
  const recentLeadActivities = db
    .select({ leadId: activities.leadId })
    .from(activities)
    .where(gte(activities.createdAt, recentActivityCutoff))
    .as("recent_lead_acts");
  const hotLeadsNoActivity = await db
    .select({
      id: leads.id,
      companyName: leads.companyName,
      contactPerson: leads.contactPerson,
      stage: leads.stage,
      mobile: leads.mobile,
    })
    .from(leads)
    .leftJoin(recentLeadActivities, eq(leads.id, recentLeadActivities.leadId))
    .where(and(
      eq(leads.userId, userId),
      inArray(leads.stage, ["negotiation", "trial_order"] as any),
      isNull(recentLeadActivities.leadId),
    ))
    .limit(10);

  // ── Section 6: Recent Activity Feed ──

  const recentActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .orderBy(sql`${activities.createdAt} DESC`)
    .limit(8);

  // ── Section 7: Quick Notes (pinned) ──

  const pinnedNotes = await db
    .select()
    .from(quickNotes)
    .where(and(
      eq(quickNotes.userId, userId),
      eq(quickNotes.isPinned, true),
    ))
    .orderBy(desc(quickNotes.createdAt));

  // ── Week lead movement ──

  const leadsCreatedThisWeek = await db
    .$count(leads, and(
      eq(leads.userId, userId),
      gte(leads.createdAt, weekStart),
      lte(leads.createdAt, weekEnd),
    ));

  const weekLeadsNeedingMovement = await db
    .$count(leads, and(
      eq(leads.userId, userId),
      sql`${leads.stage} NOT IN ('won', 'lost')`,
      gte(leads.createdAt, subDays(now, 7)),
      inArray(leads.stage, ["new", "contacted", "meeting_scheduled"] as any),
    ));

  // ── Sunday wrap: total pending follow-ups count ──

  const pendingCount = await db
    .$count(followups, and(
      eq(followups.userId, userId),
      eq(followups.status, "pending"),
    ));

  return NextResponse.json({
    user: {
      name: user.name || user.email || "there",
      email: user.email,
      phone: user.phone,
      company: user.company,
      defaultVehicleNumber: user.defaultVehicleNumber,
      defaultTaRate: user.defaultTaRate,
      defaultVehicleType: user.defaultVehicleType,
      vehicleModel: user.vehicleModel,
      monthlyKmTarget: user.monthlyKmTarget,
      remindStartTime: user.remindStartTime,
      remindEndTime: user.remindEndTime,
      alertMissingReadings: user.alertMissingReadings,
    },
    dailyFocus: {
      overdueFollowups,
      staleLeads,
      hotLeads,
      todayFollowups,
      todayVisits,
      upcomingWeekFollowupsCount,
      weekLeadsNeedingMovement,
    },
    myNumbers: {
      leadsCreatedThisMonth,
      visitsThisMonth,
      dealsWonThisMonth,
      m3Pipeline: Number(m3Pipeline[0].total),
      goals: goals[0] || null,
    },
    peopleToContact: {
      followupsDue: peopleDueToday,
      birthdays: birthdayContacts,
      frequencyDue: frequencyDueContacts,
      hotStale: hotLeadsNoActivity,
    },
    recentActivities,
    pinnedNotes,
    pendingCount,
  });
}
