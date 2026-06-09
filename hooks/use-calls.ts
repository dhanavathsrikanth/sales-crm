import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CallLog {
  id: string;
  userId: string | null;
  contactId: string | null;
  leadId: string | null;
  phoneNumber: string | null;
  direction: "inbound" | "outbound";
  status: "connected" | "missed" | "no_answer" | "busy";
  duration: number | null;
  notes: string | null;
  calledAt: string | null;
  createdAt: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactCompany: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
}

export interface CallsResponse {
  calls: CallLog[];
  stats: {
    callsToday: number;
    avgDuration: number;
    connectRate: number;
    callsThisWeek: number;
    totalDurationToday: number;
  };
  frequentContacts: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    company: string | null;
    phoneNumber: string | null;
    callCount: number;
  }>;
  missedCalls: CallLog[];
}

export function useCalls(period: string = "all", search: string = "") {
  const params = new URLSearchParams();
  if (period !== "all") params.set("period", period);
  if (search) params.set("search", search);

  return useQuery<CallsResponse>({
    queryKey: ["calls", period, search],
    queryFn: async () => {
      const res = await fetch(`/api/calls?${params}`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      return res.json();
    },
  });
}

export function useLogCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      contactId?: string;
      leadId?: string;
      phoneNumber?: string;
      direction: string;
      status: string;
      duration?: number;
      notes?: string;
    }) => {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log call");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calls"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; notes?: string; contactId?: string; leadId?: string }) => {
      const res = await fetch(`/api/calls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update call");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calls"] }),
  });
}
