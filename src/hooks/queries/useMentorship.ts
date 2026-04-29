import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";
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

      return (mentorsData ?? [])
        .filter((m: DirectoryRow) => !excluded.has(m.user_id))
        .map((m: DirectoryRow) => ({
          ...m,
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

      const menteeIds = requestsData.map((r) => r.mentee_id);
      const mentorIds = requestsData.map((r) => r.mentor_id);

      const [{ data: menteesData }, { data: mentorsData }, { data: mentorNamesData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", menteeIds),
          supabase
            .from("professional_profiles")
            .select("user_id, sector, occupation")
            .in("user_id", mentorIds),
          supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", mentorIds),
        ]);

      return requestsData.map((request) => ({
        ...request,
        profiles:
          menteesData?.find((m) => m.user_id === request.mentee_id) ?? {
            first_name: "Unknown",
            last_name: "",
          },
        mentor_profile: {
          profiles:
            mentorNamesData?.find((m) => m.user_id === request.mentor_id) ?? {
              first_name: "Unknown",
              last_name: "",
            },
          ...(mentorsData?.find((m) => m.user_id === request.mentor_id) ?? {
            sector: "",
            occupation: "",
          }),
        },
      })) as unknown as MentorshipRequest[];
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
