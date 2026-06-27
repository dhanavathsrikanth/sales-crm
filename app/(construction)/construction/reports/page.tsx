"use client";

import { useMemo } from "react";
import { useOrderStats, useOrders } from "@/hooks/construction/use-orders";
import { useLeadStats } from "@/hooks/construction/use-leads";
import { useProducts } from "@/hooks/construction/use-products";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, DollarSign, Target, Package } from "lucide-react";

const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
const PIE_COLORS = ["#3b82f6", "#f59e0b"];

export default function ReportsPage() {
  const { data: orderStats, isLoading: loadingOrders } = useOrderStats();
  const { data: orders } = useOrders();
  const { data: leadStats, isLoading: loadingLeads } = useLeadStats();
  const { data: products } = useProducts();

  const monthlyRevenueData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const monthMap: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    orders.forEach((order) => {
      const d = new Date(order.orderDate ?? order.createdAt ?? new Date());
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap[key] = (monthMap[key] || 0) + Number(order.finalAmount ?? 0);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split("-");
        return { name: `${monthNames[Number(month)]} '${year.slice(2)}`, revenue: value };
      });
  }, [orders]);

  const productPieData = useMemo(() => {
    const aac = products?.filter((p) => p.category === "aac_block").length || 0;
    const brick = products?.filter((p) => p.category === "red_brick").length || 0;
    return [
      { name: "AAC Blocks", value: aac },
      { name: "Red Bricks", value: brick },
    ].filter((d) => d.value > 0);
  }, [products]);

  const funnelData = useMemo(() => {
    const total = leadStats?.total ?? 0;
    const active = leadStats?.active ?? 0;
    const won = leadStats?.won ?? 0;
    const lost = leadStats?.lost ?? 0;
    return [
      { label: "Total Leads", count: total, pct: total > 0 ? 100 : 0 },
      { label: "Active", count: active, pct: total > 0 ? Math.round((active / total) * 100) : 0 },
      { label: "Won", count: won, pct: total > 0 ? Math.round((won / total) * 100) : 0 },
      { label: "Lost", count: lost, pct: total > 0 ? Math.round((lost / total) * 100) : 0 },
    ];
  }, [leadStats]);

  if (loadingOrders || loadingLeads) return <LoadingSpinner />;

  const totalRevenue = Number(orderStats?.revenue ?? 0);
  const avgOrderValue = (orderStats?.total ?? 0) > 0 ? totalRevenue / (orderStats?.total ?? 1) : 0;
  const totalLeads = leadStats?.total ?? 0;
  const wonLeads = leadStats?.won ?? 0;
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const totalProducts = products?.length ?? 0;

  const metrics = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Avg Order Value", value: formatCurrency(avgOrderValue), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Products", value: String(totalProducts), icon: Package, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Business analytics and insights" />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${m.bg}`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{m.label}</p>
              <p className="text-lg font-bold text-zinc-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Revenue Overview</h3>
          {monthlyRevenueData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#71717a" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-zinc-400">
              No order data yet
            </div>
          )}
        </div>

        {/* Lead Conversion Funnel */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Lead Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const barWidth = step.pct;
              return (
                <div key={step.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600">{step.label}</span>
                    <span className="font-semibold text-zinc-900">
                      {step.count} <span className="text-zinc-400 font-normal">({step.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-8 bg-zinc-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${Math.max(barWidth, 2)}%`,
                        backgroundColor: FUNNEL_COLORS[i],
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Breakdown Pie */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Product Breakdown</h3>
          {productPieData.length > 0 ? (
            <div className="h-64 flex flex-col sm:flex-row items-center">
              <div className="h-48 sm:h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productPieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-3 sm:pl-4 pt-4 sm:pt-0">
                {productPieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-zinc-600">{entry.name}</span>
                    <span className="text-sm font-semibold text-zinc-900 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-zinc-400">
              No products yet
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Orders", value: orderStats?.total ?? 0, color: "text-zinc-900" },
              { label: "Pending", value: orderStats?.pending ?? 0, color: "text-amber-600" },
              { label: "Confirmed", value: orderStats?.confirmed ?? 0, color: "text-blue-600" },
              { label: "Dispatched", value: orderStats?.dispatched ?? 0, color: "text-violet-600" },
              { label: "Delivered", value: orderStats?.delivered ?? 0, color: "text-emerald-600" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-zinc-600">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
