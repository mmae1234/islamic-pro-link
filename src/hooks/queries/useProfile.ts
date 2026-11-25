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
  // Not in generated types yet; cast through unknown.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: Error | null }>;
  const { data, error } = await rpc("get_member_profiles", { _user_ids: unique });
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
      const [row] = await fetchMemberProfiles([userId!]);
      if (!row) return { profile: null, professionalProfile: null, isLimitedView: false };
      return { profile: row.profile, professionalProfile: row.professionalProfile, isLimitedView: false };
    },
  });
}
