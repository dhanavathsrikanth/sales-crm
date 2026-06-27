import { useQuery } from "@tanstack/react-query";
import { getProducts, getProductById } from "@/lib/actions/construction/products";

export function useProducts(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["constr-products", filters],
    queryFn: () => getProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["constr-product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}
