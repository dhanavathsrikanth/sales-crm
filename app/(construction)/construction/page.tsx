"use client";

import { useOrderStats, useRecentOrders } from "@/hooks/construction/use-orders";
import { useLeadStats, useLeads } from "@/hooks/construction/use-leads";
import { useProducts } from "@/hooks/construction/use-products";
import { useFollowups } from "@/hooks/construction/use-followups";
import { useVisits } from "@/hooks/construction/use-visits";
import { useConstrTodayOdometerLog } from "@/hooks/construction/use-mileage";
import StatCard from "@/components/construction-shared/StatCard";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import {
  Package,
  ShoppingCart,
  Building2,
  TrendingUp,
  CalendarCheck,
  MapPin,
  Plus,
  ArrowRight,
  Clock,
  Phone,
  MessageCircle,
  Users,
  Mail,
  CheckCircle,
  AlertCircle,
  Gauge,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  dispatched: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  whatsapp: <MessageCircle className="h-3 w-3" />,
  meeting: <Users className="h-3 w-3" />,
  site_visit: <MapPin className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
};

const typeBadgeColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  meeting: "bg-violet-100 text-violet-700",
  site_visit: "bg-orange-100 text-orange-700",
  email: "bg-sky-100 text-sky-700",
};

const quickActions = [
  { href: "/construction/leads/new", label: "New Lead", icon: Building2, color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { href: "/construction/orders/new", label: "New Order", icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
  { href: "/construction/followups", label: "Follow-ups", icon: CalendarCheck, color: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
  { href: "/construction/visits/new", label: "New Visit", icon: MapPin, color: "bg-violet-50 text-violet-600 hover:bg-violet-100" },
];

export default function DashboardPage() {
  const { data: orderStats, isLoading: loadingStats } = useOrderStats();
  const { data: recentOrders, isLoading: loadingOrders } = useRecentOrders(5);
  const { data: leadStats, isLoading: loadingLeads } = useLeadStats();
  const { data: products } = useProducts();
  const { data: pendingFollowups } = useFollowups({ status: "pending" });
  const { data: recentVisits } = useVisits();
  const { data: todayOdometer } = useConstrTodayOdometerLog();

  if (loadingStats || loadingOrders || loadingLeads) return <LoadingSpinner />;

  const overdueFollowups = pendingFollowups?.filter((f) => {
    const d = new Date(f.followupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }) ?? [];

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

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4 transition-all hover:shadow-sm",
                action.color.split(" ").slice(0, 2).join(" ")
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", action.color)}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Recent Orders</h2>
              <Link href="/construction/orders" className="text-xs sm:text-sm text-emerald-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
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

          {recentVisits && recentVisits.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
                <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Recent Visits</h2>
                <Link href="/construction/visits" className="text-xs sm:text-sm text-emerald-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {recentVisits.slice(0, 4).map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between px-4 sm:px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {visit.projectName || "Untitled Lead"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {visit.customerName || "—"} &middot; {visit.checkInAddress || "No address"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-zinc-500">
                        {visit.checkInTime ? new Date(visit.checkInTime).toLocaleDateString() : "—"}
                      </span>
                      {visit.durationMinutes != null ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {visit.durationMinutes}m
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Lead Pipeline</h2>
              <Link href="/construction/leads" className="text-xs sm:text-sm text-emerald-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
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
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">New</span>
                  <span className="font-semibold text-violet-600">{leadStats?.new ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
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
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Total Revenue</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(Number(orderStats?.revenue ?? 0))}</span>
                </div>
              </div>
            </div>
          </div>

          {pendingFollowups && pendingFollowups.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
                <h2 className="font-semibold text-zinc-900 text-sm sm:text-base">Pending Follow-ups</h2>
                <Link href="/construction/followups" className="text-xs sm:text-sm text-emerald-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {pendingFollowups.slice(0, 4).map((f) => {
                  const d = new Date(f.followupDate);
                  const today = new Date();
                  const isOverdue = d < today;
                  return (
                    <div key={f.id} className="px-4 sm:px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {f.projectName || "Untitled Lead"}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{f.customerName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {f.type && (
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", typeBadgeColors[f.type ?? "call"])}>
                              {typeIcons[f.type ?? "call"]}
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(f.followupDate).toLocaleDateString()}</span>
                        {f.followupTime && <span>{f.followupTime.slice(0, 5)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 text-sm sm:text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                Today's Mileage
              </h2>
              <Link href="/construction/mileage" className="text-xs sm:text-sm text-emerald-600 hover:underline flex items-center gap-1">
                Details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-4 sm:p-5">
              {todayOdometer ? (
                <div className="space-y-3">
                  {todayOdometer.endReading ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Day Complete</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Distance</p>
                          <p className="text-lg font-bold text-zinc-900">
                            {Number(todayOdometer.distanceKm || 0).toLocaleString("en-IN")} km
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">TA Earned</p>
                          <p className="text-lg font-bold text-emerald-600">
                            ₹{Number(todayOdometer.taAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Started: {Number(todayOdometer.startReading).toLocaleString("en-IN")} km</span>
                      </div>
                      <Link
                        href="/construction/mileage"
                        className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Close Day
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Gauge className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 mb-3">No reading logged today</p>
                  <Link
                    href="/construction/mileage"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Log Reading
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
