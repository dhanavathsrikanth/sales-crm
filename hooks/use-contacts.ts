import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Contact {
  id: string;
  userId: string | null;
  leadId: string | null;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  designation: string | null;
  company: string | null;
  relationship: string | null;
  tags: string[] | null;
  birthday: string | null;
  anniversary: string | null;
  personalNotes: string | null;
  lastContactedAt: string | null;
  contactFrequency: string | null;
  referredBy: string | null;
  profilePhoto: string | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export interface ContactDetail extends Contact {
  referredByContact: { id: string; firstName: string; lastName: string; company: string; mobile: string } | null;
  linkedLeads: any[];
  interactions: any[];
  callLog: any[];
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  stats: {
    total: number;
    vip: number;
    dueForFollowup: number;
    birthdaysThisMonth: number;
  };
}

export function useContacts(filters: { search: string; relationship: string; company: string; lastContacted: string; sort: string }) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.relationship) params.set("relationship", filters.relationship);
  if (filters.company) params.set("company", filters.company);
  if (filters.lastContacted) params.set("lastContacted", filters.lastContacted);
  if (filters.sort) params.set("sort", filters.sort);

  return useQuery<ContactsResponse>({
    queryKey: ["contacts", filters],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });
}

export function useContact(id: string) {
  return useQuery<ContactDetail>({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch contact");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contact");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", vars.id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log interaction");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact", vars.contactId] });
    },
  });
}

export function useUpcomingBirthdays() {
  return useQuery({
    queryKey: ["birthdays"],
    queryFn: async () => {
      const res = await fetch("/api/contacts/birthdays");
      if (!res.ok) throw new Error("Failed to fetch birthdays");
      return res.json();
    },
  });
}
