"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/hooks/construction/use-contacts";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(id);

  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <div className="text-center py-12 text-zinc-500">Customer not found</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title={customer.name}
        action={
          <button onClick={() => router.push("/construction/contacts")} className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Back to Customers
          </button>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {customer.phone && (
            <>
              <span className="text-zinc-400">Phone</span>
              <span className="text-zinc-900">{customer.phone}</span>
            </>
          )}
          {customer.whatsapp && (
            <>
              <span className="text-zinc-400">WhatsApp</span>
              <span className="text-zinc-900">{customer.whatsapp}</span>
            </>
          )}
          {customer.email && (
            <>
              <span className="text-zinc-400">Email</span>
              <span className="text-zinc-900">{customer.email}</span>
            </>
          )}
          {customer.type && (
            <>
              <span className="text-zinc-400">Type</span>
              <span className="text-zinc-900 capitalize">{customer.type}</span>
            </>
          )}
          {customer.city && (
            <>
              <span className="text-zinc-400">City</span>
              <span className="text-zinc-900">{customer.city}</span>
            </>
          )}
          {customer.district && (
            <>
              <span className="text-zinc-400">District</span>
              <span className="text-zinc-900">{customer.district}</span>
            </>
          )}
          {customer.state && (
            <>
              <span className="text-zinc-400">State</span>
              <span className="text-zinc-900">{customer.state}</span>
            </>
          )}
          {customer.address && (
            <>
              <span className="text-zinc-400">Address</span>
              <span className="text-zinc-900">{customer.address}</span>
            </>
          )}
        </div>

        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <span className="text-xs text-zinc-400 block mb-1">Notes</span>
            <p className="text-sm text-zinc-700">{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
