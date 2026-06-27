"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/construction/use-contacts";
import { useProducts } from "@/hooks/construction/use-products";
import { createLead } from "@/lib/actions/construction/leads";
import { createCustomer } from "@/lib/actions/construction/contacts";
import PageHeader from "@/components/construction-shared/PageHeader";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const { data: customers, refetch: refetchCustomers } = useCustomers();
  const { data: products } = useProducts();
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", city: "" });
  const [projectName, setProjectName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [city, setCity] = useState("");
  const [productInterest, setProductInterest] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [siteLat, setSiteLat] = useState<number | null>(null);
  const [siteLng, setSiteLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;
    const customer = await createCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
      city: newCustomer.city,
    });
    setCustomerId(customer.id);
    setShowNewCustomer(false);
    setNewCustomer({ name: "", phone: "", city: "" });
    refetchCustomers();
  };

  const toggleProduct = (productName: string) => {
    setProductInterest((prev) =>
      prev.includes(productName)
        ? prev.filter((p) => p !== productName)
        : [...prev, productName]
    );
  };

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSiteLat(latitude);
        setSiteLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data.display_name) {
            setSiteAddress(data.display_name);
          }
        } catch {
          setLocationError("Could not reverse geocode the address.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please allow location access in your browser settings.");
        } else if (err.code === 2) {
          setLocationError("Location unavailable. Please try again.");
        } else if (err.code === 3) {
          setLocationError("Location request timed out. Please try again.");
        } else {
          setLocationError("Failed to get your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setSiteLat(null);
    setSiteLng(null);
    setLocationError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLead({
        customerId: customerId || undefined,
        projectName,
        siteAddress,
        city,
        siteLat: siteLat ?? undefined,
        siteLng: siteLng ?? undefined,
        productInterest: productInterest.length > 0 ? productInterest : undefined,
        remarks,
      });
      router.push("/construction/leads");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="New Lead" subtitle="Add a potential customer or project" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Customer</h3>
          {!showNewCustomer ? (
            <div className="flex gap-2">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select or skip...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  placeholder="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="City"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="button" onClick={handleCreateCustomer}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewCustomer(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h3 className="font-semibold text-zinc-900">Project Details</h3>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Green Valley Residency"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Site Address</label>
            <textarea
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {locationLoading ? "Getting location..." : "Use Current Location"}
              </button>
              {siteLat !== null && siteLng !== null && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
            {locationError && (
              <p className="mt-1.5 text-xs text-red-600">{locationError}</p>
            )}
            {siteLat !== null && siteLng !== null && !locationError && (
              <p className="mt-1.5 text-xs text-zinc-400">
                Coordinates: {siteLat.toFixed(6)}, {siteLng.toFixed(6)}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Product Interest</h3>
          {products && products.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    productInterest.includes(p.name)
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No products available</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Remarks</h3>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
