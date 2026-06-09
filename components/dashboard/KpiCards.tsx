import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  ListTodo,
  MapPin,
  Trophy,
  Frown,
  Weight,
  Percent,
} from "lucide-react";
interface Props {
  data: {
    totalLeads: number;
    leadsLastMonth: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
    visitsThisMonth: number;
    visitsLastMonth: number;
    followupsDueToday: number;
    potentialM3: number;
    conversionRate: number;
  };
}

function calcChange(current: number, previous: number) {
  if (previous === 0) return { value: current > 0 ? 100 : 0, positive: current > 0 };
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(change), positive: change >= 0 };
}

const cards = (data: Props["data"]) => [
  {
    icon: Users,
    label: "Total Leads",
    value: data.totalLeads,
    trend: calcChange(data.totalLeads, data.leadsLastMonth),
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: TrendingUp,
    label: "Active Leads",
    value: data.activeLeads,
    trend: null,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: ListTodo,
    label: "Follow-ups Today",
    value: data.followupsDueToday,
    trend: null,
    accent: data.followupsDueToday > 0,
    color: data.followupsDueToday > 0
      ? "text-orange-600 bg-orange-50"
      : "text-zinc-500 bg-zinc-100",
  },
  {
    icon: MapPin,
    label: "Visits This Month",
    value: data.visitsThisMonth,
    trend: calcChange(data.visitsThisMonth, data.visitsLastMonth),
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Trophy,
    label: "Won Projects",
    value: data.wonLeads,
    trend: null,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Frown,
    label: "Lost Projects",
    value: data.lostLeads,
    trend: null,
    color: "text-red-600 bg-red-50",
  },
  {
    icon: Weight,
    label: "Potential m³",
    value: `${(data.potentialM3 / 1000).toFixed(1)}K`,
    trend: null,
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: Percent,
    label: "Conversion Rate",
    value: `${data.conversionRate}%`,
    trend: null,
    color: "text-amber-600 bg-amber-50",
  },
];

export default function KpiCards({ data }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards(data).map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300"
        >
          <div className="flex items-center justify-between">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.color)}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
            {card.trend && (
              <span
                className={cn(
                  "text-xs font-medium rounded-full px-1.5 py-0.5",
                  card.trend.positive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                )}
              >
                {card.trend.positive ? "+" : "-"}{card.trend.value}%
              </span>
            )}
          </div>
          <p className="mt-3 text-xl font-bold text-zinc-900">{card.value}</p>
          <p className="text-xs text-zinc-500">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
