"use client";

import { useOrderStats, useRecentOrders } from "@/hooks/construction/use-orders";
import { useLeadStats } from "@/hooks/construction/use-leads";
import { useProducts } from "@/hooks/construction/use-products";
import StatCard from "@/components/construction-shared/StatCard";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { Package, ShoppingCart, Building2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  dispatched: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { data: orderStats, isLoading: loadingStats } = useOrderStats();
  const { data: recentOrders, isLoading: loadingOrders } = useRecentOrders(5);
  const { data: leadStats, isLoading: loadingLeads } = useLeadStats();
  const { data: products } = useProducts();

  if (loadingStats || loadingOrders || loadingLeads) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your construction materials business at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Total Orders"
          value={orderStats?.total ?? 0}
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Products"
          value={products?.length ?? 0}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Active Leads"
          value={leadStats?.active ?? 0}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Monthly Revenue"
          value={formatCurrency(Number(orderStats?.monthRevenue ?? 0))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Recent Orders</h2>
              <Link href="/construction/orders" className="text-xs sm:text-sm text-emerald-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/construction/orders/${order.id}`}
                    className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{order.orderNumber}</p>
                      <p className="text-xs text-zinc-500 truncate">{order.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                      <span className="text-xs sm:text-sm font-medium text-zinc-900">
                        {formatCurrency(Number(order.finalAmount))}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${statusColors[order.status ?? "pending"]}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-zinc-500">No orders yet</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Lead Pipeline</h2>
              <Link href="/construction/leads" className="text-xs sm:text-sm text-emerald-600 hover:underline">View all</Link>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Total</span>
                <span className="font-semibold text-zinc-900">{leadStats?.total ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Won</span>
                <span className="font-semibold text-emerald-600">{leadStats?.won ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Lost</span>
                <span className="font-semibold text-red-600">{leadStats?.lost ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Active</span>
                <span className="font-semibold text-blue-600">{leadStats?.active ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white mt-4">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Order Status</h2>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Pending</span>
                <span className="font-semibold text-zinc-900">{orderStats?.pending ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Confirmed</span>
                <span className="font-semibold text-zinc-900">{orderStats?.confirmed ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Dispatched</span>
                <span className="font-semibold text-zinc-900">{orderStats?.dispatched ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Delivered</span>
                <span className="font-semibold text-zinc-900">{orderStats?.delivered ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
