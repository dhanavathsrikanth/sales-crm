import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { addDays } from "date-fns";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const end = addDays(now, 7);
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  const allContacts = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      birthday: contacts.birthday,
      mobile: contacts.mobile,
      whatsapp: contacts.whatsapp,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, user.id),
        sql`${contacts.isActive} = true`,
        sql`${contacts.birthday} IS NOT NULL`,
        sql`(
          (EXTRACT(MONTH FROM ${contacts.birthday}) = ${currentMonth} AND EXTRACT(DAY FROM ${contacts.birthday}) >= ${currentDay})
          OR
          (EXTRACT(MONTH FROM ${contacts.birthday}) = ${endMonth} AND EXTRACT(DAY FROM ${contacts.birthday}) <= ${endDay})
        )`,
      ),
    );

  const results = allContacts.map((c) => {
    const bd = new Date(c.birthday!);
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    const daysUntil = Math.ceil((thisYearBd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName || ""}`.trim(),
      birthday: c.birthday,
      daysUntil: daysUntil >= 0 ? daysUntil : 365 + daysUntil,
      mobile: c.mobile,
      whatsapp: c.whatsapp,
    };
  });

  return NextResponse.json(results);
}
