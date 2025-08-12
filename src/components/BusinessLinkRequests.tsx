import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface PendingLink {
  id: string;
  professional_user_id: string;
  created_at: string;
  role_title: string | null;
}

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface BusinessLinkRequestsProps {
  businessId: string;
}

const BusinessLinkRequests = ({ businessId }: BusinessLinkRequestsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PendingLink[]>([]);
  const [approved, setApproved] = useState<PendingLink[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [requests]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pendingRes, approvedRes] = await Promise.all([
          supabase
            .from("professional_business_links")
            .select("id, professional_user_id, created_at, role_title")
            .eq("business_id", businessId)
            .eq("status", "pending"),
          supabase
            .from("professional_business_links")
            .select("id, professional_user_id, created_at, role_title")
            .eq("business_id", businessId)
            .eq("status", "approved"),
        ]);

        const pending = (pendingRes as any)?.data || [];
        const approvedData = (approvedRes as any)?.data || [];
        setRequests(pending);
        setApproved(approvedData);

        const ids: string[] = Array.from(
          new Set([...pending, ...approvedData].map((l: any) => String(l.professional_user_id)))
        );
        if (ids.length > 0) {
          const { data: profs, error: pErr } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, avatar_url")
            .in("user_id", ids as any);
          if (pErr) throw pErr;
          const map: Record<string, Profile> = {};
          (profs as any)?.forEach((p: Profile) => (map[p.user_id] = p));
          setProfiles(map);
        } else {
          setProfiles({});
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      setActioningId(id);
      const { error } = await supabase
        .from("professional_business_links")
        .update({ status: action })
        .eq("id", id);
      if (error) throw error;
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast({ title: `Request ${action}`, description: `The link request was ${action}.` });
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message || "You may not have permission.", variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleDelink = async (id: string) => {
    try {
      setActioningId(id);
      const { error } = await supabase
        .from("professional_business_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setApproved((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Delinked", description: "The professional was removed from your business." });
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message || "You may not have permission.", variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <>
      <section aria-labelledby="link-requests-heading">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle id="link-requests-heading">Link Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading requests…</p>
            ) : sorted.length === 0 ? (
              <p className="text-muted-foreground">No pending requests.</p>
            ) : (
              <ul className="space-y-3">
                {sorted.map((req) => {
                  const p = profiles[req.professional_user_id];
                  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Professional";
                  return (
                    <li key={req.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p?.avatar_url || undefined} alt={`${name} avatar`} />
                          <AvatarFallback>
                            {`${(p?.first_name?.[0] || "?")}${(p?.last_name?.[0] || "")}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">Requested {new Date(req.created_at).toLocaleString()}</p>
                          {req.role_title && (
                            <p className="text-xs text-muted-foreground">Role: {req.role_title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => handleAction(req.id, "approved")}
                          disabled={actioningId === req.id}
                          aria-label="Approve request"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(req.id, "rejected")}
                          disabled={actioningId === req.id}
                          aria-label="Reject request"
                        >
                          Reject
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="linked-pros-heading" className="mt-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle id="linked-pros-heading">Linked Professionals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading linked professionals…</p>
            ) : approved.length === 0 ? (
              <p className="text-muted-foreground">No linked professionals.</p>
            ) : (
              <ul className="space-y-3">
                {approved.map((link) => {
                  const p = profiles[link.professional_user_id];
                  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Professional";
                  return (
                    <li key={link.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p?.avatar_url || undefined} alt={`${name} avatar`} />
                          <AvatarFallback>
                            {`${(p?.first_name?.[0] || "?")}${(p?.last_name?.[0] || "")}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          {link.role_title && <p className="text-xs text-muted-foreground">Role: {link.role_title}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelink(link.id)}
                          disabled={actioningId === link.id}
                          aria-label="Delink professional"
                        >
                          Delink
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
};

export default BusinessLinkRequests;
