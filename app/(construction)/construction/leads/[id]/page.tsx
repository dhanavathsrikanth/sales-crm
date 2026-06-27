"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLead } from "@/hooks/construction/use-leads";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { updateLeadStage } from "@/lib/actions/construction/leads";
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

const stages = ["new", "contacted", "site_visited", "requirement_received", "quoted", "negotiation", "won", "lost"];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lead, isLoading, refetch } = useLead(id);
  const [updating, setUpdating] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!lead) return <div className="text-center py-12 text-zinc-500">Lead not found</div>;

  const handleStageChange = async (newStage: string) => {
    setUpdating(true);
    await updateLeadStage(id, newStage);
    setUpdating(false);
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={lead.projectName || "Lead Details"}
        subtitle={lead.customer?.name || undefined}
        action={
          <button onClick={() => router.push("/construction/leads")} className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Back to Leads
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Stage</h3>
            <div className="flex flex-wrap gap-2">
              {stages.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  disabled={updating || s === lead.stage}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    s === lead.stage
                      ? stageColors[s] + " border-transparent"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  {stageLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.siteAddress && (
                <>
                  <span className="text-zinc-400">Site Address</span>
                  <span className="text-zinc-900">{lead.siteAddress}</span>
                </>
              )}
              {lead.city && (
                <>
                  <span className="text-zinc-400">City</span>
                  <span className="text-zinc-900">{lead.city}</span>
                </>
              )}
              {lead.projectType && (
                <>
                  <span className="text-zinc-400">Project Type</span>
                  <span className="text-zinc-900">{lead.projectType}</span>
                </>
              )}
              {lead.estimatedValue && (
                <>
                  <span className="text-zinc-400">Estimated Value</span>
                  <span className="text-zinc-900">₹{Number(lead.estimatedValue).toLocaleString()}</span>
                </>
              )}
              <span className="text-zinc-400">Created</span>
              <span className="text-zinc-900">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}</span>
            </div>
          </div>

          {lead.productInterest && lead.productInterest.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900 mb-3">Products Interested</h3>
              <div className="flex flex-wrap gap-2">
                {lead.productInterest.map((p: string) => (
                  <span key={p} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lead.remarks && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900 mb-3">Remarks</h3>
              <p className="text-sm text-zinc-700">{lead.remarks}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {lead.customer && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900 mb-3">Customer</h3>
              <p className="text-sm font-medium text-zinc-900">{lead.customer.name}</p>
              {lead.customer.phone && (
                <p className="text-sm text-zinc-500 mt-1">{lead.customer.phone}</p>
              )}
              {lead.customer.city && (
                <p className="text-sm text-zinc-500">{lead.customer.city}</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/construction/visits/new?leadId=${id}`)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 text-left"
              >
                Log Visit
              </button>
              <button
                onClick={() => router.push(`/construction/followups?leadId=${id}`)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 text-left"
              >
                View Follow-ups
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
