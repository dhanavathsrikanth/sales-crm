"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, ContactRound, Sun, CalendarCheck,
  MapPin, PhoneCall, Goal, BarChart3, StickyNote, Settings,
  FileText, Phone,
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

interface Note {
  id: string;
  content: string;
  leadId: string | null;
  contactId: string | null;
  createdAt: string | null;
}

interface CallLog {
  id: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  phoneNumber: string | null;
  leadCompanyName: string | null;
  leadId: string | null;
  contactId: string | null;
  callDate: string | null;
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}&limit=5` : "?limit=5";
      const [leadsRes, contactsRes, notesRes, callsRes] = await Promise.all([
        fetch(`/api/leads/search${params}`),
        fetch(`/api/contacts/search${params}`),
        fetch(`/api/notes${q ? `?search=${encodeURIComponent(q)}` : ""}`),
        fetch(`/api/calls${q ? `?search=${encodeURIComponent(q)}` : ""}`),
      ]);
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(Array.isArray(data) ? data : data.leads?.slice(0, 5) || []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(Array.isArray(data) ? data : data.contacts?.slice(0, 5) || []);
      }
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes((data.notes || data || []).slice(0, 5));
      }
      if (callsRes.ok) {
        const data = await callsRes.json();
        setCalls((data.calls || data || []).slice(0, 5));
      }
    } catch {
      setLeads([]);
      setContacts([]);
      setNotes([]);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      fetchData("");
    }
  }, [commandPaletteOpen, fetchData]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const timer = setTimeout(() => fetchData(query), 300);
    return () => clearTimeout(timer);
  }, [query, commandPaletteOpen, fetchData]);

  function navigate(href: string) {
    setCommandPaletteOpen(false);
    router.push(href);
  }

  const hasResults = leads.length > 0 || contacts.length > 0 || notes.length > 0 || calls.length > 0;

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput
        placeholder="Search leads, contacts, notes, calls..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching..." : "No results found."}</CommandEmpty>

        {!query && (
          <CommandGroup heading="Navigate">
            {pageNavItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => navigate(item.href)}
                className="flex items-center gap-3"
              >
                <item.icon className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium">{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query && hasResults && <CommandSeparator />}

        {leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.map((lead) => (
              <CommandItem
                key={`l-${lead.id}`}
                value={`${lead.companyName || ""} ${lead.contactPerson || ""} ${lead.city || ""} ${lead.mobile || ""}`}
                onSelect={() => navigate(`/leads/${lead.id}`)}
                className="flex items-center gap-3"
              >
                <Building2 className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{lead.companyName || "Untitled"}</span>
                  <span className="text-xs text-zinc-500 truncate">
                    {lead.contactPerson || ""}
                    {lead.city ? ` · ${lead.city}` : ""}
                    {lead.mobile ? ` · ${lead.mobile}` : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {contacts.map((contact) => (
              <CommandItem
                key={`c-${contact.id}`}
                value={`${contact.firstName} ${contact.lastName || ""} ${contact.company || ""} ${contact.mobile || ""}`}
                onSelect={() => navigate(`/contacts/${contact.id}`)}
                className="flex items-center gap-3"
              >
                <ContactRound className="h-4 w-4 text-emerald-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {contact.firstName} {contact.lastName}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    {contact.company || ""}
                    {contact.mobile ? ` · ${contact.mobile}` : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {notes.length > 0 && (
          <CommandGroup heading="Notes">
            {notes.map((note) => (
              <CommandItem
                key={`n-${note.id}`}
                value={note.content.slice(0, 120)}
                onSelect={() => note.leadId ? navigate(`/leads/${note.leadId}`) : navigate("/notes")}
                className="flex items-center gap-3"
              >
                <StickyNote className="h-4 w-4 text-amber-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{note.content.slice(0, 60)}{note.content.length > 60 ? "..." : ""}</span>
                  {note.leadId && (
                    <span className="text-xs text-zinc-500">Linked to lead</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {calls.length > 0 && (
          <CommandGroup heading="Calls">
            {calls.map((call) => (
              <CommandItem
                key={`cl-${call.id}`}
                value={`${call.contactFirstName || ""} ${call.contactLastName || ""} ${call.leadCompanyName || ""} ${call.phoneNumber || ""}`}
                onSelect={() => call.leadId ? navigate(`/leads/${call.leadId}`) : navigate("/calls")}
                className="flex items-center gap-3"
              >
                <Phone className="h-4 w-4 text-violet-500" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {call.contactFirstName || call.leadCompanyName || call.phoneNumber || "Unknown"}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    {call.phoneNumber || ""}
                    {call.leadCompanyName ? ` · ${call.leadCompanyName}` : ""}
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