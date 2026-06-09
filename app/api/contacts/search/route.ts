import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts, users } from "@/lib/db/schema";
import { eq, and, or, like } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q) return NextResponse.json([]);

  const results = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      mobile: contacts.mobile,
      company: contacts.company,
      relationship: contacts.relationship,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, user.id),
        or(
          like(contacts.firstName, `%${q}%`),
          like(contacts.lastName, `%${q}%`),
          like(contacts.mobile, `%${q}%`),
          like(contacts.company, `%${q}%`),
        ),
      ),
    )
    .limit(limit);

  return NextResponse.json(results);
}
