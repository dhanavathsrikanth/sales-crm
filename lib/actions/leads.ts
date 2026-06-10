"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  leads, activities, stageHistory, followups, visits, photos,
  customFieldValues, customFields, users,
} from "@/lib/db/schema";
import {
  eq, and, or, like, sql, desc, asc, inArray, gte, lte, count, isNull,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./users";

export interface LeadFilters {
  search?: string;
  stages?: string[];
  projectType?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  existingVendor?: string;
  sort?: string;
}

export interface LeadPagination {
  page: number;
  limit: number;
}

export async function getLeads(filters: LeadFilters = {}, pagination: LeadPagination = { page: 1, limit: 20 }) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const { page, limit } = pagination;
    const {
      search, stages, projectType, city, dateFrom, dateTo, existingVendor, sort,
    } = filters;

    const searchConditions: any[] = [eq(leads.userId, user.data.id)];

    if (search) {
      searchConditions.push(
        or(
          like(leads.companyName, `%${search}%`),
          like(leads.builderName, `%${search}%`),
          like(leads.contactPerson, `%${search}%`),
          like(leads.mobile, `%${search}%`),
        ),
      );
    }

    if (stages && stages.length > 0) {
      searchConditions.push(inArray(leads.stage, stages as any));
    }

    if (projectType) {
      searchConditions.push(eq(leads.projectType, projectType as any));
    }

    if (city) {
      searchConditions.push(like(leads.city, `%${city}%`));
    }

    if (dateFrom) {
      searchConditions.push(gte(leads.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      searchConditions.push(lte(leads.createdAt, new Date(dateTo)));
    }

    if (existingVendor === "yes") {
      searchConditions.push(sql`${leads.existingVendor} IS NOT NULL AND ${leads.existingVendor} != ''`);
    } else if (existingVendor === "no") {
      searchConditions.push(sql`(${leads.existingVendor} IS NULL OR ${leads.existingVendor} = '')`);
    }

    const where = and(...searchConditions);

    const total = await db.$count(leads, where);

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

    const data = await db
      .select()
      .from(leads)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      success: true as const,
      data: {
        leads: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getLeadById(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return { success: false as const, data: null, error: "Lead not found" };

    const [leadFollowups, leadVisits, leadPhotos, leadActivities, leadStageHistory] = await Promise.all([
      db.select().from(followups).where(eq(followups.leadId, id)).orderBy(desc(followups.createdAt)),
      db.select().from(visits).where(eq(visits.leadId, id)).orderBy(desc(visits.createdAt)),
      db.select().from(photos).where(eq(photos.leadId, id)).orderBy(desc(photos.createdAt)),
      db.select().from(activities).where(eq(activities.leadId, id)).orderBy(desc(activities.createdAt)),
      db.select().from(stageHistory).where(eq(stageHistory.leadId, id)).orderBy(desc(stageHistory.createdAt)),
    ]);

    const leadCustomFieldValues = await db
      .select()
      .from(customFieldValues)
      .where(eq(customFieldValues.leadId, id));

    const userCustomFields = await db
      .select()
      .from(customFields)
      .where(eq(customFields.userId, lead.userId!));

    const fieldMap = Object.fromEntries(userCustomFields.map((f) => [f.id, f]));
    const enrichedCustomFieldValues = leadCustomFieldValues.map((cfv) => ({
      ...cfv,
      fieldName: fieldMap[cfv.fieldId]?.fieldName ?? null,
      fieldLabel: fieldMap[cfv.fieldId]?.fieldLabel ?? null,
      fieldType: fieldMap[cfv.fieldId]?.fieldType ?? null,
      options: fieldMap[cfv.fieldId]?.options ?? null,
    }));

    return {
      success: true as const,
      data: {
        ...lead,
        followups: leadFollowups,
        visits: leadVisits,
        photos: leadPhotos,
        activities: leadActivities,
        stageHistory: leadStageHistory,
        customFieldValues: enrichedCustomFieldValues,
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function createLead(data: any) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const { customFieldValues: cfvBody, ...leadBody } = data;

    const sanitizeNum = (v: any) => {
      if (v === "" || v === undefined || v === null || (typeof v === "number" && isNaN(v))) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const cleanedLeadBody = {
      ...leadBody,
      numberOfFloors: sanitizeNum(leadBody.numberOfFloors),
      estimatedValue: sanitizeNum(leadBody.estimatedValue),
      builtUpArea: sanitizeNum(leadBody.builtUpArea),
      estimatedM3: sanitizeNum(leadBody.estimatedM3),
      monthlyM3: sanitizeNum(leadBody.monthlyM3),
      immediateM3: sanitizeNum(leadBody.immediateM3),
      gradeRequirements:
        Array.isArray(leadBody.gradeRequirements) && leadBody.gradeRequirements.length > 0
          ? leadBody.gradeRequirements
          : null,
      latitude: leadBody.latitude || null,
      longitude: leadBody.longitude || null,
      email: leadBody.email || null,
      existingVendor: leadBody.existingVendor || null,
      competitorNotes: leadBody.competitorNotes || null,
      remarks: leadBody.remarks || null,
      pincode: leadBody.pincode || null,
      siteAddress: leadBody.siteAddress || null,
      city: leadBody.city || null,
      district: leadBody.district || null,
      state: leadBody.state || null,
      expectedSupplyDate: leadBody.expectedSupplyDate || null,
      projectType: leadBody.projectType || null,
      projectStatus: leadBody.projectStatus || null,
      clientCompany: leadBody.clientCompany || null,
      builderName: leadBody.builderName || null,
      projectName: leadBody.projectName || null,
      designation: leadBody.designation || null,
    };

    const [lead] = await db
      .insert(leads)
      .values({
        userId: user.data.id,
        ...cleanedLeadBody,
        stage: leadBody.stage || "new",
      })
      .returning();

    if (cfvBody && Array.isArray(cfvBody)) {
      for (const cfv of cfvBody) {
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
      userId: user.data.id,
      type: "lead_created",
      description: lead.companyName
        ? `Lead created for ${lead.companyName}`
        : "New lead created",
    });

    revalidatePath("/leads");
    return { success: true as const, data: lead, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function updateLead(id: string, data: any) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const { customFieldValues: cfvBody, ...leadBody } = data;

    const [updated] = await db
      .update(leads)
      .set({ ...leadBody, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (!updated) return { success: false as const, data: null, error: "Lead not found" };

    if (cfvBody && Array.isArray(cfvBody)) {
      for (const cfv of cfvBody) {
        if (cfv.fieldId) {
          const [existing] = await db
            .select()
            .from(customFieldValues)
            .where(and(eq(customFieldValues.leadId, id), eq(customFieldValues.fieldId, cfv.fieldId)))
            .limit(1);
          if (existing) {
            await db
              .update(customFieldValues)
              .set({ value: String(cfv.value ?? ""), updatedAt: new Date() })
              .where(eq(customFieldValues.id, existing.id));
          } else {
            await db.insert(customFieldValues).values({
              leadId: id,
              fieldId: cfv.fieldId,
              value: String(cfv.value ?? ""),
            });
          }
        }
      }
    }

    await db.insert(activities).values({
      leadId: id,
      userId: user.data.id,
      type: "note_added",
      description: `Lead updated`,
      metadata: { updated: Object.keys(leadBody) },
    });

    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function deleteLead(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [deleted] = await db
      .delete(leads)
      .where(eq(leads.id, id))
      .returning({ id: leads.id, companyName: leads.companyName });

    if (!deleted) return { success: false as const, data: null, error: "Lead not found" };

    revalidatePath("/leads");
    return { success: true as const, data: deleted, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function updateLeadStage(id: string, newStage: string, notes?: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const [existing] = await db
      .select({ stage: leads.stage })
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);

    if (!existing) return { success: false as const, data: null, error: "Lead not found" };

    const [updated] = await db
      .update(leads)
      .set({ stage: newStage as any, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    await db.insert(stageHistory).values({
      leadId: id,
      userId: user.data.id,
      fromStage: existing.stage,
      toStage: newStage as any,
      notes: notes || null,
    });

    await db.insert(activities).values({
      leadId: id,
      userId: user.data.id,
      type: newStage === "won" ? "won" : newStage === "lost" ? "lost" : "stage_changed",
      description: `Stage changed from ${existing.stage} to ${newStage}`,
      metadata: { fromStage: existing.stage, toStage: newStage, notes },
    });

    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getLeadStats(userId?: string, dateRange?: { from: Date; to: Date }) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;
    const from = dateRange?.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = dateRange?.to || new Date();

    const userFilter = eq(leads.userId, targetUserId);
    const periodFilter = and(gte(leads.createdAt, from), lte(leads.createdAt, to));

    const [totalLeads, leadsThisMonth, leadsWon, leadsLost] = await Promise.all([
      db.$count(leads, userFilter),
      db.$count(leads, and(userFilter, periodFilter)),
      db.$count(leads, and(userFilter, eq(leads.stage, "won"))),
      db.$count(leads, and(userFilter, eq(leads.stage, "lost"))),
    ]);

    const m3Pipeline = await db
      .select({ total: sql<number>`COALESCE(SUM(estimated_m3), 0)` })
      .from(leads)
      .where(and(userFilter, sql`${leads.stage} NOT IN ('won', 'lost')`, sql`estimated_m3 IS NOT NULL`));

    const conversionRate = leadsThisMonth > 0 ? Math.round((leadsWon / leadsThisMonth) * 100) : 0;

    return {
      success: true as const,
      data: {
        totalLeads,
        leadsThisMonth,
        leadsWon,
        leadsLost,
        conversionRate,
        m3Pipeline: Number(m3Pipeline[0].total),
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function searchLeads(query: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    if (!query.trim()) return { success: true as const, data: [], error: null };

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
          like(leads.companyName, `%${query}%`),
          like(leads.contactPerson, `%${query}%`),
          like(leads.mobile, `%${query}%`),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(10);

    return { success: true as const, data: results, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function calculateLeadScore(leadId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) return { success: false as const, data: null, error: "Lead not found" };

    let score = 0;

    if (lead.mobile) score += 10;

    if (lead.estimatedM3) {
      score += 20;
      if (Number(lead.estimatedM3) > 100) score += 15;
    }

    const stageOrder = ["new", "contacted", "meeting_scheduled", "site_visited", "requirement_received", "quotation_sent", "negotiation", "trial_order", "won"];
    const stageIndex = stageOrder.indexOf(lead.stage || "");
    if (stageIndex > 0) {
      score += stageIndex * 10;
    }

    const [latestFollowup] = await db
      .select()
      .from(followups)
      .where(and(eq(followups.leadId, leadId), eq(followups.status, "completed")))
      .orderBy(desc(followups.completedAt))
      .limit(1);

    if (latestFollowup?.completedAt) {
      const daysSince = Math.floor((Date.now() - new Date(latestFollowup.completedAt).getTime()) / 86400000);
      if (daysSince < 7) score += 15;
    }

    const [latestVisit] = await db
      .select()
      .from(visits)
      .where(eq(visits.leadId, leadId))
      .orderBy(desc(visits.createdAt))
      .limit(1);

    if (latestVisit) score += 20;

    score = Math.min(score, 100);

    await db.update(leads).set({ leadScore: score }).where(eq(leads.id, leadId));

    return { success: true as const, data: score, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
