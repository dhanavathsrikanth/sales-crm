"use server";

import { db } from "@/lib/db";
import { constrLeads, constrCustomers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { getOrCreateUser } from "../users";

export async function getLeads(filters?: { stage?: string; search?: string }) {
  const conditions = [];

  if (filters?.stage) {
    conditions.push(eq(constrLeads.stage, filters.stage as any));
  }

  const leads = await db
    .select({
      id: constrLeads.id,
      projectName: constrLeads.projectName,
      siteAddress: constrLeads.siteAddress,
      city: constrLeads.city,
      stage: constrLeads.stage,
      leadScore: constrLeads.leadScore,
      estimatedValue: constrLeads.estimatedValue,
      productInterest: constrLeads.productInterest,
      createdAt: constrLeads.createdAt,
      customerName: constrCustomers.name,
      customerPhone: constrCustomers.phone,
      customerId: constrCustomers.id,
    })
    .from(constrLeads)
    .leftJoin(constrCustomers, eq(constrLeads.customerId, constrCustomers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(constrLeads.createdAt));

  return leads;
}

export async function getLeadById(id: string) {
  const [lead] = await db
    .select()
    .from(constrLeads)
    .where(eq(constrLeads.id, id));

  if (!lead) return null;

  const customer = lead.customerId
    ? await db.select().from(constrCustomers).where(eq(constrCustomers.id, lead.customerId)).then(r => r[0])
    : null;

  return { ...lead, customer };
}

export async function createLead(data: {
  customerId?: string;
  projectName?: string;
  siteAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  projectType?: string;
  estimatedValue?: number;
  productInterest?: string[];
  estimatedQuantity?: number;
  stage?: string;
  remarks?: string;
  siteLat?: number;
  siteLng?: number;
}) {
  const { userId } = await auth();
  const user = await getOrCreateUser(userId ?? undefined);
  if (!user.data) throw new Error("Unauthorized");

  const [lead] = await db.insert(constrLeads).values({
    userId: user.data.id,
    customerId: data.customerId as any,
    projectName: data.projectName,
    siteAddress: data.siteAddress,
    city: data.city,
    district: data.district,
    state: data.state,
    projectType: data.projectType,
    estimatedValue: data.estimatedValue?.toString(),
    productInterest: data.productInterest,
    estimatedQuantity: data.estimatedQuantity?.toString(),
    stage: (data.stage as any) ?? "new",
    remarks: data.remarks,
    siteLat: data.siteLat?.toString(),
    siteLng: data.siteLng?.toString(),
  }).returning();

  return lead;
}

export async function updateLeadStage(id: string, stage: string) {
  const [lead] = await db
    .update(constrLeads)
    .set({ stage: stage as any })
    .where(eq(constrLeads.id, id))
    .returning();
  return lead;
}

export async function getLeadStats() {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      new: sql<number>`count(*) filter (where ${constrLeads.stage} = 'new')`,
      active: sql<number>`count(*) filter (where ${constrLeads.stage} not in ('won', 'lost'))`,
      won: sql<number>`count(*) filter (where ${constrLeads.stage} = 'won')`,
      lost: sql<number>`count(*) filter (where ${constrLeads.stage} = 'lost')`,
    })
    .from(constrLeads);

  return result[0];
}
