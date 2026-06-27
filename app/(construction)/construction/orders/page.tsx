"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/construction/use-orders";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { ShoppingCart, Plus, Search } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  dispatched: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [status, setStatus] = useState<string | undefined>();
  const { data: orders, isLoading } = useOrders({ status });

  const filters = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Dispatched", value: "dispatched" },
    { label: "Delivered", value: "delivered" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage your sales orders"
        action={
          <Link
            href="/construction/orders/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Link>
        }
      />

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatus(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
              status === f.value
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-7 w-7" />}
          title="No orders yet"
          description="Create your first order to get started."
          action={
            <Link
              href="/construction/orders/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          }
        />
      ) : (
        <div>
          <div className="hidden md:block rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3">Order #</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3">Customer</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-zinc-500 px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => window.location.href = `/construction/orders/${order.id}`}
                      className="hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-900">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-700">{order.customerName || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-500">{order.orderDate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[order.status ?? "pending"])}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(order.finalAmount))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/construction/orders/${order.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-900">{order.orderNumber}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[order.status ?? "pending"])}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">{order.customerName || "—"}</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(Number(order.finalAmount))}</span>
                </div>
                {order.orderDate && (
                  <p className="text-xs text-zinc-400 mt-1">{order.orderDate}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
