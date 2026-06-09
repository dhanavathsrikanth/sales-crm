"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";

export async function getActivities(leadId: string, limit: number = 20) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const data = await db
      .select()
      .from(activities)
      .where(eq(activities.leadId, leadId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    return { success: true as const, data, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function logActivity(
  leadId: string,
  userId: string,
  type: string,
  description: string,
  metadata?: Record<string, any>,
) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const [activity] = await db
      .insert(activities)
      .values({
        leadId,
        userId: targetUserId,
        type: type as any,
        description,
        metadata: metadata || null,
      })
      .returning();

    return { success: true as const, data: activity, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
