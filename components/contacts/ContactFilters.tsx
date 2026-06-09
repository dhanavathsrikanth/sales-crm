"use client";

import { Search, X, Filter as FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const RELATIONSHIPS = [
  { value: "customer", label: "Customer", color: "bg-blue-50 text-blue-600" },
  { value: "contractor", label: "Contractor", color: "bg-orange-50 text-orange-600" },
  { value: "consultant", label: "Consultant", color: "bg-purple-50 text-purple-600" },
  { value: "competitor", label: "Competitor", color: "bg-red-50 text-red-600" },
  { value: "referral", label: "Referral", color: "bg-emerald-50 text-emerald-600" },
  { value: "friend", label: "Friend", color: "bg-pink-50 text-pink-600" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "recently_contacted", label: "Recently Contacted" },
  { value: "oldest", label: "Least Recently" },
];

interface Props {
  filters: { search: string; relationship: string; company: string; lastContacted: string; sort: string };
  onFiltersChange: (filters: any) => void;
}

export default function ContactFilters({ filters, onFiltersChange }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.relationship ? 1 : 0) + (filters.company ? 1 : 0) + (filters.lastContacted ? 1 : 0);

  const clearFilters = () => {
    onFiltersChange({ search: "", relationship: "", company: "", lastContacted: "", sort: "name_asc" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name, mobile, company..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="relative h-9">
          <FilterIcon className="h-4 w-4 mr-1.5" />
          Filters
          {activeCount > 0 && (
            <Badge className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-blue-600">
              {activeCount}
            </Badge>
          )}
        </Button>
        <select
          value={filters.sort}
          onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
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
            {activeCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Clear all</button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Relationship</label>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => onFiltersChange({ ...filters, relationship: filters.relationship === r.value ? "" : r.value })}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.relationship === r.value ? r.color : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Last Contacted</label>
              <div className="flex gap-1.5">
                {[
                  { value: "recent", label: "This week" },
                  { value: "overdue", label: "Overdue (30d+)" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onFiltersChange({ ...filters, lastContacted: filters.lastContacted === opt.value ? "" : opt.value })}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.lastContacted === opt.value ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
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
