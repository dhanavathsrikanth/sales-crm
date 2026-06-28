"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLeads } from "@/hooks/construction/use-leads";
import { checkIn } from "@/lib/actions/construction/visits";
import PageHeader from "@/components/construction-shared/PageHeader";
import { toast } from "sonner";

function NewVisitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("leadId") || "";
  const { data: leads } = useLeads();

  const [leadId, setLeadId] = useState(leadIdParam);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCheckIn = async () => {
    if (!leadId) return;
    setSaving(true);
    try {
      // Get GPS position
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await checkIn(
        leadId,
        pos.coords.latitude,
        pos.coords.longitude,
        `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`,
        notes || undefined
      );

      toast.success("Visit checked in successfully!");
      router.push("/construction/visits");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to check in. Make sure location is enabled.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="New Visit" subtitle="Check in at a site" />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Select Lead</label>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a lead...</option>
            {leads?.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.projectName || lead.customerName || "Untitled"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What's the purpose of this visit?"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckIn}
            disabled={saving || !leadId}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Checking in..." : "Check In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-zinc-500">Loading...</div>}>
      <NewVisitForm />
    </Suspense>
  );
}
