import { personName, personInitials } from "@/lib/displayName";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";
import { fetchMemberProfiles, type MemberProfile } from "./useProfile";
import type { FnRow } from "./types";

type DirectoryRow = FnRow<"list_professional_directory">;

export type MentorProfile = {
  user_id: string;
  profiles: { first_name: string; last_name: string };
  sector: string;
  occupation: string;
  country: string;
  state_province?: string;
  city: string;
  bio: string;
  skills: string[];
  availability: string;
  experience_years: number;
  university?: string;
  languages?: string[];
  gender?: string;
};

export type MentorshipRequest = {
  id: string;
  status: string;
  message: string;
  skills_requested: string[];
  created_at: string;
  mentor_id: string;
  mentee_id: string;
  profiles: { first_name: string; last_name: string };
  mentee_profile?: { sector: string; occupation: string };
  mentor_profile?: {
    profiles: { first_name: string; last_name: string };
    sector: string;
    occupation: string;
  };
};

/**
 * List of mentors for the Mentorship page. Excludes mentors the current user
 * has already requested (pending/accepted) — that filter happens client-side
 * because the RPC doesn't expose `_exclude_user_ids` yet.
 */
export function useMentors(userId: string | undefined) {
  return useQuery({
    queryKey: qk.mentorship.mentors(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MentorProfile[]> => {
      const { data: mentorsData, error } = await supabase.rpc(
        "list_professional_directory",
        { _is_mentor: true, _limit: 100 },
      );
      if (error) throw error;

      const { data: existingRequests } = await supabase
        .from("mentorship_requests")
        .select("mentor_id, status")
        .eq("mentee_id", userId!);

      const excluded = new Set(
        (existingRequests ?? [])
          .filter((r) => r.status === "accepted" || r.status === "pending")
          .map((r) => r.mentor_id),
      );

      const rows = (mentorsData ?? []).filter((m: DirectoryRow) => !excluded.has(m.user_id));
      // Directory rows have no bio/skills/availability; load full profiles.
      const full = await fetchMemberProfiles(rows.map((m: DirectoryRow) => m.user_id));
      const fullById = new Map(full.map((f) => [f.profile.user_id, f.professionalProfile]));
      return rows.map((m: DirectoryRow) => ({
        ...m,
        ...(fullById.get(m.user_id) ?? {}),
        user_id: m.user_id,
        profiles: { first_name: m.first_name, last_name: m.last_name },
      })) as unknown as MentorProfile[];
    },
  });
}

/**
 * Mentorship requests where the user is either mentor or mentee.
 * Splits the cross-column query into two parallel queries (iOS-safe).
 */
export function useMentorshipRequests(userId: string | undefined) {
  return useQuery({
    queryKey: qk.mentorship.requests(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MentorshipRequest[]> => {
      const [{ data: asMentor, error: errMentor }, { data: asMentee, error: errMentee }] =
        await Promise.all([
          supabase
            .from("mentorship_requests")
            .select("*")
            .eq("mentor_id", userId!)
            .order("created_at", { ascending: false }),
          supabase
            .from("mentorship_requests")
            .select("*")
            .eq("mentee_id", userId!)
            .order("created_at", { ascending: false }),
        ]);
      if (errMentor) throw errMentor;
      if (errMentee) throw errMentee;

      const requestsData = [...(asMentor ?? []), ...(asMentee ?? [])].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
      if (requestsData.length === 0) return [];

      // Names + job for both sides via get_member_profiles (direct table reads
      // are relationship-scoped, and business accounts have no personal name:
      // fall back to the business name instead of "Unknown").
      const members = await fetchMemberProfiles(
        requestsData.flatMap((r) => [r.mentee_id, r.mentor_id]),
      );
      const byId = new Map(members.map((m) => [m.profile.user_id, m]));
      const nameOf = (id: string) => {
        const p = byId.get(id)?.profile as (MemberProfile["profile"] & { display_name?: string | null }) | undefined;
        return { first_name: personName(p, "A former member"), last_name: "" };
      };
      const jobOf = (id: string) => {
        const pro = byId.get(id)?.professionalProfile;
        return { sector: pro?.sector ?? "", occupation: pro?.occupation ?? "" };
      };

      return requestsData.map((request) => {
        const menteeName = nameOf(request.mentee_id);
        const mentorName = nameOf(request.mentor_id);
        return {
          ...request,
          profiles: menteeName,
          mentee_profile: jobOf(request.mentee_id),
          mentor_profile: { profiles: mentorName, ...jobOf(request.mentor_id) },
        };
      }) as unknown as MentorshipRequest[];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations — all invalidate both mentors and requests so the UI is consistent.
// ─────────────────────────────────────────────────────────────────────────────

function invalidateMentorship(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  queryClient.invalidateQueries({ queryKey: qk.mentorship.all(userId) });
}

export function useRequestMentorship(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mentorUserId,
      message,
      skillsRequested = [],
    }: {
      mentorUserId: string;
      message: string;
      skillsRequested?: string[];
    }) => {
      const { error } = await supabase.rpc("request_mentorship", {
        _mentor_id: mentorUserId,
        _message: message,
        _skills_requested: skillsRequested,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateMentorship(queryClient, userId),
  });
}

export function useUpdateMentorshipRequestStatus(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => invalidateMentorship(queryClient, userId),
  });
}

export function useCancelMentorshipRequest(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => invalidateMentorship(queryClient, userId),
  });
}

export function useDisconnectFromMentor(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({
          status: "disconnected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => invalidateMentorship(queryClient, userId),
  });
}
