import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getOdometerLogs,
  getTodayOdometerLog,
  getOdometerStats,
  createOrUpdateOdometerLog,
  deleteOdometerLog,
} from "@/lib/actions/odometer";

export interface OdometerLog {
  id: string;
  userId: string;
  logDate: string;
  startReading: string;
  endReading: string | null;
  distanceKm: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  fuelFilled: string | null;
  fuelCost: string | null;
  taRatePerKm: string | null;
  taAmount: string | null;
  purpose: string | null;
  linkedVisitIds: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function useTodayOdometerLog() {
  return useQuery({
    queryKey: ["odometer", "today"],
    queryFn: async () => {
      const res = await getTodayOdometerLog();
      if (!res.success) throw new Error(res.error || "Failed to fetch today's log");
      return res.data as OdometerLog | null;
    },
  });
}

export function useOdometerLogs(filters?: { month?: number; year?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["odometer", "logs", filters],
    queryFn: async () => {
      const res = await getOdometerLogs(undefined, filters);
      if (!res.success) throw new Error(res.error || "Failed to fetch odometer logs");
      return res.data as { logs: OdometerLog[]; summary: { totalDistance: number; totalTaAmount: number; totalFuelCost: number; totalDays: number } };
    },
  });
}

export function useOdometerStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["odometer", "stats", month, year],
    queryFn: async () => {
      const res = await getOdometerStats(undefined, month, year);
      if (!res.success) throw new Error(res.error || "Failed to fetch stats");
      return res.data as {
        totalDays: number;
        totalDistanceKm: number;
        totalTaAmount: number;
        totalFuelCost: number;
        avgDailyKm: number;
        longestDay: { date: string; distanceKm: number } | null;
      };
    },
  });
}

export function useCreateOrUpdateOdometerLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      const res = await createOrUpdateOdometerLog(data);
      if (!res.success) throw new Error(res.error || "Failed to save log");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odometer"] });
    },
  });
}

export function useDeleteOdometerLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteOdometerLog(id);
      if (!res.success) throw new Error(res.error || "Failed to delete log");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odometer"] });
    },
  });
}
