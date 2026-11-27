import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";
import type { Tbl } from "./types";

// Full row from `profiles` table.
export type ProfileRow = Tbl<"profiles">;
// Full row from `professional_profiles` table.
export type ProfessionalProfileRow = Tbl<"professional_profiles">;

export type ProfileResult = {
  profile: ProfileRow | null;
  professionalProfile: ProfessionalProfileRow | null;
  isLimitedView: boolean;
};

export type MemberProfile = {
  profile: ProfileRow;
  professionalProfile: ProfessionalProfileRow | null;
};

/**
 * Profiles of other members via the get_member_profiles RPC: any signed-in
 * member can see a professional's full profile (except their WhatsApp
 * number until a conversation is active); blocked pairs are never returned.
 * Results keep the order of `ids`.
 */
export async function fetchMemberProfiles(ids: string[]): Promise<MemberProfile[]> {
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 200);
  if (unique.length === 0) return [];
  // Keep the client receiver: rpc uses this.rest internally.
  const { data, error } = await supabase.rpc("get_member_profiles", { _user_ids: unique });
  if (error) throw error;
  return ((data ?? []) as Array<{ profile: ProfileRow; professional: ProfessionalProfileRow | null }>).map(
    (r) => ({ profile: r.profile, professionalProfile: r.professional ?? null }),
  );
}

/** Loads one member's profile for the profile page. */
export function useProfile(userId: string | undefined, viewerId: string | undefined) {
  return useQuery({
    queryKey: qk.profile.detail(userId),
    enabled: !!userId && !!viewerId,
    queryFn: async (): Promise<ProfileResult> => {
      if (!userId || !viewerId) return { profile: null, professionalProfile: null, isLimitedView: false };
      const [row] = await fetchMemberProfiles([userId]);
      if (!row) return { profile: null, professionalProfile: null, isLimitedView: false };
      return { profile: row.profile, professionalProfile: row.professionalProfile, isLimitedView: false };
    },
  });
}

/** The signed-in user's account role ('professional' | 'business' | 'visitor' ...). */
export function useMyRole(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-role", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", userId!).maybeSingle();
      return (data?.role as string | undefined) ?? null;
    },
  });
}
