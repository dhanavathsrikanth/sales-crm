import { useQuery } from "@tanstack/react-query";
import { getCustomers, getCustomerById } from "@/lib/actions/construction/contacts";

export function useCustomers(filters?: { search?: string; type?: string }) {
  return useQuery({
    queryKey: ["constr-customers", filters],
    queryFn: () => getCustomers(filters),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["constr-customer", id],
    queryFn: () => getCustomerById(id),
    enabled: !!id,
  });
}
