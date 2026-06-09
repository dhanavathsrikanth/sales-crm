"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  new: "#a1a1aa",
  contacted: "#3b82f6",
  meeting_scheduled: "#6366f1",
  site_visited: "#8b5cf6",
  requirement_received: "#06b6d4",
  quotation_sent: "#f59e0b",
  negotiation: "#f97316",
  trial_order: "#f43f5e",
  won: "#10b981",
  lost: "#ef4444",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  meeting_scheduled: "Meeting",
  site_visited: "Site Visited",
  requirement_received: "Requirement",
  quotation_sent: "Quotation",
  negotiation: "Negotiation",
  trial_order: "Trial",
  won: "Won",
  lost: "Lost",
};

interface Props {
  data: { name: string; value: number }[];
}

export default function StageDistribution({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-zinc-900 mb-4">Lead Stage Distribution</h3>
      <div className="flex flex-col items-center">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STAGE_COLORS[entry.name] || "#a1a1aa"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                  fontSize: 13,
                }}
                formatter={(value) => [`${value} leads`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-x-3 gap-y-1.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: STAGE_COLORS[d.name] || "#a1a1aa" }}
              />
              <span className="text-zinc-600 truncate">{STAGE_LABELS[d.name] || d.name}</span>
              <span className="font-medium text-zinc-900">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
