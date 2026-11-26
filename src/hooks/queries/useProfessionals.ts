import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk, type ProfessionalFilters } from "./keys";
import type { FnRow, ProfileNameSlice } from "./types";

/**
 * Row shape returned by `list_professional_directory` RPC, normalized to
 * what `ProfessionalCard` expects (it reads `professional.profiles.first_name`).
 *
 * The RPC returns a flat row; we synthesize a `profiles` slice for compatibility
 * with components that pre-date the RPC migration.
 */
export type DirectoryRpcRow = FnRow<"list_professional_directory">;

export type ProfessionalListRow = DirectoryRpcRow & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  // The RPC return type doesn't enumerate every field that downstream cards
  // optionally read (bio, skills, etc.). Allow extras as a typed escape hatch
  // until the RPC type is regenerated to expose them.
  bio?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  university?: string | null;
  availability?: string | null;
  gender?: string | null;
  id?: string;
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
      const many = (v?: string[]) => (v && v.length > 0 ? v : undefined);
      const int = (v?: string) => {
        const n = v ? parseInt(v, 10) : NaN;
        return Number.isNaN(n) ? undefined : n;
      };
      // Universities / languages / skills / experience are filtered on the
      // server (20261126170000); the generated types don't list them yet.
      const { data, error } = await supabase.rpc("list_professional_directory", {
        _country: normalizeFilter(filters.country) ?? undefined,
        _state_province: normalizeFilter(filters.stateProvince) ?? undefined,
        _city: normalizeFilter(filters.city) ?? undefined,
        _sector: normalizeFilter(filters.sector) ?? undefined,
        _occupation: normalizeFilter(filters.occupation) ?? undefined,
        _is_mentor: filters.isMentor ? true : undefined,
        _is_seeking_mentor: filters.isSeekingMentor ? true : undefined,
        _search: filters.searchTerm || undefined,
        _limit: 100,
        _offset: 0,
        _universities: many(filters.universities),
        _languages: many(filters.languages),
        _skills: many(filters.skills),
        _min_experience: int(filters.experienceMin),
        _max_experience: int(filters.experienceMax),
      } as never);

      if (error) throw error;

      // Shape rows so ProfessionalCard's `professional.profiles.*` lookups work.
      const rows: ProfessionalListRow[] = ((data ?? []) as DirectoryRpcRow[]).map((r) => ({
        ...r,
        profiles: {
          first_name: r.first_name,
          last_name: r.last_name,
          avatar_url: r.avatar_url,
        },
      }));

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
  profiles: ProfileNameSlice | null;
};

// PostgREST returns embedded relations as either a single object or an array
// depending on the FK cardinality it infers. Normalize to one shape.
type EmbeddedProfilePayload = {
  user_id: string;
  occupation: string | null;
  sector: string | null;
  profiles: ProfileNameSlice | ProfileNameSlice[] | null;
};

export function useComposePickerProfessionals(userId: string | undefined) {
  return useQuery({
    queryKey: qk.professionals.composePicker(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ComposePickerRow[]> => {
      // The directory RPC lists every named professional (not just people
      // you already talk to) and respects blocks.
      const { data, error } = await supabase.rpc("list_professional_directory", { _limit: 100 });
      if (error) throw error;
      return (data ?? [])
        .filter((r) => r.user_id !== userId)
        .map((r) => ({
          user_id: r.user_id,
          occupation: r.occupation,
          sector: r.sector,
          profiles: { first_name: r.first_name ?? "", last_name: r.last_name ?? "" },
        }));
    },
  });
}
