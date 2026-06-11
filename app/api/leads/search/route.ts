import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
      SELECT id, company_name, contact_person, mobile, city, stage, lead_score
      FROM leads
      WHERE user_id = ${user.id}
      AND (
        LOWER(company_name) LIKE ${searchPattern}
        OR LOWER(client_company) LIKE ${searchPattern}
        OR LOWER(builder_name) LIKE ${searchPattern}
        OR LOWER(project_name) LIKE ${searchPattern}
        OR LOWER(contact_person) LIKE ${searchPattern}
        OR LOWER(designation) LIKE ${searchPattern}
        OR LOWER(mobile) LIKE ${searchPattern}
        OR LOWER(email) LIKE ${searchPattern}
        OR LOWER(site_address) LIKE ${searchPattern}
        OR LOWER(city) LIKE ${searchPattern}
        OR LOWER(district) LIKE ${searchPattern}
        OR LOWER(state) LIKE ${searchPattern}
        OR LOWER(pincode) LIKE ${searchPattern}
        OR LOWER(existing_vendor) LIKE ${searchPattern}
        OR LOWER(competitor_notes) LIKE ${searchPattern}
        OR LOWER(remarks) LIKE ${searchPattern}
        OR LOWER(lost_reason) LIKE ${searchPattern}
        OR LOWER(stage::text) LIKE ${searchPattern}
        OR LOWER(project_type::text) LIKE ${searchPattern}
        OR LOWER(project_status::text) LIKE ${searchPattern}
      )
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  );

  const rows = result.rows ?? [];

  const results = rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    companyName: r.company_name as string | null,
    contactPerson: r.contact_person as string | null,
    mobile: r.mobile as string | null,
    city: r.city as string | null,
    stage: r.stage as string | null,
    leadScore: r.lead_score as number | null,
  }));

  return NextResponse.json(results);
}
