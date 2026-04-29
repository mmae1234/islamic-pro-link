import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";

export type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role?: string | null;
  [key: string]: unknown;
};

export type ProfessionalProfileRow = {
  user_id?: string;
  occupation?: string | null;
  sector?: string | null;
  city?: string | null;
  state_province?: string | null;
  country?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  experience_years?: number | null;
  university?: string | null;
  is_mentor?: boolean | null;
  is_seeking_mentor?: boolean | null;
  availability?: string | null;
  preferred_communication?: string[] | null;
  avatar_url?: string | null;
  [key: string]: unknown;
};

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
      const row: any = Array.isArray(basic) ? basic[0] : basic;
      if (!row) {
        return { profile: null, professionalProfile: null, isLimitedView: false };
      }
      return {
        profile: {
          user_id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
        },
        professionalProfile: {
          avatar_url: row.avatar_url,
          occupation: row.occupation,
          sector: row.sector,
          city: row.city,
          country: row.country,
        },
        isLimitedView: true,
      };
    },
  });
}
