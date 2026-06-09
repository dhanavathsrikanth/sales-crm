import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStage,
  searchLeads,
} from "@/lib/actions/leads";

export interface Lead {
  id: string;
  userId: string | null;
  companyName: string | null;
  clientCompany: string | null;
  builderName: string | null;
  projectName: string | null;
  contactPerson: string | null;
  designation: string | null;
  mobile: string | null;
  email: string | null;
  siteAddress: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  existingVendor: string | null;
  competitorNotes: string | null;
  remarks: string | null;
  stage: string | null;
  leadScore: number | null;
  projectType: string | null;
  projectStatus: string | null;
  estimatedValue: string | null;
  numberOfFloors: number | null;
  builtUpArea: string | null;
  estimatedM3: string | null;
  monthlyM3: string | null;
  immediateM3: string | null;
  gradeRequirements: string[] | null;
  expectedSupplyDate: string | null;
  lostReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LeadDetail extends Lead {
  followups: any[];
  visits: any[];
  photos: any[];
  activities: any[];
  stageHistory: any[];
  customFieldValues: any[];
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadFilters {
  search: string;
  stages: string[];
  projectType: string;
  city: string;
  dateFrom: string;
  dateTo: string;
  existingVendor: string;
  sort: string;
  page: number;
}

export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: async () => {
      const result = await getLeads(
        {
          search: filters.search || undefined,
          stages: filters.stages.length > 0 ? filters.stages : undefined,
          projectType: filters.projectType || undefined,
          city: filters.city || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          existingVendor: filters.existingVendor || undefined,
          sort: filters.sort || undefined,
        },
        { page: filters.page, limit: 20 },
      );
      if (!result.success) throw new Error(result.error || "Failed to fetch leads");
      return result.data as LeadsResponse;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const result = await getLeadById(id);
      if (!result.success) throw new Error(result.error || "Failed to fetch lead");
      return result.data as LeadDetail;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createLead(data);
      if (!result.success) throw new Error(result.error || "Failed to create lead");
      return result.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const result = await updateLead(id, data);
      if (!result.success) throw new Error(result.error || "Failed to update lead");
      return result.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", vars.id] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLead(id);
      if (!result.success) throw new Error(result.error || "Failed to delete lead");
      return result.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, notes }: { id: string; stage: string; notes?: string }) => {
      const result = await updateLeadStage(id, stage, notes);
      if (!result.success) throw new Error(result.error || "Failed to update stage");
      return result.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSearchLeads(query: string) {
  return useQuery({
    queryKey: ["searchLeads", query],
    queryFn: async () => {
      const result = await searchLeads(query);
      if (!result.success) throw new Error(result.error || "Failed to search leads");
      return result.data;
    },
    enabled: query.length > 0,
  });
}
