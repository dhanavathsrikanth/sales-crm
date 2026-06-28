"use client";

import { useMemo } from "react";
import { useOrderStats, useOrders } from "@/hooks/construction/use-orders";
import { useLeadStats, useLeads } from "@/hooks/construction/use-leads";
import { useProducts } from "@/hooks/construction/use-products";
import { useFollowups } from "@/hooks/construction/use-followups";
import { useVisits } from "@/hooks/construction/use-visits";
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Target,
  Package,
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  Users,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
const PIE_COLORS = ["#3b82f6", "#f59e0b"];
const STAGE_COLORS: Record<string, string> = {
  new: "#8b5cf6",
  contacted: "#3b82f6",
  site_visited: "#a855f7",
  requirement_received: "#d946ef",
  quoted: "#f59e0b",
  negotiation: "#f97316",
  won: "#10b981",
  lost: "#ef4444",
};
const FOLLOWUP_TYPE_COLORS: Record<string, string> = {
  call: "#3b82f6",
  whatsapp: "#10b981",
  meeting: "#8b5cf6",
  site_visit: "#f97316",
  email: "#0ea5e9",
};

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  whatsapp: <MessageCircle className="h-3 w-3" />,
  meeting: <Users className="h-3 w-3" />,
  site_visit: <MapPin className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
};

