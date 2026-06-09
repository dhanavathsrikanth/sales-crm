import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { or, like, eq, and, inArray, gte, lte, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const stages = searchParams.getAll("stage");
  const projectType = searchParams.get("projectType") || "";
  const city = searchParams.get("city") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const existingVendor = searchParams.get("existingVendor") || "";
  const sort = searchParams.get("sort") || "recent";

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(leads.companyName, `%${search}%`),
        like(leads.builderName, `%${search}%`),
        like(leads.contactPerson, `%${search}%`),
        like(leads.mobile, `%${search}%`),
      ),
    );
  }

  if (stages.length > 0) {
    conditions.push(inArray(leads.stage, stages as any));
  }

  if (projectType) conditions.push(eq(leads.projectType, projectType as any));
  if (city) conditions.push(like(leads.city, `%${city}%`));
  if (dateFrom) conditions.push(gte(leads.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(leads.createdAt, new Date(dateTo)));
  if (existingVendor === "yes") conditions.push(sql`${leads.existingVendor} IS NOT NULL AND ${leads.existingVendor} != ''`);
  else if (existingVendor === "no") conditions.push(sql`(${leads.existingVendor} IS NULL OR ${leads.existingVendor} = '')`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortMap: Record<string, any> = {
    name_asc: leads.companyName,
    name_desc: [desc(leads.companyName)],
    score: desc(leads.leadScore),
    m3: desc(leads.estimatedM3),
  };
  const orderBy = sort === "recent" ? desc(leads.createdAt) : sortMap[sort] || desc(leads.createdAt);

  const allLeads = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(orderBy);

  const csvHeader = "Company Name,Builder Name,Contact Person,Mobile,Email,City,State,Stage,Project Type,Estimated M3,Lead Score,Created At\n";
  const csvRows = allLeads
    .map((l) =>
      [
        `"${(l.companyName || "").replace(/"/g, '""')}"`,
        `"${(l.builderName || "").replace(/"/g, '""')}"`,
        `"${(l.contactPerson || "").replace(/"/g, '""')}"`,
        l.mobile || "",
        l.email || "",
        l.city || "",
        l.state || "",
        l.stage || "",
        l.projectType || "",
        l.estimatedM3 || "",
        l.leadScore || "",
        l.createdAt ? new Date(l.createdAt).toISOString() : "",
      ].join(","),
    )
    .join("\n");

  const csv = csvHeader + csvRows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads_export_${Date.now()}.csv"`,
    },
  });
}
