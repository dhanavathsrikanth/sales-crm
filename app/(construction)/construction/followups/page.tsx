"use client";

import { useState } from "react";
import { useFollowups } from "@/hooks/construction/use-followups";
import { useLeads } from "@/hooks/construction/use-leads";
import { createFollowup, completeFollowup } from "@/lib/actions/construction/followups";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import {
  CalendarCheck,
  Phone,
  MessageCircle,
  Users,
  MapPin,
  Mail,
  Plus,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-700",
};

const typeLabels: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  site_visit: "Site Visit",
  email: "Email",
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

export default function FollowupsPage() {
  const [status, setStatus] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data: followups, isLoading, refetch } = useFollowups({ status });
  const { data: leads } = useLeads();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    leadId: "",
    followupDate: "",
    followupTime: "",
    type: "call",
    priority: "medium",
    notes: "",
  });

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "Missed", value: "missed" },
  ];

  const typeFilters = [
    { label: "All", value: undefined },
    { label: "Call", value: "call" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Meeting", value: "meeting" },
    { label: "Site Visit", value: "site_visit" },
    { label: "Email", value: "email" },
  ];

  const filteredFollowups = typeFilter
    ? followups?.filter((f) => f.type === typeFilter)
    : followups;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId || !form.followupDate) return;
    setSaving(true);
    try {
      await createFollowup({
        leadId: form.leadId,
        followupDate: form.followupDate,
        followupTime: form.followupTime || undefined,
        type: form.type,
        priority: form.priority,
        notes: form.notes || undefined,
      });
      toast.success("Follow-up scheduled successfully!");
      setForm({ leadId: "", followupDate: "", followupTime: "", type: "call", priority: "medium", notes: "" });
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule follow-up.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await completeFollowup(id);
      toast.success("Follow-up completed!");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete follow-up.");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        subtitle="Stay on top of your follow-ups"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              showForm
                ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "New Follow-up"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Schedule a Follow-up</h3>

          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Lead *</label>
            <select
              required
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a lead</option>
              {leads?.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.projectName || "Untitled"} {lead.customerName ? `— ${lead.customerName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">Follow-up Date *</label>
              <DatePicker
                value={form.followupDate}
                onChange={(date) => setForm({ ...form, followupDate: date })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">Time (optional)</label>
              <TimePicker
                value={form.followupTime}
                onChange={(time) => setForm({ ...form, followupTime: time })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meeting">Meeting</option>
                <option value="site_visit">Site Visit</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes for this follow-up..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Schedule Follow-up"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
          {statusFilters.map((f) => (
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
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
          {typeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                typeFilter === f.value
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !filteredFollowups || filteredFollowups.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-7 w-7" />}
          title="No follow-ups"
          description="Follow-ups will appear here when you create them from a lead."
        />
      ) : (
        <div className="space-y-3">
          {filteredFollowups.map((f) => {
            const d = new Date(f.followupDate);
            const today = new Date();
            const isOverdue = f.status === "pending" && d < today;

            return (
              <div
                key={f.id}
                className={cn(
                  "rounded-xl border bg-white p-4",
                  isOverdue ? "border-red-200" : "border-zinc-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 text-sm truncate">
                        {f.projectName || "Untitled Lead"}
                      </h3>
                      {isOverdue && (
                        <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>
                    {f.customerName && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{f.customerName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                    {f.type && (
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", typeBadgeColors[f.type ?? "call"])}>
                        {typeIcons[f.type ?? "call"]}
                        <span className="hidden sm:inline">{typeLabels[f.type]}</span>
                      </span>
                    )}
                    {f.priority && (
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", priorityColors[f.priority ?? "medium"])}>
                        {f.priority}
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      f.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      f.status === "missed" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {f.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{new Date(f.followupDate).toLocaleDateString()}</span>
                  {f.followupTime && <span>{f.followupTime.slice(0, 5)}</span>}
                </div>

                {f.notes && (
                  <p className="mt-2 text-sm text-zinc-600">{f.notes}</p>
                )}

                {f.status === "pending" && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => handleComplete(f.id)}
                      disabled={completingId === f.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {completingId === f.id ? "Completing..." : "Mark Complete"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
