import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";
import type { Tbl, FnRow } from "./types";

// Full row from `profiles` table.
export type ProfileRow = Tbl<"profiles">;
// Full row from `professional_profiles` table.
export type ProfessionalProfileRow = Tbl<"professional_profiles">;
// Limited public-view row from the SECURITY DEFINER fallback.
type LookupBasicRow = FnRow<"lookup_profile_basic">;

export type ProfileResult = {
  profile: ProfileRow | null;
  professionalProfile: ProfessionalProfileRow | null;
  isLimitedView: boolean;
};

/**
 * Loads the full profile + professional_profile for a userId. Falls back to
 * the SECURITY DEFINER `lookup_profile_basic` RPC when the direct read fails
 * RLS (limited public view).
 */
export function useProfile(userId: string | undefined, viewerId: string | undefined) {
  return useQuery({
    queryKey: qk.profile.detail(userId),
    enabled: !!userId && !!viewerId,
    queryFn: async (): Promise<ProfileResult> => {
      // Try the related-party full read first (works when can_view_profile passes).
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (profileData) {
        const { data: professionalData } = await supabase
          .from("professional_profiles")
          .select("*")
          .eq("user_id", userId!)
          .maybeSingle();
        return {
          profile: profileData as ProfileRow,
          professionalProfile: (professionalData as ProfessionalProfileRow) ?? null,
          isLimitedView: false,
        };
      }

      // Fallback: limited public view via SECURITY DEFINER RPC.
      const { data: basic, error: basicErr } = await supabase.rpc(
        "lookup_profile_basic",
        { _user_id: userId! },
      );
      if (basicErr) throw basicErr;
      const row: LookupBasicRow | undefined = Array.isArray(basic)
        ? basic[0]
        : (basic as LookupBasicRow | undefined);
      if (!row) {
        return { profile: null, professionalProfile: null, isLimitedView: false };
      }
      // Build a partial Profile / ProfessionalProfile from the limited fields.
      // We only fill the fields the basic-view returns; the rest stay undefined.
      return {
        profile: {
          user_id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
        } as ProfileRow,
        professionalProfile: {
          avatar_url: row.avatar_url,
          occupation: row.occupation,
          sector: row.sector,
          city: row.city,
          country: row.country,
        } as ProfessionalProfileRow,
        isLimitedView: true,
      };
    },
  });
}
