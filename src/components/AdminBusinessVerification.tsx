import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

/**
 * Admin-only: mark businesses Verified. Uses admin_set_business_verified,
 * which re-checks is_admin on the server.
 */
const AdminBusinessVerification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_business_directory", { result_limit: 500 });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setVerified = async (id: string, name: string, verified: boolean) => {
    const { error } = await supabase.rpc(
      "admin_set_business_verified" as never,
      { _business_id: id, _verified: verified } as never,
    );
    if (error) {
      toast({ title: "Couldn't update", description: getErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: verified ? "Marked verified" : "Verification removed", description: name });
    queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" />
          Business verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Only turn this on after you've confirmed the business is real (for example, a state business
          registry lookup). Members see a Verified badge.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading businesses…</p>
        ) : businesses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No businesses yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {businesses.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link to={`/business/${b.id}`} className="font-medium text-foreground hover:underline">
                    {b.name || "Unnamed business"}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {[b.sector, b.city, b.country].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{b.verified ? "Verified" : "Not verified"}</span>
                  <Switch
                    checked={!!b.verified}
                    aria-label={`Verified: ${b.name || "business"}`}
                    onCheckedChange={(v) => setVerified(b.id, b.name || "Business", v)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBusinessVerification;
