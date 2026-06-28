"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { constrOdometerLogs } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getOrCreateUser } from "../users";

export async function createOrUpdateConstrOdometerLog(data: {
  logDate: string;
  startReading: string;
  endReading?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  fuelFilled?: string;
  fuelCost?: string;
  taRatePerKm?: string;
  purpose?: string;
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
      .from(constrOdometerLogs)
      .where(
        and(
          eq(constrOdometerLogs.userId, user.data.id),
          eq(constrOdometerLogs.logDate, data.logDate),
        ),
      )
      .limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(constrOdometerLogs)
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
          updatedAt: new Date(),
        })
        .where(eq(constrOdometerLogs.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(constrOdometerLogs)
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
        })
        .returning();
    }

    return { success: true as const, data: result, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getConstrOdometerLogs(
  filters?: { month?: number; year?: number; dateFrom?: string; dateTo?: string },
) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser();
    const targetUserId = user.data?.id || authId;

    const conditions = [eq(constrOdometerLogs.userId, targetUserId)];

    if (filters?.dateFrom) {
      conditions.push(gte(constrOdometerLogs.logDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(constrOdometerLogs.logDate, filters.dateTo));
    }
    if (filters?.month !== undefined && filters?.year !== undefined) {
      conditions.push(
        sql`EXTRACT(MONTH FROM ${constrOdometerLogs.logDate}::date) = ${filters.month}`,
      );
      conditions.push(
        sql`EXTRACT(YEAR FROM ${constrOdometerLogs.logDate}::date) = ${filters.year}`,
      );
    }

    const data = await db
      .select()
      .from(constrOdometerLogs)
      .where(and(...conditions))
      .orderBy(desc(constrOdometerLogs.logDate));

    const totals = await db
      .select({
        totalDistance: sql<number>`COALESCE(SUM(distance_km), 0)`,
        totalTaAmount: sql<number>`COALESCE(SUM(ta_amount), 0)`,
        totalFuelCost: sql<number>`COALESCE(SUM(fuel_cost), 0)`,
        totalDays: sql<number>`COUNT(*)`,
      })
      .from(constrOdometerLogs)
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

export async function getConstrTodayOdometerLog() {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser();
    const targetUserId = user.data?.id || authId;

    const today = new Date().toISOString().split("T")[0];

    const [log] = await db
      .select()
      .from(constrOdometerLogs)
      .where(
        and(
          eq(constrOdometerLogs.userId, targetUserId),
          eq(constrOdometerLogs.logDate, today),
        ),
      )
      .limit(1);

    return { success: true as const, data: log || null, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function getConstrOdometerStats(month?: number, year?: number) {
  try {
    const { userId: authId } = await auth();
    if (!authId) return { success: false as const, data: null, error: "Unauthorized" };

    const user = await getOrCreateUser();
    const targetUserId = user.data?.id || authId;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const conditions = [
      eq(constrOdometerLogs.userId, targetUserId),
      sql`EXTRACT(MONTH FROM ${constrOdometerLogs.logDate}::date) = ${targetMonth}`,
      sql`EXTRACT(YEAR FROM ${constrOdometerLogs.logDate}::date) = ${targetYear}`,
    ];

    const stats = await db
      .select({
        totalDays: sql<number>`COUNT(*)`,
        totalDistanceKm: sql<number>`COALESCE(SUM(distance_km), 0)`,
        totalTaAmount: sql<number>`COALESCE(SUM(ta_amount), 0)`,
        totalFuelCost: sql<number>`COALESCE(SUM(fuel_cost), 0)`,
        avgDailyKm: sql<number>`COALESCE(AVG(distance_km), 0)`,
      })
      .from(constrOdometerLogs)
      .where(and(...conditions));

    return {
      success: true as const,
      data: {
        totalDays: Number(stats[0].totalDays),
        totalDistanceKm: Number(stats[0].totalDistanceKm),
        totalTaAmount: Number(stats[0].totalTaAmount),
        totalFuelCost: Number(stats[0].totalFuelCost),
        avgDailyKm: Math.round(Number(stats[0].avgDailyKm)),
      },
      error: null,
    };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}

export async function deleteConstrOdometerLog(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, data: null, error: "Unauthorized" };

    const [deleted] = await db
      .delete(constrOdometerLogs)
      .where(eq(constrOdometerLogs.id, id))
      .returning({ id: constrOdometerLogs.id });

    if (!deleted) return { success: false as const, data: null, error: "Log not found" };

    return { success: true as const, data: deleted, error: null };
  } catch (error) {
    return { success: false as const, data: null, error: String(error) };
  }
}
