import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk, type BusinessFilters } from "./keys";
import type { FnRow } from "./types";

/**
 * Public-safe business shape returned by both `search_business_directory` and
 * `get_business_by_id`. The two RPCs share the same Returns row.
 */
export type BusinessAccount = FnRow<"search_business_directory">;

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
        search_term: filters.searchTerm || undefined,
        filter_country: filters.country || undefined,
        filter_state: filters.state || undefined,
        filter_city: filters.city || undefined,
        filter_sector: filters.sector || undefined,
        verified_only: !!filters.verifiedOnly,
        result_limit: 50,
      });

      if (error) throw error;
      return data ?? [];
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
      return (row as BusinessAccount | undefined) ?? null;
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
      return (data ?? [])
        .map((d) => d.sector)
        .filter((s): s is string => !!s);
    },
  });
}
