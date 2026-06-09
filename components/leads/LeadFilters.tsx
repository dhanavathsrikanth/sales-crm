"use client";

import { useState } from "react";
import { X, Search, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadFilters } from "@/hooks/use-leads";

const STAGES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "site_visited", label: "Site Visited" },
  { value: "requirement_received", label: "Requirement Received" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "trial_order", label: "Trial Order" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const PROJECT_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "infrastructure", label: "Infrastructure" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "score", label: "Lead Score" },
  { value: "m3", label: "m³ High-Low" },
];

interface Props {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export default function LeadFilters({ filters, onFiltersChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggleStage = (stage: string) => {
    const current = filters.stages;
    const updated = current.includes(stage)
      ? current.filter((s) => s !== stage)
      : [...current, stage];
    onFiltersChange({ ...filters, stages: updated, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({
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
  };

  const activeFilterCount =
    filters.stages.length +
    (filters.projectType ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.existingVendor ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search company, builder, contact, mobile..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 h-9 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "", page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="relative h-9"
        >
          <FilterIcon className="h-4 w-4 mr-1.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-blue-600">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        <select
          value={filters.sort}
          onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value, page: 1 })}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-blue-400"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {open && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-zinc-900">Filters</h4>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Lead Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleStage(s.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.stages.includes(s.value)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Project Type</label>
              <div className="flex flex-wrap gap-1.5">
                {PROJECT_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        projectType: filters.projectType === pt.value ? "" : pt.value,
                        page: 1,
                      })
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.projectType === pt.value
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                    )}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Existing Vendor</label>
              <div className="flex gap-1.5">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        existingVendor: filters.existingVendor === opt.value ? "" : opt.value,
                        page: 1,
                      })
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.existingVendor === opt.value
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
