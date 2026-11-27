import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Briefcase, Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { OPPORTUNITY_KINDS, WORKPLACES, kindLabel } from "@/lib/opportunities";

const db = supabase as unknown as SupabaseClient;

type Row = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  workplace: string;
  city: string | null;
  state: string | null;
  country: string | null;
  pay: string | null;
  apply_url: string | null;
  closes_on: string | null;
  hidden: boolean;
  created_at: string;
};

type Draft = Omit<Row, "id" | "hidden" | "created_at"> & { id?: string };
const empty = (): Draft => ({
  kind: "job", title: "", description: "", workplace: "onsite", city: "", state: "", country: "", pay: "", apply_url: "", closes_on: "",
});

/** Business/organization dashboard: post and manage jobs and volunteer roles. */
const OpportunitiesManager = ({ businessId, canPost }: { businessId: string; canPost: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["opps-manage", businessId],
    queryFn: async () => {
      const { data, error } = await db.from("opportunities").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["opps-manage", businessId] });
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const save = async () => {
    if (!draft) return;
    if (draft.title.trim().length < 3) return toast({ title: "Add a title", variant: "destructive" });
    const apply = (draft.apply_url ?? "").trim();
    if (apply && !SAFE_HTTPS_URL.test(apply)) {
      return toast({ title: "That link isn't allowed", description: "Use a full secure link that starts with https://", variant: "destructive" });
    }
    const row = {
      kind: draft.kind,
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      workplace: draft.workplace,
      city: draft.city?.trim() || null,
      state: draft.state?.trim() || null,
      country: draft.country?.trim() || null,
      pay: draft.pay?.trim() || null,
      apply_url: apply || null,
      closes_on: draft.closes_on || null,
    };
    setSaving(true);
    const { error } = draft.id
      ? await db.from("opportunities").update(row).eq("id", draft.id)
      : await db.from("opportunities").insert({ ...row, business_id: businessId });
    setSaving(false);
    if (error) return toast({ title: "Couldn't save", description: getErrorMessage(error), variant: "destructive" });
    toast({ title: draft.id ? "Post updated" : "Posted" });
    setDraft(null);
    refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await db.from("opportunities").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) return toast({ title: "Couldn't delete", description: getErrorMessage(error), variant: "destructive" });
    toast({ title: "Post deleted" });
    refresh();
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" /> Jobs &amp; opportunities
        </CardTitle>
        <Button size="sm" variant="accent" disabled={!canPost} onClick={() => setDraft(empty())}>
          <Plus className="w-4 h-4 mr-2" /> Post an opportunity
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canPost && <p className="text-sm text-muted-foreground">You can post once your organization is approved.</p>}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          canPost && <p className="text-sm text-muted-foreground">Nothing posted yet. Posts appear on the Jobs page and on your profile.</p>
        ) : (
          rows.map((r) => {
            const closed = !!r.closes_on && r.closes_on < today;
            return (
              <div key={r.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 ${closed ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary">{kindLabel(r.kind)}</Badge>
                    {closed && <Badge variant="outline">Closed</Badge>}
                    {r.hidden && <Badge variant="destructive" className="gap-1"><EyeOff className="w-3 h-3" /> Hidden by the site admin</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" aria-label={`Edit ${r.title}`} onClick={() => setDraft({ ...r, description: r.description ?? "", city: r.city ?? "", state: r.state ?? "", country: r.country ?? "", pay: r.pay ?? "", apply_url: r.apply_url ?? "", closes_on: r.closes_on ?? "" })}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" aria-label={`Delete ${r.title}`} onClick={() => setToDelete(r)}>
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
            <DialogTitle>{draft?.id ? "Edit post" : "Post an opportunity"}</DialogTitle>
            <DialogDescription>Anyone can see the post. The apply link is shown only to signed-in members.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="op-kind">Type</Label>
                  <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
                    <SelectTrigger id="op-kind"><SelectValue /></SelectTrigger>
                    <SelectContent>{OPPORTUNITY_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="op-wp">Where</Label>
                  <Select value={draft.workplace} onValueChange={(v) => setDraft({ ...draft, workplace: v })}>
                    <SelectTrigger id="op-wp"><SelectValue /></SelectTrigger>
                    <SelectContent>{WORKPLACES.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="op-title">Title</Label>
                <Input id="op-title" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Paralegal, Youth program volunteer" />
              </div>
              {draft.workplace !== "remote" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="op-city">City</Label>
                    <Input id="op-city" maxLength={100} value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="op-state">State / region</Label>
                    <Input id="op-state" maxLength={100} value={draft.state ?? ""} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="op-pay">Pay (optional)</Label>
                  <Input id="op-pay" maxLength={120} value={draft.pay ?? ""} onChange={(e) => setDraft({ ...draft, pay: e.target.value })} placeholder="e.g. $25–30/hr" />
                </div>
                <div>
                  <Label htmlFor="op-close">Closes on (optional)</Label>
                  <Input id="op-close" type="date" min={today} value={draft.closes_on ?? ""} onChange={(e) => setDraft({ ...draft, closes_on: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="op-desc">Description</Label>
                <Textarea id="op-desc" rows={6} maxLength={6000} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="op-apply">Apply link (optional, members only)</Label>
                <Input id="op-apply" type="url" inputMode="url" maxLength={500} value={draft.apply_url ?? ""} onChange={(e) => setDraft({ ...draft, apply_url: e.target.value })} placeholder="https://…" />
                <p className="text-xs text-muted-foreground mt-1">Secure links only (https://). Without a link, members contact you through your page.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="accent" onClick={save} disabled={saving}>{saving ? "Saving…" : draft?.id ? "Save changes" : "Post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
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

export default OpportunitiesManager;
