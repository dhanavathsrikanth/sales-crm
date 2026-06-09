"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getOrCreateUser(clerkId?: string) {
  try {
    const { userId: authClerkId } = await auth();
    const id = clerkId || authClerkId;
    if (!id) return { success: false as const, data: null, error: "Unauthorized" };

    const [existing] = await db.select().from(users).where(eq(users.clerkId, id)).limit(1);
    if (existing) return { success: true as const, data: existing, error: null };

    const [created] = await db
      .insert(users)
      .values({ clerkId: id })
      .returning();

    return { success: true as const, data: created, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function updateUser(clerkId: string, data: {
  name?: string; email?: string; phone?: string; company?: string; role?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();

    revalidatePath("/settings");
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