export default function ReportsPage() {
  const { data: orderStats, isLoading: loadingOrders } = useOrderStats();
  const { data: orders } = useOrders();
  const { data: leadStats, isLoading: loadingLeads } = useLeadStats();
  const { data: leads } = useLeads();
  const { data: products } = useProducts();
  const { data: followups } = useFollowups();
  const { data: visits } = useVisits();

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

  const leadStageData = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const stageCount: Record<string, number> = {};
    leads.forEach((lead) => {
      const stage = lead.stage || "new";
      stageCount[stage] = (stageCount[stage] || 0) + 1;
    });
    const stageLabels: Record<string, string> = {
      new: "New",
      contacted: "Contacted",
      site_visited: "Site Visited",
      requirement_received: "Requirements",
      quoted: "Quoted",
      negotiation: "Negotiation",
      won: "Won",
      lost: "Lost",
    };
    return Object.entries(stageCount)
      .map(([stage, count]) => ({
        stage: stageLabels[stage] || stage,
        count,
        color: STAGE_COLORS[stage] || "#71717a",
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const followupStats = useMemo(() => {
    if (!followups || followups.length === 0) return { completed: 0, pending: 0, missed: 0, total: 0, overdue: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completed = followups.filter((f) => f.status === "completed").length;
    const pending = followups.filter((f) => f.status === "pending").length;
    const missed = followups.filter((f) => f.status === "missed").length;
    const overdue = followups.filter((f) => {
      if (f.status !== "pending") return false;
      return new Date(f.followupDate) < today;
    }).length;
    return { completed, pending, missed, total: followups.length, overdue };
  }, [followups]);

  const followupTypeData = useMemo(() => {
    if (!followups || followups.length === 0) return [];
    const typeCount: Record<string, number> = {};
    followups.forEach((f) => {
      const type = f.type || "call";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const typeLabels: Record<string, string> = {
      call: "Call",
      whatsapp: "WhatsApp",
      meeting: "Meeting",
      site_visit: "Site Visit",
      email: "Email",
    };
    return Object.entries(typeCount).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count,
      color: FOLLOWUP_TYPE_COLORS[type] || "#71717a",
    }));
  }, [followups]);

  const visitStats = useMemo(() => {
    if (!visits || visits.length === 0) return { total: 0, active: 0, avgDuration: 0, totalHours: 0 };
    const active = visits.filter((v) => !v.checkOutTime).length;
    const completed = visits.filter((v) => v.durationMinutes != null);
    const totalMinutes = completed.reduce((sum, v) => sum + (v.durationMinutes ?? 0), 0);
    const avgDuration = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    return { total: visits.length, active, avgDuration, totalHours };
  }, [visits]);

  const monthlyLeadData = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const monthMap: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    leads.forEach((lead) => {
      const d = new Date(lead.createdAt ?? new Date());
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const [year, month] = key.split("-");
        return { name: `${monthNames[Number(month)]} '${year.slice(2)}`, leads: count };
      });
  }, [leads]);

  const topLeadsByScore = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    return [...leads]
      .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0))
      .slice(0, 5);
  }, [leads]);

  const topOrdersByValue = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return [...orders]
      .sort((a, b) => Number(b.finalAmount ?? 0) - Number(a.finalAmount ?? 0))
      .slice(0, 5);
  }, [orders]);

  if (loadingOrders || loadingLeads) return <LoadingSpinner />;

  const totalRevenue = Number(orderStats?.revenue ?? 0);
  const avgOrderValue = (orderStats?.total ?? 0) > 0 ? totalRevenue / (orderStats?.total ?? 1) : 0;
  const totalLeads = leadStats?.total ?? 0;
  const wonLeads = leadStats?.won ?? 0;
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const totalProducts = products?.length ?? 0;
  const followupCompletionRate = followupStats.total > 0 ? Math.round((followupStats.completed / followupStats.total) * 100) : 0;

  const metrics = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12%", trendUp: true },
    { label: "Avg Order Value", value: formatCurrency(avgOrderValue), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", trend: "+5%", trendUp: true },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-amber-600", bg: "bg-amber-50", trend: winRate > 50 ? "Good" : "Needs work", trendUp: winRate > 50 },
    { label: "Total Products", value: String(totalProducts), icon: Package, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  const secondaryMetrics = [
    { label: "Follow-up Completion", value: `${followupCompletionRate}%`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", sub: `${followupStats.completed}/${followupStats.total} completed` },
    { label: "Overdue Follow-ups", value: String(followupStats.overdue), icon: AlertCircle, color: followupStats.overdue > 0 ? "text-red-600" : "text-emerald-600", bg: followupStats.overdue > 0 ? "bg-red-50" : "bg-emerald-50", sub: followupStats.overdue > 0 ? "Needs attention" : "All on track" },
    { label: "Total Visits", value: String(visitStats.total), icon: MapPin, color: "text-violet-600", bg: "bg-violet-50", sub: `${visitStats.active} active now` },
    { label: "Avg Visit Duration", value: `${visitStats.avgDuration}m`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", sub: `${visitStats.totalHours}h total` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Business analytics and insights" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${m.bg}`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">{m.label}</p>
              <p className="text-lg font-bold text-zinc-900">{m.value}</p>
              {m.trend && (
                <p className={cn("text-[10px] font-medium flex items-center gap-0.5", m.trendUp ? "text-emerald-600" : "text-red-600")}>
                  {m.trendUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {m.trend}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryMetrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${m.bg}`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-xs text-zinc-500">{m.label}</p>
            </div>
            <p className="text-xl font-bold text-zinc-900">{m.value}</p>
            {m.sub && <p className="text-[10px] text-zinc-400 mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="h-64 flex items-center justify-center text-sm text-zinc-400">No order data yet</div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Lead Creation Trend</h3>
          {monthlyLeadData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyLeadData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#71717a" }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-zinc-400">No lead data yet</div>
          )}
        </div>

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
                      style={{ width: `${Math.max(barWidth, 2)}%`, backgroundColor: FUNNEL_COLORS[i], opacity: 0.85 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Lead Stage Breakdown</h3>
          {leadStageData.length > 0 ? (
            <div className="space-y-2.5">
              {leadStageData.map((item) => (
                <div key={item.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600">{item.stage}</span>
                    <span className="font-semibold text-zinc-900">{item.count}</span>
                  </div>
                  <div className="h-5 bg-zinc-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${totalLeads > 0 ? Math.max((item.count / totalLeads) * 100, 3) : 0}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-zinc-400">No lead data yet</div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Follow-up Performance</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-2">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{followupStats.completed}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-2">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{followupStats.pending}</p>
              <p className="text-xs text-zinc-500">Pending</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{followupStats.missed}</p>
              <p className="text-xs text-zinc-500">Missed</p>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-100">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Completion Rate</span>
              <span className="font-semibold text-emerald-600">{followupCompletionRate}%</span>
            </div>
            <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${followupCompletionRate}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Follow-up Type Distribution</h3>
          {followupTypeData.length > 0 ? (
            <div className="h-56 flex flex-col sm:flex-row items-center">
              <div className="h-44 sm:h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={followupTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {followupTypeData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2 sm:pl-4 pt-3 sm:pt-0">
                {followupTypeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-zinc-600">{entry.name}</span>
                    <span className="text-sm font-semibold text-zinc-900 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-zinc-400">No follow-up data yet</div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Product Breakdown</h3>
          {productPieData.length > 0 ? (
            <div className="h-56 flex flex-col sm:flex-row items-center">
              <div className="h-44 sm:h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={4} dataKey="value">
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
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-sm text-zinc-600">{entry.name}</span>
                    <span className="text-sm font-semibold text-zinc-900 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-zinc-400">No products yet</div>
          )}
        </div>

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
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Total Revenue</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="px-5 py-3 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900">Top Leads by Score</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {topLeadsByScore.length > 0 ? topLeadsByScore.map((lead, i) => (
              <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{lead.projectName || lead.customerName || "Unnamed"}</p>
                    <p className="text-xs text-zinc-500 truncate">{lead.city || "No city"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-zinc-900">{lead.leadScore ?? 0}</span>
                  <span className="text-[10px] text-zinc-400">pts</span>
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">No leads yet</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="px-5 py-3 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900">Top Orders by Value</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {topOrdersByValue.length > 0 ? topOrdersByValue.map((order, i) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500 truncate">{order.customerName || "—"}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-zinc-900 shrink-0">{formatCurrency(Number(order.finalAmount ?? 0))}</span>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">No orders yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
