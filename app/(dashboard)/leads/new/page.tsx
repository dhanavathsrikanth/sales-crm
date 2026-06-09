"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateLead } from "@/hooks/use-leads";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Calculator } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const steps = [
  { id: 1, label: "Customer Info" },
  { id: 2, label: "Site Location" },
  { id: 3, label: "Project Details" },
  { id: 4, label: "Notes & Stage" },
  { id: 5, label: "Custom Fields" },
];

const formSchema = z.object({
  companyName: z.string().min(1, "Required"),
  clientCompany: z.string().optional(),
  builderName: z.string().optional(),
  projectName: z.string().optional(),
  contactPerson: z.string().min(1, "Required"),
  designation: z.string().optional(),
  mobile: z.string().min(10, "Enter valid mobile"),
  email: z.string().email().optional().or(z.literal("")),
  existingVendor: z.string().optional(),
  competitorNotes: z.string().optional(),
  siteAddress: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  projectType: z.string().optional(),
  projectStatus: z.string().optional(),
  numberOfFloors: z.coerce.number().optional(),
  builtUpArea: z.coerce.number().optional(),
  estimatedValue: z.coerce.number().optional(),
  gradeRequirements: z.array(z.string()).optional(),
  estimatedM3: z.coerce.number().optional(),
  monthlyM3: z.coerce.number().optional(),
  immediateM3: z.coerce.number().optional(),
  expectedSupplyDate: z.string().optional(),
  remarks: z.string().optional(),
  stage: z.string().default("new"),
});

type FormValues = z.infer<typeof formSchema>;

const GRADES = ["M7.5", "M10", "M15", "M20", "M25", "M30", "M35", "M40"];

