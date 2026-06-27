import { useQuery } from "@tanstack/react-query";
import { getLeads, getLeadById, getLeadStats } from "@/lib/actions/construction/leads";

export function useLeads(filters?: { stage?: string; search?: string }) {
  return useQuery({
    queryKey: ["constr-leads", filters],
    queryFn: () => getLeads(filters),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["constr-lead", id],
    queryFn: () => getLeadById(id),
    enabled: !!id,
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["constr-lead-stats"],
    queryFn: () => getLeadStats(),
  });
}
