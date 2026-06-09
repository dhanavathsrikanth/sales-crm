"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useCreateContact } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Loader2, Camera } from "lucide-react";
import Link from "next/link";

const RELATIONSHIPS = [
  { value: "customer", label: "Customer" },
  { value: "contractor", label: "Contractor" },
  { value: "consultant", label: "Consultant" },
  { value: "competitor", label: "Competitor" },
  { value: "referral", label: "Referral" },
  { value: "friend", label: "Friend" },
];

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const PRESET_TAGS = [
  "Decision maker", "Price sensitive", "Quality focused", "Fast decision",
  "Long term", "Referral source", "VIP", "New contact", "Key account",
];

export default function CreateContactPage() {
  const router = useRouter();
  const createContact = useCreateContact();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(false);
  const [referredBySearch, setReferredBySearch] = useState("");
  const [referredByResults, setReferredByResults] = useState<any[]>([]);
  const [selectedReferredBy, setSelectedReferredBy] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      whatsapp: "",
      email: "",
      designation: "",
      company: "",
      relationship: "friend",
      birthday: "",
      personalNotes: "",
      contactFrequency: "monthly",
    },
  });

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const searchReferredBy = async (q: string) => {
    setReferredBySearch(q);
    if (q.length < 2) return setReferredByResults([]);
    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setReferredByResults(data);
    } catch {}
  };

  const onSubmit = async (values: any) => {
    const payload = {
      ...values,
      tags,
      referredBy: selectedReferredBy?.id || null,
      whatsappSameAsMobile: whatsappSame,
    };
    const result = await createContact.mutateAsync(payload);
    router.push(`/contacts/${result.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contacts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">New Contact</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Add someone to your network</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Profile Photo</p>
              <p className="text-xs text-zinc-500">Upload from camera or gallery</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>First Name *</Label>
              <Input {...form.register("firstName")} placeholder="First name" required />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input {...form.register("lastName")} placeholder="Last name" />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input {...form.register("mobile")} placeholder="+91-9876543210" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <div className="space-y-2">
                <Input
                  {...form.register("whatsapp")}
                  placeholder="WhatsApp number"
                  disabled={whatsappSame}
                />
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={whatsappSame}
                    onChange={(e) => setWhatsappSame(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  Same as mobile
                </label>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="email@example.com" />
            </div>
            <div>
              <Label>Designation</Label>
              <Input {...form.register("designation")} placeholder="e.g. Project Director" />
            </div>
            <div>
              <Label>Company</Label>
              <Input {...form.register("company")} placeholder="e.g. BuildRight Constructions" />
            </div>
          </div>

          <div>
            <Label>Relationship Type</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => form.setValue("relationship", r.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    form.watch("relationship") === r.value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    tags.includes(tag) ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add custom tag..."
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addNewTag} className="h-8 text-xs">Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {tag}
                    <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Referred By</Label>
            <div className="relative">
              <Input
                value={referredBySearch}
                onChange={(e) => searchReferredBy(e.target.value)}
                placeholder="Search existing contacts..."
                className="h-9"
              />
              {selectedReferredBy && (
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-zinc-50 p-2">
                  <span className="text-xs text-zinc-700">{selectedReferredBy.firstName} {selectedReferredBy.lastName}</span>
                  <button type="button" onClick={() => { setSelectedReferredBy(null); setReferredBySearch(""); }} className="text-xs text-red-500">Remove</button>
                </div>
              )}
              {referredByResults.length > 0 && !selectedReferredBy && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {referredByResults.map((r: any) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setSelectedReferredBy(r); setReferredByResults([]); setReferredBySearch(`${r.firstName} ${r.lastName}`); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      {r.firstName} {r.lastName} {r.company && <span className="text-zinc-400">— {r.company}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Contact Frequency</Label>
            <div className="flex gap-2 mt-1">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => form.setValue("contactFrequency", f.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    form.watch("contactFrequency") === f.value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-2">
            <div>
              <Label>Birthday</Label>
              <Input {...form.register("birthday")} type="date" className="h-9" />
            </div>
          </div>

          <div>
            <Label>Personal Notes</Label>
            <Textarea
              {...form.register("personalNotes")}
              rows={4}
              placeholder="e.g. Prefers WhatsApp. Decision maker for Site B. Loves cricket."
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/contacts">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createContact.isPending}>
            {createContact.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</>
            ) : (
              <><Check className="h-4 w-4 mr-1.5" /> Create Contact</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
