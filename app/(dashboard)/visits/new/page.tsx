"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCheckIn } from "@/hooks/use-visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, ArrowLeft, Building2, Search, Navigation, CheckCircle2 } from "lucide-react";

export default function NewVisitPage() {
  const router = useRouter();
  const checkIn = useCheckIn();

  const [step, setStep] = useState<"lead" | "location" | "notes" | "confirm">("lead");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadResults, setLeadResults] = useState<any[]>([]);
  const [leadSearching, setLeadSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!leadSearch.trim()) { setLeadResults([]); return }
    const timer = setTimeout(async () => {
      setLeadSearching(true);
      try {
        const res = await fetch(`/api/leads/search?q=${encodeURIComponent(leadSearch)}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setLeadResults(Array.isArray(data) ? data : data.leads || []);
        }
      } catch {} finally { setLeadSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [leadSearch]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      if (!res.ok) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      });
      const { latitude, longitude } = pos.coords;
      const address = await reverseGeocode(latitude, longitude);
      setLocation({ lat: latitude, lng: longitude, address });
      setStep("notes");
    } catch (err: any) {
      if (err.code === 1) setGpsError("Location permission denied. Please enable GPS in browser settings.");
      else if (err.code === 2) setGpsError("Location unavailable. Try moving to an open area.");
      else if (err.code === 3) setGpsError("GPS timed out. Please try again.");
      else setGpsError(err.message || "Failed to get location");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!selectedLead) return;
    try {
      await checkIn.mutateAsync({
        leadId: selectedLead.id,
        checkInLat: location?.lat.toString(),
        checkInLng: location?.lng.toString(),
        checkInAddress: location?.address,
        notes: notes || undefined,
      });
      router.push("/visits");
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/visits">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Log Site Visit</h1>
          <p className="text-xs text-zinc-500">Check in to a lead site</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {(["lead", "location", "notes", "confirm"] as const).map((s, i) => (
          <div key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full transition-colors", step === s ? "bg-blue-500" : ["lead", "location", "notes", "confirm"].indexOf(step) > i ? "bg-blue-400" : "bg-zinc-200")} />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-400 capitalize">{step === "confirm" ? "Review & Check In" : step}</p>

      {step === "lead" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Select Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by company name, contact, or city..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-9"
              />
              {leadSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />}
            </div>

            {leadResults.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-1">
                {leadResults.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => { setSelectedLead(lead); setStep("location"); }}
                    className="w-full text-left flex flex-col gap-0.5 p-3 rounded-lg hover:bg-zinc-50 active:scale-[0.98] transition-all"
                  >
                    <span className="font-medium text-sm text-zinc-900">{lead.companyName || "Untitled"}</span>
                    <span className="text-xs text-zinc-500">{lead.contactPerson || "No contact"} {lead.city ? `• ${lead.city}` : ""}</span>
                  </button>
                ))}
              </div>
            )}

            {!leadSearching && leadSearch && leadResults.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">No leads found. Try a different search term.</p>
            )}

            {!leadSearch && (
              <p className="text-sm text-zinc-400 text-center py-4">Start typing to search for a lead</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === "location" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              Get Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500">We need your current location to verify you're at the site.</p>

            <Button onClick={handleGetLocation} disabled={gpsLoading} className="w-full" size="lg">
              {gpsLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting location...</>
              ) : (
                <><MapPin className="h-4 w-4 mr-2" /> Get Current Location</>
              )}
            </Button>

            {gpsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{gpsError}</p>
                <Button variant="outline" size="sm" onClick={handleGetLocation} className="mt-2">
                  Try Again
                </Button>
              </div>
            )}

            <Button variant="outline" onClick={() => setStep("notes")} className="w-full">
              Skip GPS (Manual Entry)
            </Button>

            <Button variant="ghost" onClick={() => setStep("lead")} className="w-full text-zinc-400">
              ← Back to Lead Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Visit Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {location && (
              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                <p className="font-medium text-zinc-700">Location captured</p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">{location.address}</p>
                <p className="text-zinc-400 text-[10px] mt-0.5">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any observations about the site visit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={() => setStep("confirm")} className="w-full">
              Continue
            </Button>

            <Button variant="ghost" onClick={() => setStep("location")} className="w-full text-zinc-400">
              ← Back to Location
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Confirm Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Lead</span>
                <span className="text-sm font-medium">{selectedLead?.companyName || "Unknown"}</span>
              </div>
              {selectedLead?.contactPerson && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Contact</span>
                  <span className="text-sm">{selectedLead.contactPerson}</span>
                </div>
              )}
              {location && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Location</span>
                  <span className="text-sm text-right max-w-[60%] truncate">{location.address.split(",")[0]}</span>
                </div>
              )}
              {notes && (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-sm text-zinc-500">Notes</span>
                  <span className="text-sm text-zinc-700">{notes}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleConfirmCheckin}
              disabled={checkIn.isPending}
              className="w-full"
              size="lg"
            >
              {checkIn.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking in...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Check In</>
              )}
            </Button>

            <Button variant="ghost" onClick={() => setStep("notes")} className="w-full text-zinc-400">
              ← Back to Notes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}