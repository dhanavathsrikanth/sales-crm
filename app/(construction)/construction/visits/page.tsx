"use client";

import { useState, useMemo } from "react";
import { useVisits } from "@/hooks/construction/use-visits";
import { checkOut } from "@/lib/actions/construction/visits";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { MapPin, Plus, Clock, LogOut, ExternalLink, BarChart3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DateFilter = "today" | "week" | "month" | "all";

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All", value: "all" },
];

function filterByDate(visits: any[], filter: DateFilter) {
  if (filter === "all") return visits;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return visits.filter((v) => {
    if (!v.checkInTime) return false;
    const d = new Date(v.checkInTime);
    if (filter === "today") return d >= startOfDay;
    if (filter === "week") return d >= startOfWeek;
    if (filter === "month") return d >= startOfMonth;
    return true;
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function VisitsPage() {
  const { data: visits, isLoading } = useVisits();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const filteredVisits = useMemo(
    () => filterByDate(visits ?? [], dateFilter),
    [visits, dateFilter]
  );

  const stats = useMemo(() => {
    const list = visits ?? [];
    const total = list.length;
    const completed = list.filter((v) => v.checkOutTime && v.durationMinutes);
    const avgDuration =
      completed.length > 0
        ? Math.round(completed.reduce((sum, v) => sum + (v.durationMinutes ?? 0), 0) / completed.length)
        : 0;
    return { total, avgDuration };
  }, [visits]);

  async function handleCheckOut(visitId: string) {
    setCheckingOut(visitId);
    try {
      await checkOut(visitId);
      window.location.reload();
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits"
        subtitle="Site visit history"
        action={
          <Link
            href="/construction/visits/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Visit
          </Link>
        }
      />

      {!isLoading && visits && visits.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Total Visits
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                Avg Duration
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
            {dateFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setDateFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                  dateFilter === f.value
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !visits || visits.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-7 w-7" />}
          title="No visits yet"
          description="Your site visits will appear here."
          action={
            <Link
              href="/construction/visits/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              New Visit
            </Link>
          }
        />
      ) : filteredVisits.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-7 w-7" />}
          title="No visits found"
          description="No visits match the selected filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((visit) => {
            const isActive = visit.checkInTime && !visit.checkOutTime;
            const isCompleted = !!visit.checkOutTime;
            const mapUrl =
              visit.checkInLat && visit.checkInLng
                ? `https://www.google.com/maps?q=${visit.checkInLat},${visit.checkInLng}`
                : null;

            return (
              <div
                key={visit.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 text-sm truncate">
                        {visit.projectName || "Site Visit"}
                      </h3>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                          isActive
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {isActive ? "Active" : "Completed"}
                      </span>
                    </div>
                    {visit.customerName && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {visit.customerName}
                      </p>
                    )}
                  </div>
                  {visit.checkInTime && (
                    <span className="text-xs text-zinc-400 shrink-0 ml-2">
                      {new Date(visit.checkInTime).toLocaleDateString()}{" "}
                      {new Date(visit.checkInTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {visit.checkInAddress && (
                  <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {visit.checkInAddress}
                  </p>
                )}

                {visit.durationMinutes != null && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Duration: {formatDuration(visit.durationMinutes)}
                  </p>
                )}

                {visit.notes && (
                  <p className="mt-2 text-sm text-zinc-600">{visit.notes}</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {isActive && (
                    <button
                      onClick={() => handleCheckOut(visit.id)}
                      disabled={checkingOut === visit.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-3 w-3" />
                      {checkingOut === visit.id ? "Checking out..." : "Check Out"}
                    </button>
                  )}
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Map
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
