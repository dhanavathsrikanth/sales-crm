"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { odometerLogs, users } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./users";

export async function createOrUpdateOdometerLog(data: {
  logDate: string;
  startReading: string;
  endReading?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  fuelFilled?: string;
  fuelCost?: string;
  taRatePerKm?: string;
  purpose?: string;
  linkedVisitIds?: string[];
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const startReading = Number(data.startReading);
    const endReading = data.endReading ? Number(data.endReading) : undefined;
    const distanceKm = endReading !== undefined ? endReading - startReading : null;
    const taRatePerKm = Number(data.taRatePerKm || 4);
    const taAmount = distanceKm !== null ? distanceKm * taRatePerKm : null;

    const [existing] = await db
      .select()
      .from(odometerLogs)
      .where(
        and(
          eq(odometerLogs.userId, user.data.id),
          eq(odometerLogs.logDate, data.logDate),
        ),
      )
      .limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(odometerLogs)
        .set({
          startReading: data.startReading,
          endReading: data.endReading || null,
          distanceKm: distanceKm !== null ? String(distanceKm) : null,
          vehicleType: (data.vehicleType as any) || existing.vehicleType,
          vehicleNumber: data.vehicleNumber ?? existing.vehicleNumber,
          fuelFilled: data.fuelFilled || null,
          fuelCost: data.fuelCost || null,
          taRatePerKm: String(taRatePerKm),
          taAmount: taAmount !== null ? String(taAmount) : null,
          purpose: data.purpose ?? existing.purpose,
          linkedVisitIds: data.linkedVisitIds || existing.linkedVisitIds,
          updatedAt: new Date(),
        })
        .where(eq(odometerLogs.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(odometerLogs)
        .values({
          userId: user.data.id,
          logDate: data.logDate,
          startReading: data.startReading,
          endReading: data.endReading || null,
          distanceKm: distanceKm !== null ? String(distanceKm) : null,
          vehicleType: (data.vehicleType as any) || "motorbike",
          vehicleNumber: data.vehicleNumber || null,
          fuelFilled: data.fuelFilled || null,
          fuelCost: data.fuelCost || null,
          taRatePerKm: String(taRatePerKm),
          taAmount: taAmount !== null ? String(taAmount) : null,
          purpose: data.purpose || null,
          linkedVisitIds: data.linkedVisitIds || null,
        })
        .returning();
    }

    revalidatePath("/odometer");
    return { success: true as const, data: result, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getOdometerLogs(
  userId?: string,
  filters?: { month?: number; year?: number; dateFrom?: string; dateTo?: string },
) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const conditions = [eq(odometerLogs.userId, targetUserId)];

    if (filters?.dateFrom) {
      conditions.push(gte(odometerLogs.logDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(odometerLogs.logDate, filters.dateTo));
    }
    if (filters?.month !== undefined && filters?.year !== undefined) {
      const monthStr = String(filters.month).padStart(2, "0");
      conditions.push(
        sql`EXTRACT(MONTH FROM ${odometerLogs.logDate}::date) = ${filters.month}`,
      );
      conditions.push(
        sql`EXTRACT(YEAR FROM ${odometerLogs.logDate}::date) = ${filters.year}`,
      );
    }

    const data = await db
      .select()
      .from(odometerLogs)
      .where(and(...conditions))
      .orderBy(desc(odometerLogs.logDate));

    const totals = await db
      .select({
        totalDistance: sql<number>`COALESCE(SUM(distance_km), 0)`,
        totalTaAmount: sql<number>`COALESCE(SUM(ta_amount), 0)`,
        totalFuelCost: sql<number>`COALESCE(SUM(fuel_cost), 0)`,
        totalDays: sql<number>`COUNT(*)`,
      })
      .from(odometerLogs)
      .where(and(...conditions));

    return {
      success: true as const,
      data: {
        logs: data,
        summary: {
          totalDistance: Number(totals[0].totalDistance),
          totalTaAmount: Number(totals[0].totalTaAmount),
          totalFuelCost: Number(totals[0].totalFuelCost),
          totalDays: Number(totals[0].totalDays),
        },
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getTodayOdometerLog(userId?: string) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const today = new Date().toISOString().split("T")[0];

    const [log] = await db
      .select()
      .from(odometerLogs)
      .where(
        and(
          eq(odometerLogs.userId, targetUserId),
          eq(odometerLogs.logDate, today),
        ),
      )
      .limit(1);

    return { success: true as const, data: log || null, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getOdometerStats(userId?: string, month?: number, year?: number) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(userId);
    const targetUserId = user.data?.id || authId;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const conditions = [
      eq(odometerLogs.userId, targetUserId),
      sql`EXTRACT(MONTH FROM ${odometerLogs.logDate}::date) = ${targetMonth}`,
      sql`EXTRACT(YEAR FROM ${odometerLogs.logDate}::date) = ${targetYear}`,
    ];

    const stats = await db
      .select({
        totalDays: sql<number>`COUNT(*)`,
        totalDistanceKm: sql<number>`COALESCE(SUM(distance_km), 0)`,
        totalTaAmount: sql<number>`COALESCE(SUM(ta_amount), 0)`,
        totalFuelCost: sql<number>`COALESCE(SUM(fuel_cost), 0)`,
        avgDailyKm: sql<number>`COALESCE(AVG(distance_km), 0)`,
      })
      .from(odometerLogs)
      .where(and(...conditions));

    const [longestDay] = await db
      .select({
        date: odometerLogs.logDate,
        distanceKm: odometerLogs.distanceKm,
      })
      .from(odometerLogs)
      .where(and(...conditions, sql`distance_km IS NOT NULL`))
      .orderBy(desc(odometerLogs.distanceKm))
      .limit(1);

    return {
      success: true as const,
      data: {
        totalDays: Number(stats[0].totalDays),
        totalDistanceKm: Number(stats[0].totalDistanceKm),
        totalTaAmount: Number(stats[0].totalTaAmount),
        totalFuelCost: Number(stats[0].totalFuelCost),
        avgDailyKm: Math.round(Number(stats[0].avgDailyKm)),
        longestDay: longestDay
          ? { date: longestDay.date, distanceKm: Number(longestDay.distanceKm) }
          : null,
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function deleteOdometerLog(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [deleted] = await db
      .delete(odometerLogs)
      .where(eq(odometerLogs.id, id))
      .returning({ id: odometerLogs.id });

    if (!deleted) return { success: false as const, data: null, error: "Log not found" };

    revalidatePath("/odometer");
    return { success: true as const, data: deleted, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function setDefaultVehicleSettings(data: {
  vehicleNumber?: string;
  taRate?: number;
  vehicleType?: string;
  vehicleModel?: string;
  monthlyKmTarget?: number;
  remindStartTime?: string;
  remindEndTime?: string;
  alertMissingReadings?: boolean;
}) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser(clerkId);
    if (!user.data) return { success: false as const, data: null, error: "User not found" };

    const [updated] = await db
      .update(users)
      .set({
        defaultVehicleNumber: data.vehicleNumber ?? undefined,
        defaultTaRate: data.taRate !== undefined ? String(data.taRate) : undefined,
        defaultVehicleType: data.vehicleType ?? undefined,
        vehicleModel: data.vehicleModel ?? undefined,
        monthlyKmTarget: data.monthlyKmTarget !== undefined ? String(data.monthlyKmTarget) : undefined,
        remindStartTime: data.remindStartTime ?? undefined,
        remindEndTime: data.remindEndTime ?? undefined,
        alertMissingReadings: data.alertMissingReadings ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.data.id))
      .returning();

    revalidatePath("/settings");
    return { success: true as const, data: updated, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
