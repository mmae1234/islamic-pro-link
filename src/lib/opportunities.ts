import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export const OPPORTUNITY_KINDS = [
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract / freelance" },
  { value: "volunteer", label: "Volunteer" },
] as const;
export const kindLabel = (k: string) => OPPORTUNITY_KINDS.find((o) => o.value === k)?.label ?? "Opportunity";

export const WORKPLACES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;
export const workplaceLabel = (w: string) => WORKPLACES.find((o) => o.value === w)?.label ?? w;

export type Opportunity = {
  id: string;
  business_id: string;
  business_name: string | null;
  business_logo_url: string | null;
  business_kind: string;
  kind: string;
  title: string;
  description: string | null;
  workplace: string;
  city: string | null;
  state: string | null;
  country: string | null;
  pay: string | null;
  /** null for signed-out visitors */
  apply_url: string | null;
  closes_on: string | null;
  created_at: string;
};

export function useOpportunities(params: { kind?: string; search?: string; businessId?: string; id?: string }, signedIn: boolean) {
  return useQuery({
    queryKey: ["opportunities", params, signedIn],
    queryFn: async (): Promise<Opportunity[]> => {
      const { data, error } = await db.rpc("list_opportunities", {
        _kind: params.kind && params.kind !== "all" ? params.kind : null,
        _search: params.search?.trim() || null,
        _business_id: params.businessId ?? null,
        _id: params.id ?? null,
      });
      if (error) throw error;
      return (data ?? []) as Opportunity[];
    },
  });
}
