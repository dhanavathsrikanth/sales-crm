"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Grid3X3, Table2, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadCard from "@/components/leads/LeadCard";
import LeadTable from "@/components/leads/LeadTable";
import LeadFiltersComponent from "@/components/leads/LeadFilters";
import { useLeads } from "@/hooks/use-leads";
import type { Lead, LeadFilters } from "@/hooks/use-leads";
import LeadCardSkeleton from "@/components/shared/LeadCardSkeleton";
import EmptyState from "@/components/shared/EmptyState";

export default function LeadsPage() {
  const router = useRouter();
  const [view, setView] = useState<"card" | "table">("card");
  const [filters, setFilters] = useState<LeadFilters>({
    search: "",
    stages: [],
    projectType: "",
    city: "",
    dateFrom: "",
    dateTo: "",
    existingVendor: "",
    sort: "recent",
    page: 1,
  });

  const { data, isLoading, isError } = useLeads(filters);

  const handleScheduleFollowup = useCallback((lead: Lead) => {
    const name = lead.companyName || lead.contactPerson || "";
    router.push(`/followups?leadId=${lead.id}&leadName=${encodeURIComponent(name)}`);
  }, [router]);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    filters.stages.forEach((s) => params.append("stage", s));
    if (filters.projectType) params.set("projectType", filters.projectType);
    if (filters.city) params.set("city", filters.city);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.existingVendor) params.set("existingVendor", filters.existingVendor);
    if (filters.sort) params.set("sort", filters.sort);
    window.open(`/api/leads/export?${params}`, "_blank");
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Leads</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {data ? `${data.total} lead${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 sm:h-9 text-xs sm:text-sm">
            <Download className="h-4 w-4 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setView("card")}
              className={`p-1.5 sm:p-2 transition-colors ${view === "card" ? "bg-blue-50 text-blue-600" : "text-zinc-400 hover:text-zinc-600"}`}
            >
              <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-1.5 sm:p-2 transition-colors ${view === "table" ? "bg-blue-50 text-blue-600" : "text-zinc-400 hover:text-zinc-600"}`}
            >
              <Table2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
          <Link href="/leads/new">
            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">New Lead</span>
            </Button>
          </Link>
        </div>
      </div>

      <LeadFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">Failed to load leads. Please try again.</p>
        </div>
      ) : data?.leads.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title={filters.search || filters.stages.length ? "No leads match your filters" : "No leads yet"}
          description={
            filters.search || filters.stages.length
              ? "Try adjusting your search or filters."
              : "Add your first lead to start tracking your sales pipeline."
          }
          action={
            !filters.search && !filters.stages.length ? (
              <Link href="/leads/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add your first lead &rarr;
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : view === "card" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onScheduleFollowup={handleScheduleFollowup} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-x-auto">
          <LeadTable data={data?.leads ?? []} />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-zinc-500">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= data.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
