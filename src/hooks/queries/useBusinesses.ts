import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk, type BusinessFilters } from "./keys";

export type BusinessAccount = {
  id: string;
  name: string | null;
  sector: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  logo_url: string | null;
};

/**
 * Business directory search via SECURITY DEFINER RPC. Only exposes safe
 * public fields (no contact info).
 *
 * Gated on `userId` because the directory is private to authenticated users.
 */
export function useBusinesses(
  userId: string | undefined,
  filters: BusinessFilters,
) {
  return useQuery({
    queryKey: qk.businesses.list(userId, filters),
    enabled: !!userId,
    queryFn: async (): Promise<BusinessAccount[]> => {
      const { data, error } = await supabase.rpc("search_business_directory", {
        search_term: filters.searchTerm || null,
        filter_country: filters.country || null,
        filter_state: filters.state || null,
        filter_city: filters.city || null,
        filter_sector: filters.sector || null,
        verified_only: !!filters.verifiedOnly,
        result_limit: 50,
      });

      if (error) throw error;
      return (data ?? []) as BusinessAccount[];
    },
  });
}

/**
 * Single business by ID via dedicated RPC. Used by Favorites and BusinessProfile.
 */
export function useBusinessById(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.businesses.detail(id) : qk.businesses.detail("__none__"),
    enabled: !!id,
    queryFn: async (): Promise<BusinessAccount | null> => {
      const { data, error } = await supabase.rpc("get_business_by_id", {
        _id: id!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as BusinessAccount) ?? null;
    },
  });
}

export function useBusinessSectors(enabled: boolean) {
  return useQuery({
    queryKey: qk.businesses.sectors,
    enabled,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc("get_business_sectors");
      if (error) throw error;
      return ((data ?? []) as Array<{ sector: string | null }>)
        .map((d) => d.sector)
        .filter((s): s is string => !!s);
    },
  });
}