export default function CreateLeadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [grades, setGrades] = useState<string[]>([]);
  const [calcM3, setCalcM3] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const createLead = useCreateLead();
  const { data: customFields = [] } = useCustomFields();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
  });

  const toggleGrade = (g: string) => {
    setGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const calcEstimatedM3 = () => {
    const floors = form.getValues("numberOfFloors") || 0;
    const area = form.getValues("builtUpArea") || 0;
    if (floors && area) {
      const result = Math.round((area * floors * 0.15) / 10) * 10;
      setCalcM3(result);
      form.setValue("estimatedM3", result);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        form.setValue("latitude", String(latitude));
        form.setValue("longitude", String(longitude));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "RMCCRM/1.0" } },
          );
          const data = await res.json();
          if (data?.address) {
            form.setValue("siteAddress", data.display_name || "");
            form.setValue("city", data.address.city || data.address.town || data.address.village || "");
            form.setValue("district", data.address.county || "");
            form.setValue("state", data.address.state || "");
            form.setValue("pincode", data.address.postcode || "");
          }
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true },
    );
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const cfvArray = Object.entries(customFieldValues)
        .filter(([, v]) => v)
        .map(([fieldId, value]) => ({ fieldId, value }));
      const payload = { ...values, gradeRequirements: grades, customFieldValues: cfvArray };
      const result = await createLead.mutateAsync(payload);
      toast.success("Lead created successfully");
      router.push(`/leads/${result.id}`);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const canNext = () => {
    if (step === 1) {
      const { companyName, contactPerson, mobile } = form.watch();
      return companyName && contactPerson && mobile?.length >= 10;
    }
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Create New Lead</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Fill in the details to add a new lead</p>
      </div>

      <div className="flex gap-1">
        {steps.map((s) => (
          <div key={s.id} className="flex-1">
            <div
              className={cn(
                "h-2 rounded-full transition-colors",
                s.id < step ? "bg-blue-500" : s.id === step ? "bg-blue-400" : "bg-zinc-200",
              )}
            />
            <p
              className={cn(
                "mt-1 text-[11px] font-medium",
                s.id <= step ? "text-blue-600" : "text-zinc-400",
              )}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-zinc-900">Customer Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Company Name *</Label>
                <Input {...form.register("companyName")} placeholder="e.g. BuildRight Constructions" />
                {form.formState.errors.companyName && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <div>
                <Label>Client Company</Label>
                <Input {...form.register("clientCompany")} placeholder="e.g. BuildRight Pvt Ltd" />
              </div>
              <div>
                <Label>Builder Name</Label>
                <Input {...form.register("builderName")} placeholder="e.g. Suresh Reddy" />
              </div>
              <div>
                <Label>Project Name</Label>
                <Input {...form.register("projectName")} placeholder="e.g. Green Valley Apartments" />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input {...form.register("contactPerson")} placeholder="Full name" />
                {form.formState.errors.contactPerson && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <div>
                <Label>Designation</Label>
                <Input {...form.register("designation")} placeholder="e.g. Project Director" />
              </div>
              <div>
                <Label>Mobile *</Label>
                <Input {...form.register("mobile")} placeholder="+91-9876543210" />
                {form.formState.errors.mobile && <p className="text-xs text-red-500 mt-1">Enter valid mobile</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" placeholder="email@example.com" />
              </div>
              <div>
                <Label>Existing Vendor</Label>
                <Input {...form.register("existingVendor")} placeholder="e.g. UltraTech RMC" />
              </div>
              <div className="sm:col-span-2">
                <Label>Competitor Notes</Label>
                <Textarea {...form.register("competitorNotes")} rows={2} placeholder="Any competitor information..." />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Site Location</h2>
              <Button type="button" variant="outline" size="sm" onClick={captureLocation} disabled={locating}>
                <MapPin className="h-4 w-4 mr-1.5" />
                {locating ? "Locating..." : "Capture Current Location"}
              </Button>
            </div>
            <div>
              <Label>Site Address</Label>
              <Textarea {...form.register("siteAddress")} rows={2} placeholder="Full site address" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>City</Label>
                <Input {...form.register("city")} placeholder="City" />
              </div>
              <div>
                <Label>District</Label>
                <Input {...form.register("district")} placeholder="District" />
              </div>
              <div>
                <Label>State</Label>
                <Input {...form.register("state")} placeholder="State" />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input {...form.register("pincode")} placeholder="6-digit pincode" />
              </div>
            </div>
            {form.watch("latitude") && form.watch("longitude") && (
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">
                  Coordinates: {form.watch("latitude")}, {form.watch("longitude")}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-zinc-900">Project Details</h2>
            <div className="space-y-3">
              <Label>Project Type</Label>
              <div className="flex flex-wrap gap-2">
                {["residential", "commercial", "industrial", "infrastructure"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("projectType", t)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      form.watch("projectType") === t
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                    )}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Project Status</Label>
                <select
                  {...form.register("projectStatus")}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select</option>
                  {["planning", "excavation", "foundation", "structural", "finishing", "completed"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Number of Floors</Label>
                <Input {...form.register("numberOfFloors")} type="number" placeholder="e.g. 16" />
              </div>
              <div>
                <Label>Built-up Area (sq ft)</Label>
                <Input {...form.register("builtUpArea")} type="number" placeholder="e.g. 48000" />
              </div>
              <div>
                <Label>Estimated Project Value (₹)</Label>
                <Input {...form.register("estimatedValue")} type="number" placeholder="e.g. 25000000" />
              </div>
              <div className="sm:col-span-2">
                <Label>Grade Requirements</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGrade(g)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        grades.includes(g)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-800">m³ Calculator</span>
                <Button type="button" variant="outline" size="sm" onClick={calcEstimatedM3} className="h-7 text-xs">
                  <Calculator className="h-3.5 w-3.5 mr-1" />
                  Calculate
                </Button>
              </div>
              <p className="text-xs text-blue-600 mb-3">
                Floors × Built-up Area × 0.15 (slab factor)
              </p>
              {calcM3 !== null && (
                <p className="text-sm font-semibold text-blue-800">
                  Estimated m³: {calcM3.toLocaleString()}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Estimated m³</Label>
                <Input {...form.register("estimatedM3")} type="number" placeholder="Auto or manual" />
              </div>
              <div>
                <Label>Monthly m³</Label>
                <Input {...form.register("monthlyM3")} type="number" placeholder="e.g. 1200" />
              </div>
              <div>
                <Label>Immediate m³</Label>
                <Input {...form.register("immediateM3")} type="number" placeholder="e.g. 500" />
              </div>
            </div>
            <div>
              <Label>Expected Supply Start Date</Label>
              <Input {...form.register("expectedSupplyDate")} type="date" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-zinc-900">Notes & Stage</h2>
            <div>
              <Label>Lead Stage</Label>
              <select
                {...form.register("stage")}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="meeting_scheduled">Meeting Scheduled</option>
                <option value="site_visited">Site Visited</option>
                <option value="requirement_received">Requirement Received</option>
                <option value="quotation_sent">Quotation Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="trial_order">Trial Order</option>
              </select>
            </div>
            <div>
              <Label>Remarks / Notes</Label>
              <Textarea {...form.register("remarks")} rows={4} placeholder="Any additional notes about this lead..." />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-zinc-900">Custom Fields</h2>
            {customFields.length === 0 ? (
              <p className="text-sm text-zinc-400">No custom fields configured. Add them in Settings.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {customFields.map((cf) => (
                  <div key={cf.id}>
                    <Label>
                      {cf.fieldLabel || cf.fieldName}
                      {cf.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    {cf.fieldType === "textarea" ? (
                      <textarea
                        value={customFieldValues[cf.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        className="h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    ) : cf.fieldType === "select" ? (
                      <select
                        value={customFieldValues[cf.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="">Select</option>
                        {(cf.options || []).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : cf.fieldType === "multiselect" ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(cf.options || []).map((o) => {
                          const selected = (customFieldValues[cf.id] || "").split(",").filter(Boolean);
                          const toggle = () => {
                            const next = selected.includes(o)
                              ? selected.filter((x) => x !== o)
                              : [...selected, o];
                            setCustomFieldValues((prev) => ({ ...prev, [cf.id]: next.join(",") }));
                          };
                          return (
                            <button
                              key={o}
                              type="button"
                              onClick={toggle}
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                selected.includes(o)
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                              )}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    ) : cf.fieldType === "date" ? (
                      <input
                        type="date"
                        value={customFieldValues[cf.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      />
                    ) : (
                      <input
                        type={cf.fieldType === "number" ? "number" : "text"}
                        value={customFieldValues[cf.id] || ""}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            ) : (
              <Link href="/leads">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            {step < 5 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Next
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</>
                ) : (
                  <><Check className="h-4 w-4 mr-1.5" /> Create Lead</>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
