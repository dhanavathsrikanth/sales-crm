import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts, users, interactions, callLog } from "@/lib/db/schema";
import { eq, and, or, desc, asc, sql, gte, type SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const relationship = searchParams.get("relationship") || "";
  const sort = searchParams.get("sort") || "name_asc";
  const company = searchParams.get("company") || "";
  const lastContacted = searchParams.get("lastContacted") || "";

  const conditions: SQL[] = [eq(contacts.userId, user.id), sql`${contacts.isActive} = true`];

  if (search) {
    conditions.push(
      sql`(${contacts.firstName} ILIKE ${`%${search}%`} OR ${contacts.lastName} ILIKE ${`%${search}%`} OR ${contacts.mobile} ILIKE ${`%${search}%`} OR ${contacts.company} ILIKE ${`%${search}%`})`,
    );
  }

  if (relationship) {
    conditions.push(eq(contacts.relationship, relationship as any));
  }

  if (company) {
    conditions.push(sql`${contacts.company} ILIKE ${`%${company}%`}`);
  }

  if (lastContacted === "overdue") {
    conditions.push(
      sql`(${contacts.lastContactedAt} IS NULL OR ${contacts.lastContactedAt} < NOW() - INTERVAL '30 days')`,
    );
  } else if (lastContacted === "recent") {
    conditions.push(gte(contacts.lastContactedAt, sql`NOW() - INTERVAL '7 days'`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCount = await db.$count(contacts, where);

  const sortMap: Record<string, any> = {
    name_asc: [asc(contacts.firstName), asc(contacts.lastName)],
    name_desc: [desc(contacts.firstName), desc(contacts.lastName)],
    recently_contacted: desc(contacts.lastContactedAt),
    oldest: asc(contacts.lastContactedAt),
  };

  const orderBy = sortMap[sort] || [asc(contacts.firstName), asc(contacts.lastName)];

  const allContacts = await db
    .select()
    .from(contacts)
    .where(where)
    .orderBy(...(Array.isArray(orderBy[0]) ? orderBy.flat() : orderBy))
    .limit(50);

  const vipCount = await db.$count(
    contacts,
    and(eq(contacts.userId, user.id), eq(contacts.relationship, "customer"), sql`${contacts.isActive} = true`),
  );

  const dueForFollowup = await db.$count(
    contacts,
    and(
      eq(contacts.userId, user.id),
      sql`${contacts.isActive} = true`,
      or(
        sql`${contacts.lastContactedAt} IS NULL`,
        sql`${contacts.lastContactedAt} < NOW() - INTERVAL '30 days'`,
      ),
    ),
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const birthdaysThisMonth = await db.$count(
    contacts,
    and(
      eq(contacts.userId, user.id),
      sql`${contacts.isActive} = true`,
      sql`EXTRACT(MONTH FROM ${contacts.birthday}) = ${currentMonth}`,
      sql`EXTRACT(DAY FROM ${contacts.birthday}) >= ${currentDay}`,
    ),
  );

  return NextResponse.json({
    contacts: allContacts,
    total: totalCount,
    stats: {
      total: totalCount,
      vip: vipCount,
      dueForFollowup,
      birthdaysThisMonth,
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  if (!body.firstName?.trim()) return NextResponse.json({ error: "First name is required" }, { status: 400 });

  const whatsapp = body.whatsappSameAsMobile ? body.mobile : (body.whatsapp || null);

  const [contact] = await db
    .insert(contacts)
    .values({
      userId: user.id,
      leadId: body.leadId || null,
      firstName: body.firstName,
      lastName: body.lastName || null,
      mobile: body.mobile || null,
      whatsapp,
      email: body.email || null,
      designation: body.designation || null,
      company: body.company || null,
      relationship: body.relationship || "friend",
      tags: body.tags || [],
      birthday: body.birthday || null,
      anniversary: body.anniversary || null,
      personalNotes: body.personalNotes || null,
      contactFrequency: body.contactFrequency || "monthly",
      referredBy: body.referredBy || null,
      profilePhoto: body.profilePhoto || null,
    })
    .returning();

  return NextResponse.json(contact, { status: 201 });
}
