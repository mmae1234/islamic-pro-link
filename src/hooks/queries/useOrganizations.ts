import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PublicEvent } from "@/components/EventCard";

// list_organizations / list_events aren't in the generated types yet.
const db = supabase as unknown as SupabaseClient;

export type OrganizationListRow = {
  id: string;
  name: string | null;
  org_type: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  logo_url: string | null;
  upcoming_events: number;
};

export function useOrganizations(filters: { search?: string; orgType?: string }) {
  return useQuery({
    queryKey: ["organizations", filters],
    queryFn: async (): Promise<OrganizationListRow[]> => {
      const { data, error } = await db.rpc("list_organizations", {
        _search: filters.search?.trim() || null,
        _org_type: filters.orgType && filters.orgType !== "all" ? filters.orgType : null,
        _limit: 120,
      });
      if (error) throw error;
      return (data ?? []) as OrganizationListRow[];
    },
  });
}

/** Upcoming events (all organizations, or one). Address/RSVP link are null for visitors. */
export function useEvents(orgId?: string, signedIn = false) {
  return useQuery({
    queryKey: ["events", orgId ?? "all", signedIn],
    queryFn: async (): Promise<PublicEvent[]> => {
      const { data, error } = await db.rpc("list_events", { _org_id: orgId ?? null, _limit: 100 });
      if (error) throw error;
      return (data ?? []) as PublicEvent[];
    },
  });
}
