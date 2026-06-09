"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, ContactRound, Sun, CalendarCheck,
  MapPin, PhoneCall, Goal, BarChart3, StickyNote, Settings,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/store";

interface Lead {
  id: string;
  companyName: string | null;
  contactPerson: string | null;
  mobile: string | null;
  city: string | null;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  company: string | null;
}

const pageNavItems = [
  { href: "/", label: "My Day", icon: Sun },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/visits", label: "Visits", icon: MapPin },
  { href: "/calls", label: "Call Log", icon: PhoneCall },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function QuickSearch() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [leadsRes, contactsRes] = await Promise.all([
          fetch("/api/leads/search?q=&limit=5"),
          fetch("/api/contacts/search?q=&limit=5"),
        ]);
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(Array.isArray(data) ? data : data.leads?.slice(0, 5) || []);
        }
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(Array.isArray(data) ? data : data.contacts?.slice(0, 5) || []);
        }
      } catch {
        setLeads([]);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    if (commandPaletteOpen) fetchData();
  }, [commandPaletteOpen]);

  function navigate(href: string) {
    setCommandPaletteOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search leads, contacts, or navigate pages..." />
      <CommandList>
        <CommandEmpty>{loading ? "Searching..." : "No results found."}</CommandEmpty>

        <CommandGroup heading="Navigate">
          {pageNavItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => navigate(item.href)}
              className="flex items-center gap-3"
            >
              <item.icon className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium">{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {contacts.length > 0 && (
          <CommandGroup heading="Recent Contacts">
            {contacts.slice(0, 5).map((contact) => (
              <CommandItem
                key={`c-${contact.id}`}
                onSelect={() => navigate(`/contacts/${contact.id}`)}
                className="flex items-center gap-3"
              >
                <ContactRound className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {contact.firstName} {contact.lastName}
                  </span>
                  {contact.company && (
                    <span className="text-xs text-zinc-500">{contact.company}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {leads.length > 0 && (
          <CommandGroup heading="Recent Leads">
            {leads.slice(0, 5).map((lead) => (
              <CommandItem
                key={`l-${lead.id}`}
                onSelect={() => navigate(`/leads/${lead.id}`)}
                className="flex items-center gap-3"
              >
                <Building2 className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lead.companyName || "Untitled"}</span>
                  <span className="text-xs text-zinc-500">
                    {lead.contactPerson || ""}
                    {lead.city ? ` \u2022 ${lead.city}` : ""}
                    {lead.mobile ? ` \u2022 ${lead.mobile}` : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
