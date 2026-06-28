import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConstrOdometerLogs,
  getConstrTodayOdometerLog,
  getConstrOdometerStats,
  createOrUpdateConstrOdometerLog,
  deleteConstrOdometerLog,
} from "@/lib/actions/construction/mileage";

export interface ConstrOdometerLog {
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
  createdAt: string | null;
  updatedAt: string | null;
}

export function useConstrTodayOdometerLog() {
  return useQuery({
    queryKey: ["constr-odometer", "today"],
    queryFn: async () => {
      const res = await getConstrTodayOdometerLog();
      if (!res.success) throw new Error(res.error || "Failed to fetch today's log");
      return res.data as ConstrOdometerLog | null;
    },
  });
}

export function useConstrOdometerLogs(filters?: { month?: number; year?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["constr-odometer", "logs", filters],
    queryFn: async () => {
      const res = await getConstrOdometerLogs(filters);
      if (!res.success) throw new Error(res.error || "Failed to fetch odometer logs");
      return res.data as { logs: ConstrOdometerLog[]; summary: { totalDistance: number; totalTaAmount: number; totalFuelCost: number; totalDays: number } };
    },
  });
}

export function useConstrOdometerStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["constr-odometer", "stats", month, year],
    queryFn: async () => {
      const res = await getConstrOdometerStats(month, year);
      if (!res.success) throw new Error(res.error || "Failed to fetch stats");
      return res.data as {
        totalDays: number;
        totalDistanceKm: number;
        totalTaAmount: number;
        totalFuelCost: number;
        avgDailyKm: number;
      };
    },
  });
}

export function useCreateOrUpdateConstrOdometerLog() {
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
    }) => {
      const res = await createOrUpdateConstrOdometerLog(data);
      if (!res.success) throw new Error(res.error || "Failed to save log");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["constr-odometer"] });
    },
  });
}

export function useDeleteConstrOdometerLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteConstrOdometerLog(id);
      if (!res.success) throw new Error(res.error || "Failed to delete log");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["constr-odometer"] });
    },
  });
}
