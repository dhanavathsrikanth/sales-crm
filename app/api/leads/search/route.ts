import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { or, like, eq, and, inArray, gte, lte, sql, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q) return NextResponse.json([]);

  const results = await db
    .select({
      id: leads.id,
      companyName: leads.companyName,
      contactPerson: leads.contactPerson,
      mobile: leads.mobile,
      city: leads.city,
      stage: leads.stage,
      leadScore: leads.leadScore,
    })
    .from(leads)
    .where(
      or(
        like(leads.companyName, `%${q}%`),
        like(leads.contactPerson, `%${q}%`),
        like(leads.mobile, `%${q}%`),
      ),
    )
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  return NextResponse.json(results);
}
