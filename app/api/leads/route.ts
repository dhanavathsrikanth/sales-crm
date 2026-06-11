import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, activities, users, stageHistory, customFieldValues } from "@/lib/db/schema";
import { eq, and, or, like, sql, count, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { generateEmbedding, prepareLeadText } from "@/lib/embeddings";

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
    const searchPattern = `%${search.toLowerCase()}%`;
    conditions.push(
      sql`(
        LOWER(${leads.companyName}) LIKE ${searchPattern}
        OR LOWER(${leads.clientCompany}) LIKE ${searchPattern}
        OR LOWER(${leads.builderName}) LIKE ${searchPattern}
        OR LOWER(${leads.projectName}) LIKE ${searchPattern}
        OR LOWER(${leads.contactPerson}) LIKE ${searchPattern}
        OR LOWER(${leads.designation}) LIKE ${searchPattern}
        OR LOWER(${leads.mobile}) LIKE ${searchPattern}
        OR LOWER(${leads.email}) LIKE ${searchPattern}
        OR LOWER(${leads.siteAddress}) LIKE ${searchPattern}
        OR LOWER(${leads.city}) LIKE ${searchPattern}
        OR LOWER(${leads.district}) LIKE ${searchPattern}
        OR LOWER(${leads.state}) LIKE ${searchPattern}
        OR LOWER(${leads.pincode}) LIKE ${searchPattern}
        OR LOWER(${leads.existingVendor}) LIKE ${searchPattern}
        OR LOWER(${leads.competitorNotes}) LIKE ${searchPattern}
        OR LOWER(${leads.remarks}) LIKE ${searchPattern}
        OR LOWER(${leads.lostReason}) LIKE ${searchPattern}
        OR LOWER(${leads.stage}::text) LIKE ${searchPattern}
        OR LOWER(${leads.projectType}::text) LIKE ${searchPattern}
        OR LOWER(${leads.projectStatus}::text) LIKE ${searchPattern}
      )`,
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

  const [countResult] = where
    ? await db.select({ value: sql<number>`count(*)` }).from(leads).where(where)
    : await db.select({ value: sql<number>`count(*)` }).from(leads);
  const totalCount = Number(countResult?.value ?? 0);

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
      clientCompany: body.clientCompany || null,
      builderName: body.builderName || null,
      projectName: body.projectName || null,
      contactPerson: body.contactPerson,
      designation: body.designation || null,
      mobile: body.mobile,
      email: body.email || null,
      siteAddress: body.siteAddress || null,
      city: body.city || null,
      district: body.district || null,
      state: body.state || null,
      pincode: body.pincode || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      existingVendor: body.existingVendor || null,
      competitorNotes: body.competitorNotes || null,
      remarks: body.remarks || null,
      stage: body.stage || "new",
      projectType: body.projectType || null,
      projectStatus: body.projectStatus || null,
      estimatedValue: body.estimatedValue ? String(body.estimatedValue) : null,
      numberOfFloors: body.numberOfFloors ? Number(body.numberOfFloors) : null,
      builtUpArea: body.builtUpArea ? String(body.builtUpArea) : null,
      estimatedM3: body.estimatedM3 ? String(body.estimatedM3) : null,
      monthlyM3: body.monthlyM3 ? String(body.monthlyM3) : null,
      immediateM3: body.immediateM3 ? String(body.immediateM3) : null,
      gradeRequirements:
        Array.isArray(body.gradeRequirements) && body.gradeRequirements.length > 0
          ? body.gradeRequirements
          : [],
      expectedSupplyDate: body.expectedSupplyDate || null,
    } as any)
    .returning();

  try {
    const text = prepareLeadText(lead);
    if (text) {
      const embedding = await generateEmbedding(text);
      await db
        .update(leads)
        .set({ embedding: sql`${JSON.stringify(embedding)}::vector` })
        .where(eq(leads.id, lead.id));
    }
  } catch (e) {
    console.error("Embedding generation failed for lead", lead.id, e);
  }

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
