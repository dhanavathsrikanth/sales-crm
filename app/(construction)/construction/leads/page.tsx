"use client";

import { useState } from "react";
import Link from "next/link";
import { useLeads } from "@/hooks/construction/use-leads";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const stageColors: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-700",
  contacted: "bg-blue-100 text-blue-700",
  site_visited: "bg-violet-100 text-violet-700",
  requirement_received: "bg-purple-100 text-purple-700",
  quoted: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

const stageLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  site_visited: "Site Visited",
  requirement_received: "Requirements Received",
  quoted: "Quoted",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export default function LeadsPage() {
  const [stage, setStage] = useState<string | undefined>();
  const { data: leads, isLoading } = useLeads({ stage });

  const filters = [
    { label: "All", value: undefined },
    { label: "Active", value: "active" },
    { label: "New", value: "new" },
    { label: "Won", value: "won" },
    { label: "Lost", value: "lost" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Track potential customers and projects"
        action={
          <Link
            href="/construction/leads/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        }
      />

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStage(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
              stage === f.value
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
      ) : !leads || leads.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="No leads yet"
          description="Add your first lead to start tracking."
          action={
            <Link
              href="/construction/leads/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              New Lead
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/construction/leads/${lead.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-zinc-900">
                  {lead.projectName || lead.customerName || "Unnamed Lead"}
                </h3>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", stageColors[lead.stage ?? "new"])}>
                  {stageLabels[lead.stage ?? "new"]}
                </span>
              </div>

              {lead.customerName && (
                <p className="text-sm text-zinc-600">{lead.customerName}</p>
              )}
              {lead.city && (
                <p className="text-xs text-zinc-400 mt-1">{lead.city}</p>
              )}

              {lead.productInterest && lead.productInterest.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {lead.productInterest.map((p: string) => (
                    <span key={p} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Score: {lead.leadScore}</span>
                <span className="text-zinc-400">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
