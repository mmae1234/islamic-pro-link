/**
 * Centralized React Query key factory.
 *
 * Convention: hierarchical arrays so partial invalidation is cheap, e.g.
 *   queryClient.invalidateQueries({ queryKey: qk.messages.all(userId) })
 * invalidates every messages-related cache for that user.
 *
 * All keys are tied to the current user where relevant — Supabase RLS
 * scopes data per-user, so caches must too.
 */

export type ProfessionalFilters = {
  country?: string;
  stateProvince?: string;
  city?: string;
  sector?: string;
  occupation?: string;
  isMentor?: boolean;
  isSeekingMentor?: boolean;
  searchTerm?: string;
  experienceMin?: string;
  experienceMax?: string;
};

export type BusinessFilters = {
  searchTerm?: string;
  country?: string;
  state?: string;
  city?: string;
  sector?: string;
  verifiedOnly?: boolean;
};

export const qk = {
  // Professional directory
  professionals: {
    all: ["professionals"] as const,
    list: (filters: ProfessionalFilters) =>
      ["professionals", "list", filters] as const,
    composePicker: (userId: string | undefined) =>
      ["professionals", "compose-picker", userId] as const,
  },

  // Business directory
  businesses: {
    all: ["businesses"] as const,
    list: (userId: string | undefined, filters: BusinessFilters) =>
      ["businesses", "list", userId, filters] as const,
    detail: (id: string) => ["businesses", "detail", id] as const,
    sectors: ["businesses", "sectors"] as const,
  },

  // Profiles
  profile: {
    all: ["profile"] as const,
    detail: (userId: string | undefined) => ["profile", "detail", userId] as const,
    professional: (userId: string | undefined) =>
      ["profile", "professional", userId] as const,
  },

  // Favorites
  favorites: {
    all: (userId: string | undefined) => ["favorites", userId] as const,
    professionals: (userId: string | undefined) =>
      ["favorites", userId, "professionals"] as const,
    businesses: (userId: string | undefined) =>
      ["favorites", userId, "businesses"] as const,
    businessIds: (userId: string | undefined) =>
      ["favorites", userId, "business-ids"] as const,
    mentorRequests: (userId: string | undefined) =>
      ["favorites", userId, "mentor-requests"] as const,
    status: (
      userId: string | undefined,
      kind: "professional" | "business",
      targetId: string | undefined,
    ) => ["favorites", userId, "status", kind, targetId] as const,
  },

  // Messages / conversations
  messages: {
    all: (userId: string | undefined) => ["messages", userId] as const,
    conversations: (userId: string | undefined) =>
      ["messages", userId, "conversations"] as const,
    inbox: (userId: string | undefined) => ["messages", userId, "inbox"] as const,
    sent: (userId: string | undefined) => ["messages", userId, "sent"] as const,
    archived: (userId: string | undefined) =>
      ["messages", userId, "archived"] as const,
  },

  // Mentorship
  mentorship: {
    all: (userId: string | undefined) => ["mentorship", userId] as const,
    mentors: (userId: string | undefined) =>
      ["mentorship", userId, "mentors"] as const,
    requests: (userId: string | undefined) =>
      ["mentorship", userId, "requests"] as const,
  },
};
