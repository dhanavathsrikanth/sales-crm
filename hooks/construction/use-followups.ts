import { useQuery } from "@tanstack/react-query";
import { getFollowups } from "@/lib/actions/construction/followups";

export function useFollowups(filters?: { status?: string; leadId?: string }) {
  return useQuery({
    queryKey: ["constr-followups", filters],
    queryFn: () => getFollowups(filters),
  });
}
