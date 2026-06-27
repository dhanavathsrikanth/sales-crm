import { useQuery } from "@tanstack/react-query";
import { getOrders, getOrderById, getOrderStats, getRecentOrders } from "@/lib/actions/construction/orders";

export function useOrders(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["constr-orders", filters],
    queryFn: () => getOrders(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["constr-order", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["constr-order-stats"],
    queryFn: () => getOrderStats(),
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["constr-recent-orders", limit],
    queryFn: () => getRecentOrders(limit),
  });
}
