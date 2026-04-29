import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./keys";
import type { BusinessAccount } from "./useBusinesses";

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Just the list of business IDs the user has favorited — cheap and used by
 * the Businesses directory page to highlight current favorites.
 */
export function useFavoriteBusinessIds(userId: string | undefined) {
  return useQuery({
    queryKey: qk.favorites.businessIds(userId),
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("business_id")
        .eq("user_id", userId!)
        .not("business_id", "is", null);
      if (error) throw error;
      return (data ?? [])
        .map((r) => r.business_id)
        .filter((id): id is string => !!id);
    },
  });
}

/**
 * Full business records for each favorited business (for the Favorites page).
 * Fetches each via the single-row RPC in parallel — much faster than
 * scanning the whole directory.
 */
export function useFavoriteBusinesses(userId: string | undefined) {
  return useQuery({
    queryKey: qk.favorites.businesses(userId),
    enabled: !!userId,
    queryFn: async (): Promise<BusinessAccount[]> => {
      const { data: favBizRows, error: favBizErr } = await supabase
        .from("favorites")
        .select("business_id")
        .eq("user_id", userId!)
        .not("business_id", "is", null);
      if (favBizErr) throw favBizErr;

      const businessIds = (favBizRows ?? [])
        .map((r) => r.business_id)
        .filter((id): id is string => !!id);

      if (businessIds.length === 0) return [];

      const results = await Promise.all(
        businessIds.map(async (bid) => {
          const { data, error } = await supabase.rpc("get_business_by_id", {
            _id: bid,
          });
          if (error) return null;
          const row = Array.isArray(data) ? data[0] : data;
          return (row as BusinessAccount) ?? null;
        }),
      );
      return results.filter((b): b is BusinessAccount => !!b);
    },
  });
}

export type FavoriteProfessional = {
  id: string;
  professional_id: string;
  created_at: string;
  professional_profile: {
    user_id: string;
    occupation: string;
    sector: string;
    city: string;
    country: string;
    bio: string;
    avatar_url: string;
    skills: string[];
    is_mentor: boolean;
    availability: string;
    profiles: { first_name: string; last_name: string };
  };
};

export function useFavoriteProfessionals(userId: string | undefined) {
  return useQuery({
    queryKey: qk.favorites.professionals(userId),
    enabled: !!userId,
    queryFn: async (): Promise<FavoriteProfessional[]> => {
      const { data: favProfs, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;

      if (!favProfs || favProfs.length === 0) return [];

      const professionalIds = favProfs
        .map((fav) => fav.professional_id)
        .filter((id): id is string => !!id);

      if (professionalIds.length === 0) return [];

      const { data: professionals, error: profError } = await supabase
        .from("professional_profiles")
        .select(
          `*, profiles!professional_profiles_user_id_fkey(first_name, last_name)`,
        )
        .in("user_id", professionalIds);
      if (profError) throw profError;

      return favProfs
        .map((fav) => {
          const profile = professionals?.find(
            (p) => p.user_id === fav.professional_id,
          );
          if (!profile) return null;
          return {
            ...(fav as any),
            professional_profile: profile,
          } as FavoriteProfessional;
        })
        .filter((f): f is FavoriteProfessional => !!f);
    },
  });
}

export type FavoriteMentor = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  created_at: string;
  mentor_profile: {
    user_id: string;
    occupation: string;
    sector: string;
    city: string;
    country: string;
    bio: string;
    avatar_url: string;
    skills: string[];
    availability: string;
    profiles: { first_name: string; last_name: string };
  };
};

export function useFavoriteMentors(userId: string | undefined) {
  return useQuery({
    queryKey: qk.favorites.mentorRequests(userId),
    enabled: !!userId,
    queryFn: async (): Promise<FavoriteMentor[]> => {
      const { data: mentorRequests, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq("mentee_id", userId!);
      if (error) throw error;

      if (!mentorRequests || mentorRequests.length === 0) return [];

      const mentorIds = mentorRequests.map((req) => req.mentor_id);
      const { data: mentorProfiles, error: profErr } = await supabase
        .from("professional_profiles")
        .select(
          `*, profiles!professional_profiles_user_id_fkey(first_name, last_name)`,
        )
        .in("user_id", mentorIds);
      if (profErr) throw profErr;

      return mentorRequests
        .map((req) => {
          const profile = mentorProfiles?.find((p) => p.user_id === req.mentor_id);
          if (!profile) return null;
          return { ...(req as any), mentor_profile: profile } as FavoriteMentor;
        })
        .filter((f): f is FavoriteMentor => !!f);
    },
  });
}

/**
 * Single-row check: is this professional in the current user's favorites?
 * Cheap query; cached by (user, target).
 */
export function useFavoriteStatus(
  userId: string | undefined,
  professionalUserId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: qk.favorites.status(userId, "professional", professionalUserId),
    enabled: (options.enabled ?? true) && !!userId && !!professionalUserId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId!)
        .eq("professional_id", professionalUserId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggle a business favorite. Optimistic — rollback on error.
 */
export function useToggleBusinessFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessId,
      currentlyFavorited,
    }: {
      businessId: string;
      currentlyFavorited: boolean;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      if (currentlyFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("business_id", businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, business_id: businessId });
        if (error) throw error;
      }
    },
    onMutate: async ({ businessId, currentlyFavorited }) => {
      const key = qk.favorites.businessIds(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      const next = currentlyFavorited
        ? previous.filter((id) => id !== businessId)
        : [...previous, businessId];
      queryClient.setQueryData<string[]>(key, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(qk.favorites.businessIds(userId), ctx.previous);
      }
    },
    onSettled: () => {
      // Refresh both the IDs list and the full Favorites page list.
      queryClient.invalidateQueries({ queryKey: qk.favorites.businessIds(userId) });
      queryClient.invalidateQueries({ queryKey: qk.favorites.businesses(userId) });
    },
  });
}

/**
 * Toggle a professional favorite. Optimistic on the single-row status query;
 * the Favorites page list is invalidated to refetch.
 */
export function useToggleProfessionalFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      professionalUserId,
      currentlyFavorited,
    }: {
      professionalUserId: string;
      currentlyFavorited: boolean;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      if (currentlyFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("professional_id", professionalUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, professional_id: professionalUserId });
        if (error) throw error;
      }
    },
    onMutate: async ({ professionalUserId, currentlyFavorited }) => {
      const key = qk.favorites.status(userId, "professional", professionalUserId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<boolean>(key);
      queryClient.setQueryData<boolean>(key, !currentlyFavorited);
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.key && ctx?.previous !== undefined) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.favorites.professionals(userId) });
    },
  });
}

/**
 * Remove a favorite professional row by primary key (used on Favorites page).
 */
export function useRemoveFavoriteProfessional(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.favorites.professionals(userId) });
      // Status caches for individual professionals will refetch on next mount.
      queryClient.invalidateQueries({
        queryKey: ["favorites", userId, "status", "professional"],
      });
    },
  });
}

export function useRemoveFavoriteBusiness(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("business_id", businessId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.favorites.businesses(userId) });
      queryClient.invalidateQueries({ queryKey: qk.favorites.businessIds(userId) });
    },
  });
}
