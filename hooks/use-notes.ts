import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface QuickNote {
  id: string;
  userId: string;
  content: string;
  color: string;
  isPinned: boolean;
  leadId: string | null;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  lead: { id: string; companyName: string; contactPerson: string } | null;
  contact: { id: string; firstName: string; lastName: string | null; company: string } | null;
}

export function useNotes(filters?: { search?: string; leadId?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.leadId) params.set("leadId", filters.leadId);

  return useQuery<QuickNote[]>({
    queryKey: ["notes", filters],
    queryFn: async () => {
      const qs = params.toString();
      const res = await fetch(`/api/notes${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content: string; color?: string; isPinned?: boolean; leadId?: string; contactId?: string }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; content?: string; color?: string; isPinned?: boolean; leadId?: string | null; contactId?: string | null }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
