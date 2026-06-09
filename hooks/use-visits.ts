import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVisits,
  checkIn,
  checkOut,
  getActiveVisit,
} from "@/lib/actions/visits";
import { saveVisitOffline, addToSyncQueue, getActiveOfflineVisit, checkoutOfflineVisit } from "@/lib/visits/offline-db";

export interface Visit {
  id: string;
  leadId: string | null;
  userId: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLat: string | null;
  checkInLng: string | null;
  checkInAddress: string | null;
  checkOutLat: string | null;
  checkOutLng: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
  leadCity: string | null;
  leadSiteAddress: string | null;
}

export interface ActiveVisit {
  id: string;
  leadId: string | null;
  checkInTime: string | null;
  checkInLat: string | null;
  checkInLng: string | null;
  checkInAddress: string | null;
  notes: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
  leadSiteAddress: string | null;
}

export interface VisitsResponse {
  visits: Visit[];
  activeVisit: ActiveVisit | null;
  stats: {
    visitsToday: number;
    visitsThisWeek: number;
    visitsThisMonth: number;
    avgDuration: number;
    mostVisitedLead: { name: string; count: number } | null;
  };
}

export function useVisits(period: string = "all") {
  return useQuery({
    queryKey: ["visits", period],
    queryFn: async () => {
      const result = await getVisits({ period });
      if (!result.success) throw new Error(result.error || "Failed to fetch visits");
      return result.data as VisitsResponse;
    },
  });
}

export function useActiveVisit() {
  return useQuery({
    queryKey: ["visits", "active"],
    queryFn: async () => {
      const result = await getActiveVisit();
      if (!result.success) throw new Error(result.error || "Failed to fetch active visit");

      if (!result.data) {
        const offlineActive = await getActiveOfflineVisit();
        if (offlineActive) return offlineActive as unknown as ActiveVisit;
      }

      return result.data as ActiveVisit | null;
    },
    refetchInterval: 30000,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { leadId: string; checkInLat?: string; checkInLng?: string; checkInAddress?: string; notes?: string }) => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        const id = crypto.randomUUID();
        await saveVisitOffline({
          id,
          leadId: data.leadId,
          checkInTime: new Date().toISOString(),
          checkInLat: data.checkInLat,
          checkInLng: data.checkInLng,
          checkInAddress: data.checkInAddress,
          notes: data.notes,
          createdAt: new Date().toISOString(),
        });
        await addToSyncQueue({ action: "checkin", payload: JSON.stringify(data) });
        return { id, offline: true };
      }
      const result = await checkIn(data.leadId, data.checkInLat, data.checkInLng, data.checkInAddress, data.notes);
      if (!result.success) throw new Error(result.error || "Failed to check in");
      return result.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; checkOutLat?: string; checkOutLng?: string; notes?: string }) => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        await checkoutOfflineVisit(id, {
          checkOutTime: new Date().toISOString(),
          checkOutLat: data.checkOutLat,
          checkOutLng: data.checkOutLng,
          notes: data.notes,
        });
        await addToSyncQueue({ action: "checkout", payload: JSON.stringify({ id, ...data }) });
        return { id, offline: true };
      }
      const result = await checkOut(id, data.checkOutLat, data.checkOutLng, data.notes);
      if (!result.success) throw new Error(result.error || "Failed to check out");
      return result.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}
