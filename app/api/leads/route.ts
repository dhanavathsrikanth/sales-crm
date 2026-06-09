import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, activities, users, stageHistory, customFieldValues } from "@/lib/db/schema";
import { eq, and, or, like, sql, count, desc, asc, inArray, gte, lte } from "drizzle-orm";

const STAGE_ORDER = [
  "new", "contacted", "meeting_scheduled", "site_visited",
  "requirement_received", "quotation_sent", "negotiation", "trial_order", "won", "lost",
];

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const stages = searchParams.getAll("stage");
  const projectType = searchParams.get("projectType") || "";
  const city = searchParams.get("city") || "";
  const followupStatus = searchParams.get("followupStatus") || "";
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

  if (projectType) {
    conditions.push(eq(leads.projectType, projectType as any));
  }

  if (city) {
    conditions.push(like(leads.city, `%${city}%`));
  }

  if (dateFrom) {
    conditions.push(gte(leads.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(leads.createdAt, new Date(dateTo)));
  }

  if (existingVendor === "yes") {
    conditions.push(sql`${leads.existingVendor} IS NOT NULL AND ${leads.existingVendor} != ''`);
  } else if (existingVendor === "no") {
    conditions.push(sql`(${leads.existingVendor} IS NULL OR ${leads.existingVendor} = '')`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCount = await db.$count(leads, where);

  let orderBy;
  switch (sort) {
    case "name_asc":
      orderBy = [asc(leads.companyName)];
      break;
    case "name_desc":
      orderBy = [desc(leads.companyName)];
      break;
    case "score":
      orderBy = [desc(leads.leadScore)];
      break;
    case "m3":
      orderBy = [desc(leads.estimatedM3)];
      break;
    default:
      orderBy = [desc(leads.createdAt)];
  }

  const allLeads = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({
    leads: allLeads,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  const [lead] = await db
    .insert(leads)
    .values({
      userId: user.id,
      companyName: body.companyName,
      clientCompany: body.clientCompany,
      builderName: body.builderName,
      projectName: body.projectName,
      contactPerson: body.contactPerson,
      designation: body.designation,
      mobile: body.mobile,
      email: body.email,
      siteAddress: body.siteAddress,
      city: body.city,
      district: body.district,
      state: body.state,
      pincode: body.pincode,
      latitude: body.latitude,
      longitude: body.longitude,
      existingVendor: body.existingVendor,
      competitorNotes: body.competitorNotes,
      remarks: body.remarks,
      stage: body.stage || "new",
      projectType: body.projectType,
      projectStatus: body.projectStatus,
      estimatedValue: body.estimatedValue,
      numberOfFloors: body.numberOfFloors,
      builtUpArea: body.builtUpArea,
      estimatedM3: body.estimatedM3,
      monthlyM3: body.monthlyM3,
      immediateM3: body.immediateM3,
      gradeRequirements: body.gradeRequirements,
      expectedSupplyDate: body.expectedSupplyDate,
    })
    .returning();

  if (body.customFieldValues && Array.isArray(body.customFieldValues)) {
    for (const cfv of body.customFieldValues) {
      if (cfv.fieldId && cfv.value) {
        await db.insert(customFieldValues).values({
          leadId: lead.id,
          fieldId: cfv.fieldId,
          value: String(cfv.value),
        });
      }
    }
  }

  await db.insert(activities).values({
    leadId: lead.id,
    userId: user.id,
    type: "lead_created",
    description: body.companyName
      ? `Lead created for ${body.companyName}`
      : "New lead created",
  });

  return NextResponse.json(lead, { status: 201 });
}
