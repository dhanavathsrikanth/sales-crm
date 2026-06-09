"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const companyName = formData.get("companyName") as string;
  if (!companyName?.trim()) throw new Error("Company name is required");

  const [lead] = await db
    .insert(leads)
    .values({
      userId: userId,
      companyName,
      contactPerson: (formData.get("contactPerson") as string) || undefined,
      mobile: (formData.get("mobile") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
    })
    .returning();

  await db.insert(activities).values({
    leadId: lead.id,
    userId: userId,
    type: "lead_created",
    description: `Lead created for ${companyName}`,
  });

  revalidatePath("/leads");
  return lead;
}

export async function updateLeadStage(
  leadId: string,
  stage: string,
  notes?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [existing] = await db
    .select({ stage: leads.stage })
    .from(leads)
    .where(eq(leads.id, leadId));

  await db
    .update(leads)
    .set({ stage: stage as any, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  if (existing) {
    await db.insert(activities).values({
      leadId: leadId,
      userId: userId,
      type: "stage_changed",
      description: `Stage changed from ${existing.stage} to ${stage}`,
      metadata: { fromStage: existing.stage, toStage: stage, notes },
    });
  }

  revalidatePath(`/leads/${leadId}`);
}
