"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search, MapPin, Navigation, Building2, Loader2,
  Camera, Crosshair, Target, X, CameraIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import GpsCamera from "@/components/shared/GpsCamera"
import { useSearchLeads } from "@/hooks/use-leads"
import { useDebounce } from "@/hooks/use-debounce"

interface LeadResult {
  id: string
  companyName: string | null
  contactPerson: string | null
  city: string | null
  stage: string | null
}

export default function GpsCameraPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<Pick<LeadResult, "id" | "companyName" | "contactPerson" | "city"> | null>(null)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const { data: searchResults, isLoading: searching } = useSearchLeads(debouncedQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const results = ((searchResults || []) as LeadResult[]).slice(0, 15)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = useCallback((lead: LeadResult) => {
    setSelectedLead({
      id: lead.id,
      companyName: lead.companyName || "",
      contactPerson: lead.contactPerson || "",
      city: lead.city || "",
    })
    setQuery("")
    setOpen(false)
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl min-h-[calc(100vh-10rem)]">
      {/* Mobile-responsive sticky header */}
      <div className="-mx-3 sm:-mx-4 lg:-mx-8 -mt-3 sm:-mt-4 lg:-mt-6 mb-5 bg-gradient-to-b from-white via-white to-white/95 px-3 sm:px-4 lg:px-8 pb-4 pt-3 sm:pt-4 lg:pt-6 backdrop-blur-sm border-b border-zinc-100">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-200">
            <Navigation className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900">GPS Camera</h1>
            <p className="text-xs text-zinc-500 truncate">
              Site photos with GPS location stamp
            </p>
          </div>
        </div>
      </div>

      {/* Lead Selector - mobile friendly touch targets */}
      <div className="mb-4" ref={dropdownRef}>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Linked Lead
        </label>
        {selectedLead ? (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                {selectedLead.companyName || selectedLead.contactPerson || "Untitled"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                {selectedLead.city && (
                  <>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{selectedLead.city}</span>
                  </>
                )}
                {selectedLead.contactPerson && selectedLead.city && (
                  <span className="text-zinc-300 hidden sm:inline">·</span>
                )}
                {selectedLead.contactPerson && (
                  <span className="truncate hidden sm:inline">{selectedLead.contactPerson}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full p-0 shrink-0 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              onClick={() => setSelectedLead(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div
              onClick={() => {
                setOpen(true)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm transition-all",
                open ? "border-orange-300 ring-2 ring-orange-100" : "active:border-zinc-300",
              )}
            >
              <Search className="h-5 w-5 shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder="Search by name, company, city..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
              />
              {open && query && (
                <button
                  onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus() }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {open && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/5 animate-in fade-in slide-in-from-top-1">
                {query.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-zinc-400">
                    <Search className="h-6 w-6" />
                    <p className="text-xs">Type to search leads</p>
                  </div>
                ) : searching ? (
                  <div className="flex items-center justify-center gap-2 py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    <span className="text-sm text-zinc-400">Searching...</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-zinc-400">
                    <Building2 className="h-6 w-6" />
                    <p className="text-sm">No leads found</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {results.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleSelect(l)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors active:bg-orange-50 hover:bg-orange-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 truncate">
                            {l.companyName || l.contactPerson || "Unnamed"}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {[l.contactPerson, l.city, l.stage].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera / Empty State */}
      {selectedLead ? (
        <GpsCamera
          leadId={selectedLead.id}
          onUploadComplete={() => {
            router.push(`/leads/${selectedLead.id}`)
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-5 py-16 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-50 ring-1 ring-orange-200/60">
            <CameraIcon className="h-9 w-9 text-orange-400" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-base font-semibold text-zinc-800">Select a lead to begin</p>
            <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
              Link a lead to associate photos with CRM records. Photos get a GPS stamp with address, coordinates, and timestamp.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2">
            {[
              { icon: MapPin, label: "GPS Location" },
              { icon: Crosshair, label: "Reverse Geocode" },
              { icon: Target, label: "Accuracy Check" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <item.icon className="h-3.5 w-3.5 text-orange-400" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
