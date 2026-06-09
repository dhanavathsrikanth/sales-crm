import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFollowups,
  createFollowup,
  updateFollowup,
  completeFollowup,
  getTodayFollowups,
} from "@/lib/actions/followups";

export interface FollowUp {
  id: string;
  leadId: string | null;
  userId: string | null;
  followupDate: string | null;
  followupTime: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
  leadBuilderName: string | null;
}

export interface FollowUpsResponse {
  followups: FollowUp[];
  daysWithFollowups: string[];
  stats: {
    todayPending: number;
    todayCompleted: number;
    weekTotal: number;
  };
}

export function useFollowUps(tab: string = "today") {
  return useQuery({
    queryKey: ["followups", tab],
    queryFn: async () => {
      const result = await getFollowups({ tab });
      if (!result.success) throw new Error(result.error || "Failed to fetch follow-ups");
      return result.data as FollowUpsResponse;
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      leadId: string;
      followupDate: string;
      followupTime?: string;
      type?: string;
      priority?: string;
      notes?: string;
    }) => {
      const result = await createFollowup(data);
      if (!result.success) throw new Error(result.error || "Failed to create follow-up");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; followupDate?: string; followupTime?: string }) => {
      const result = await updateFollowup(id, data);
      if (!result.success) throw new Error(result.error || "Failed to update follow-up");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCompleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const result = await completeFollowup(id, notes);
      if (!result.success) throw new Error(result.error || "Failed to complete follow-up");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTodayFollowups() {
  return useQuery({
    queryKey: ["followups", "today"],
    queryFn: async () => {
      const result = await getTodayFollowups();
      if (!result.success) throw new Error(result.error || "Failed to fetch today's follow-ups");
      return result.data;
    },
  });
}
