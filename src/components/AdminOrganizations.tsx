import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Landmark, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { orgTypeLabel } from "@/lib/orgTypes";
import { formatEventWhen } from "@/components/EventCard";

const db = supabase as unknown as SupabaseClient;

type AdminOrg = {
  id: string;
  name: string | null;
  org_type: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  verified: boolean;
  created_at: string;
  owner_name: string | null;
};

type AdminEvent = {
  id: string;
  org_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  hidden: boolean;
  rsvp_url: string | null;
};

/** Admin: approve organizations (they're hidden until verified) and hide events. */
const AdminOrganizations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orgs = useQuery({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      const { data, error } = await db.rpc("admin_list_organizations");
      if (error) throw error;
      return (data ?? []) as AdminOrg[];
    },
  });

  const events = useQuery({
    queryKey: ["admin-org-events"],
    queryFn: async () => {
      const { data, error } = await db
        .from("org_events")
        .select("id, org_id, title, starts_at, ends_at, hidden, rsvp_url")
        .gte("starts_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("starts_at")
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AdminEvent[];
    },
  });

  const setVerified = async (o: AdminOrg, verified: boolean) => {
    const { error } = await db.rpc("admin_set_business_verified", { _business_id: o.id, _verified: verified });
    if (error) return toast({ title: "Couldn't update", description: getErrorMessage(error), variant: "destructive" });
    toast({ title: verified ? "Approved and listed" : "Approval removed", description: o.name ?? undefined });
    queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });
  };

  const setHidden = async (e: AdminEvent, hidden: boolean) => {
    const { error } = await db.rpc("admin_set_event_hidden", { _event_id: e.id, _hidden: hidden });
    if (error) return toast({ title: "Couldn't update", description: getErrorMessage(error), variant: "destructive" });
    toast({ title: hidden ? "Event hidden" : "Event visible again", description: e.title });
    queryClient.invalidateQueries({ queryKey: ["admin-org-events"] });
  };

  const list = orgs.data ?? [];
  const pending = list.filter((o) => !o.verified).length;
  const orgName = new Map(list.map((o) => [o.id, o.name ?? "Organization"]));

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Organizations
            {pending > 0 && <Badge variant="destructive">{pending} waiting</Badge>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Organizations stay hidden until you approve them. Check they're real first (state registry, or the IRS Tax
            Exempt Organization Search for charities and mosques).
          </p>
        </CardHeader>
        <CardContent>
          {orgs.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link to={`/business/${o.id}`} className="font-medium text-foreground hover:underline">
                      {o.name || "Unnamed organization"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[orgTypeLabel(o.org_type), [o.city, o.state, o.country].filter(Boolean).join(", "), o.website, o.email, o.owner_name && `by ${o.owner_name}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{o.verified ? "Approved" : "Waiting"}</span>
                    <Switch checked={o.verified} aria-label={`Approve ${o.name ?? "organization"}`} onCheckedChange={(v) => setVerified(o, v)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Events
          </CardTitle>
          <p className="text-sm text-muted-foreground">Turn an event off to hide it from everyone except its organization.</p>
        </CardHeader>
        <CardContent>
          {events.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (events.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      {[orgName.get(e.org_id), formatEventWhen(e.starts_at, e.ends_at), e.rsvp_url].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{e.hidden ? "Hidden" : "Visible"}</span>
                    <Switch checked={!e.hidden} aria-label={`Show ${e.title}`} onCheckedChange={(v) => setHidden(e, !v)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AdminOrganizations;
