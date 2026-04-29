import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk, type ProfessionalFilters } from "./keys";

/**
 * Row shape returned by `list_professional_directory` RPC, normalized to
 * what `ProfessionalCard` expects (it reads `professional.profiles.first_name`).
 */
export type ProfessionalListRow = {
  id?: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  occupation: string | null;
  sector: string | null;
  city: string | null;
  country: string | null;
  state_province?: string | null;
  university?: string | null;
  bio: string | null;
  skills: string[] | null;
  languages?: string[] | null;
  experience_years: number | null;
  is_mentor: boolean | null;
  is_seeking_mentor: boolean | null;
  availability: string | null;
  gender?: string | null;
  // Synthesized for ProfessionalCard compatibility
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

const normalizeFilter = (v: string | undefined) =>
  v && v !== "all" ? v : null;

/**
 * Search/list professionals via the SECURITY DEFINER RPC.
 * Mentor variant: pass `{ isMentor: true }`.
 *
 * `enabled` lets callers gate on auth ready or profile-completed checks.
 */
export function useProfessionals(
  filters: ProfessionalFilters,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: qk.professionals.list(filters),
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ProfessionalListRow[]> => {
      const { data, error } = await supabase.rpc("list_professional_directory", {
        _country: normalizeFilter(filters.country),
        _state_province: normalizeFilter(filters.stateProvince),
        _city: normalizeFilter(filters.city),
        _sector: normalizeFilter(filters.sector),
        _occupation: normalizeFilter(filters.occupation),
        _is_mentor: filters.isMentor ? true : null,
        _is_seeking_mentor: filters.isSeekingMentor ? true : null,
        _search: filters.searchTerm || null,
        _limit: 100,
        _offset: 0,
      });

      if (error) throw error;

      // Shape rows so ProfessionalCard's `professional.profiles.*` lookups work.
      let rows: ProfessionalListRow[] = (data ?? []).map((r: any) => ({
        ...r,
        profiles: {
          first_name: r.first_name,
          last_name: r.last_name,
          avatar_url: r.avatar_url,
        },
      }));

      // Client-side post-filters not yet exposed by the RPC.
      if (filters.experienceMin) {
        const min = parseInt(filters.experienceMin, 10);
        if (!Number.isNaN(min)) {
          rows = rows.filter((r) => (r.experience_years ?? 0) >= min);
        }
      }
      if (filters.experienceMax) {
        const max = parseInt(filters.experienceMax, 10);
        if (!Number.isNaN(max)) {
          rows = rows.filter((r) => (r.experience_years ?? 0) <= max);
        }
      }

      return rows;
    },
  });
}

/**
 * Compact list for the Messages "Compose" recipient picker.
 * Direct table read (legacy) — RLS scopes visibility.
 */
export type ComposePickerRow = {
  user_id: string;
  occupation: string | null;
  sector: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export function useComposePickerProfessionals(userId: string | undefined) {
  return useQuery({
    queryKey: qk.professionals.composePicker(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ComposePickerRow[]> => {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select(
          `user_id, occupation, sector,
           profiles!professional_profiles_user_id_fkey(first_name, last_name)`,
        )
        .neq("user_id", userId!)
        .limit(100);

      if (error) throw error;
      // The select returns profiles either as a nested object or array depending on
      // PostgREST version — normalize to a single object.
      return (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        occupation: r.occupation,
        sector: r.sector,
        profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
      }));
    },
  });
}
