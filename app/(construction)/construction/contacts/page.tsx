"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomers } from "@/hooks/construction/use-contacts";
import { createCustomer, deleteCustomer } from "@/lib/actions/construction/contacts";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { ContactRound, Search, Plus, Phone, MessageCircle, Eye, X, Users, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  individual: "bg-zinc-100 text-zinc-700",
  contractor: "bg-blue-100 text-blue-700",
  builder: "bg-violet-100 text-violet-700",
  dealer: "bg-amber-100 text-amber-700",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useCustomers({
    search: search || undefined,
    type: typeFilter,
  });

  const filters = [
    { label: "All", value: undefined },
    { label: "Individual", value: "individual" },
    { label: "Contractor", value: "contractor" },
    { label: "Builder", value: "builder" },
    { label: "Dealer", value: "dealer" },
  ];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    type: "individual",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constr-customers"] });
      setForm({ name: "", phone: "", whatsapp: "", email: "", city: "", type: "individual", notes: "" });
      setShowForm(false);
      toast.success("Customer created successfully");
    },
    onError: () => toast.error("Failed to create customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constr-customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: () => toast.error("Failed to delete customer"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      email: form.email.trim() || undefined,
      city: form.city.trim() || undefined,
      type: form.type,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Your customer database"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Customer"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
          <h3 className="font-semibold text-zinc-900">New Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="individual">Individual</option>
                <option value="contractor">Contractor</option>
                <option value="builder">Builder</option>
                <option value="dealer">Dealer</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !form.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
              typeFilter === f.value
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Users className="h-4 w-4" />
        <span>{customers?.length ?? 0} customers</span>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          icon={<ContactRound className="h-7 w-7" />}
          title="No customers yet"
          description="Customers will appear here when you create orders or leads."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <Link href={`/construction/contacts/${customer.id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-semibold text-sm">
                  {customer.name.charAt(0).toUpperCase()}
                </Link>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeColors[customer.type ?? "individual"] || ""}`}>
                  {customer.type ?? "individual"}
                </span>
              </div>
              <Link href={`/construction/contacts/${customer.id}`}>
                <h3 className="font-semibold text-zinc-900 hover:text-emerald-600 transition-colors">{customer.name}</h3>
              </Link>
              {customer.phone && (
                <p className="text-sm text-zinc-500 mt-0.5">{customer.phone}</p>
              )}
              {customer.city && (
                <p className="text-xs text-zinc-400 mt-1">{customer.city}</p>
              )}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-zinc-100 flex-wrap">
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="Call"
                  >
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </a>
                )}
                <Link
                  href={`/construction/contacts/${customer.id}`}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${customer.name}? This action cannot be undone.`)) {
                      deleteMutation.mutate(customer.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete customer"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
