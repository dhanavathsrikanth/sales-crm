import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q) return NextResponse.json([]);

  const searchPattern = `%${q.toLowerCase()}%`;

  const result = await db.execute(
    sql`
      SELECT id, first_name, last_name, mobile, company, relationship
      FROM contacts
      WHERE user_id = ${user.id}
      AND (
        LOWER(first_name) LIKE ${searchPattern}
        OR LOWER(last_name) LIKE ${searchPattern}
        OR LOWER(mobile) LIKE ${searchPattern}
        OR LOWER(whatsapp) LIKE ${searchPattern}
        OR LOWER(email) LIKE ${searchPattern}
        OR LOWER(designation) LIKE ${searchPattern}
        OR LOWER(company) LIKE ${searchPattern}
        OR LOWER(personal_notes) LIKE ${searchPattern}
      )
      LIMIT ${limit}
    `
  );

  const rows = result.rows ?? [];

  const results = rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string | null,
    mobile: r.mobile as string | null,
    company: r.company as string | null,
    relationship: r.relationship as string | null,
  }));

  return NextResponse.json(results);
}
