import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CalendarPlus, CalendarDays, Pencil, Trash2, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { SAFE_HTTPS_URL } from "@/lib/orgTypes";
import { formatEventWhen, type EventMode } from "@/components/EventCard";

// org_events isn't in the generated types yet.
const db = supabase as unknown as SupabaseClient;

export type OrgEventRow = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  mode: EventMode;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  rsvp_url: string | null;
  hidden: boolean;
};

type Draft = {
  id?: string;
  title: string;
  date: string;
  start: string;
  end: string;
  mode: EventMode;
  venue_name: string;
  address: string;
  city: string;
  state: string;
  description: string;
  rsvp_url: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  date: "",
  start: "18:00",
  end: "",
  mode: "in_person",
  venue_name: "",
  address: "",
  city: "",
  state: "",
  description: "",
  rsvp_url: "",
});

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalParts = (iso: string) => {
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

/** Organization dashboard: create, edit and delete events. */
const OrgEventsManager = ({ orgId, approved }: { orgId: string; approved: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<OrgEventRow | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["org-events-manage", orgId],
    queryFn: async () => {
      const { data, error } = await db
        .from("org_events")
        .select("*")
        .eq("org_id", orgId)
        .order("starts_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as OrgEventRow[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["org-events-manage", orgId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const openEdit = (e: OrgEventRow) => {
    const s = toLocalParts(e.starts_at);
    setDraft({
      id: e.id,
      title: e.title,
      date: s.date,
      start: s.time,
      end: e.ends_at ? toLocalParts(e.ends_at).time : "",
      mode: e.mode,
      venue_name: e.venue_name ?? "",
      address: e.address ?? "",
      city: e.city ?? "",
      state: e.state ?? "",
      description: e.description ?? "",
      rsvp_url: e.rsvp_url ?? "",
    });
  };

  const save = async () => {
    if (!draft) return;
    const title = draft.title.trim();
    if (title.length < 3) return toast({ title: "Add a title", variant: "destructive" });
    if (!draft.date || !draft.start) return toast({ title: "Add a date and start time", variant: "destructive" });
    const startsAt = new Date(`${draft.date}T${draft.start}`);
    if (Number.isNaN(startsAt.getTime())) return toast({ title: "Check the date and time", variant: "destructive" });
    let endsAt: Date | null = null;
    if (draft.end) {
      endsAt = new Date(`${draft.date}T${draft.end}`);
      if (endsAt < startsAt) endsAt = new Date(endsAt.getTime() + 24 * 3600 * 1000); // ends after midnight
    }
    const rsvp = draft.rsvp_url.trim();
    if (rsvp && !SAFE_HTTPS_URL.test(rsvp)) {
      return toast({
        title: "That RSVP link isn't allowed",
        description: "Use a full secure link that starts with https://, e.g. https://www.eventbrite.com/e/…",
        variant: "destructive",
      });
    }
    const row = {
      title,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
      mode: draft.mode,
      venue_name: draft.venue_name.trim() || null,
      address: draft.mode === "online" ? null : draft.address.trim() || null,
      city: draft.city.trim() || null,
      state: draft.state.trim() || null,
      description: draft.description.trim() || null,
      rsvp_url: rsvp || null,
    };
    setSaving(true);
    const { error } = draft.id
      ? await db.from("org_events").update(row).eq("id", draft.id)
      : await db.from("org_events").insert({ ...row, org_id: orgId });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save the event", description: getErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: draft.id ? "Event updated" : "Event posted" });
    setDraft(null);
    refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await db.from("org_events").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast({ title: "Couldn't delete the event", description: getErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: "Event deleted" });
    refresh();
  };

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() < now);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Events
        </CardTitle>
        <Button onClick={() => setDraft(emptyDraft())} disabled={!approved} variant="accent" size="sm">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Post an event
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!approved && (
          <p className="text-sm text-muted-foreground">You can post events once your organization is approved.</p>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading events…</p>
        ) : events.length === 0 ? (
          approved && <p className="text-sm text-muted-foreground">No events yet. Members see your upcoming events on your page and on the Organizations page.</p>
        ) : (
          [...upcoming.reverse(), ...past].map((e) => {
            const isPast = past.includes(e);
            return (
              <div key={e.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 ${isPast ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{formatEventWhen(e.starts_at, e.ends_at)}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {isPast && <Badge variant="secondary">Past</Badge>}
                    {e.hidden && (
                      <Badge variant="destructive" className="gap-1">
                        <EyeOff className="w-3 h-3" /> Hidden by the site admin
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(e)} aria-label={`Edit ${e.title}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(e)} aria-label={`Delete ${e.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit event" : "Post an event"}</DialogTitle>
            <DialogDescription>Anyone can see the event. The street address and RSVP link are shown only to signed-in members.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ev-title">Title</Label>
                <Input id="ev-title" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Career night for students" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="ev-date">Date</Label>
                  <Input id="ev-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ev-start">Starts</Label>
                  <Input id="ev-start" type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ev-end">Ends (optional)</Label>
                  <Input id="ev-end" type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="ev-mode">Where</Label>
                <Select value={draft.mode} onValueChange={(v) => setDraft({ ...draft, mode: v as EventMode })}>
                  <SelectTrigger id="ev-mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">In person and online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.mode !== "online" && (
                <>
                  <div>
                    <Label htmlFor="ev-venue">Venue name (optional)</Label>
                    <Input id="ev-venue" maxLength={200} value={draft.venue_name} onChange={(e) => setDraft({ ...draft, venue_name: e.target.value })} placeholder="e.g. Main prayer hall" />
                  </div>
                  <div>
                    <Label htmlFor="ev-address">Street address (members only)</Label>
                    <Input id="ev-address" maxLength={300} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="ev-city">City</Label>
                      <Input id="ev-city" maxLength={100} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="ev-state">State / region</Label>
                      <Input id="ev-state" maxLength={100} value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="ev-desc">Description</Label>
                <Textarea id="ev-desc" rows={4} maxLength={4000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="ev-rsvp">RSVP / registration link (optional, members only)</Label>
                <Input id="ev-rsvp" type="url" inputMode="url" maxLength={500} value={draft.rsvp_url} onChange={(e) => setDraft({ ...draft, rsvp_url: e.target.value })} placeholder="https://…" />
                <p className="text-xs text-muted-foreground mt-1">Secure links only (https://), e.g. Eventbrite, Google Forms, or your website.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} variant="accent">{saving ? "Saving…" : draft?.id ? "Save changes" : "Post event"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" will be removed for everyone. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrgEventsManager;
