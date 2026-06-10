"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Users, Crown, Bell, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactCard from "@/components/contacts/ContactCard";
import ContactFilters from "@/components/contacts/ContactFilters";
import { useContacts, useUpcomingBirthdays } from "@/hooks/use-contacts";

export default function ContactsPage() {
  const [filters, setFilters] = useState({
    search: "",
    relationship: "",
    company: "",
    lastContacted: "",
    sort: "name_asc",
  });

  const { data, isLoading, isError } = useContacts(filters);
  const { data: birthdays } = useUpcomingBirthdays();

  const stats = [
    { icon: Users, label: "Total Contacts", value: data?.stats.total ?? 0, color: "text-blue-600 bg-blue-50" },
    { icon: Crown, label: "Customers (VIP)", value: data?.stats.vip ?? 0, color: "text-amber-600 bg-amber-50" },
    { icon: Bell, label: "Due for Follow-up", value: data?.stats.dueForFollowup ?? 0, color: data && data.stats.dueForFollowup > 0 ? "text-orange-600 bg-orange-50" : "text-zinc-500 bg-zinc-100" },
    { icon: Gift, label: "Birthdays This Month", value: data?.stats.birthdaysThisMonth ?? 0, color: "text-pink-600 bg-pink-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Contacts</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {data ? `${data.total} contact${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/contacts/new">
            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">New Contact</span>
            </Button>
          </Link>
        </div>
      </div>

      {birthdays && birthdays.length > 0 && (
        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-pink-800">
            <Gift className="h-4 w-4 shrink-0" />
            <span className="font-medium">Upcoming Birthdays:</span>
            {birthdays.slice(0, 3).map((b: any) => (
              <span key={b.id} className="bg-white rounded-full px-2 py-0.5 text-xs font-medium text-pink-700 whitespace-nowrap">
                {b.name} ({b.daysUntil <= 0 ? "Today!" : `${b.daysUntil}d`})
              </span>
            ))}
            {birthdays.length > 3 && <span className="text-xs text-pink-500">+{birthdays.length - 3} more</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={s.color.split(" ").slice(0, 2).join(" ") + " flex h-8 w-8 items-center justify-center rounded-lg"}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">{s.value}</p>
                <p className="text-[10px] text-zinc-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ContactFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">Failed to load contacts.</p>
        </div>
      ) : data?.contacts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <Users className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
          <h3 className="font-semibold text-zinc-900">No contacts found</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {filters.search || filters.relationship
              ? "Try adjusting your search or filters."
              : "Start building your network by adding your first contact."}
          </p>
          {!filters.search && !filters.relationship && (
            <Link href="/contacts/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Contact
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
