import { useQuery } from "@tanstack/react-query";
import { getVisits } from "@/lib/actions/construction/visits";

export function useVisits() {
  return useQuery({
    queryKey: ["constr-visits"],
    queryFn: () => getVisits(),
  });
}
