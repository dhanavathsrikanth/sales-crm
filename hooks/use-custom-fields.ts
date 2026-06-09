import { useQuery } from "@tanstack/react-query";

export interface CustomField {
  id: string;
  fieldName: string;
  fieldLabel: string | null;
  fieldType: "text" | "number" | "select" | "multiselect" | "date" | "textarea";
  options: string[] | null;
  isRequired: boolean | null;
  sortOrder: number | null;
}

export function useCustomFields() {
  return useQuery<CustomField[]>({
    queryKey: ["custom-fields"],
    queryFn: async () => {
      const res = await fetch("/api/custom-fields");
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
  });
}
