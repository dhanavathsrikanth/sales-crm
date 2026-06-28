"use client";

import { useState } from "react";
import Link from "next/link";
import { useLeads } from "@/hooks/construction/use-leads";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { Building2, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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

              {(lead.siteLat && lead.siteLng) || lead.customerWhatsapp || lead.customerPhone ? (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
                  {lead.siteLat && lead.siteLng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lead.siteLat},${lead.siteLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      title="Navigate to site"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Map
                    </a>
                  )}
                  {lead.customerWhatsapp && (
                    <a
                      href={`https://wa.me/${lead.customerWhatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                  {!lead.customerWhatsapp && lead.customerPhone && (
                    <a
                      href={`https://wa.me/${lead.customerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
