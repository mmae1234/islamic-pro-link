import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Opt-out for the signed-out directory preview (profiles.public_preview,
 * read by the public_directory_preview RPC).
 */
const PublicPreviewSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("public_preview")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) setEnabled(data.public_preview !== false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChange = async (next: boolean) => {
    if (!user) return;
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ public_preview: next })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      setEnabled(previous);
      toast({
        title: "Couldn't save",
        description: "Your preview setting wasn't changed. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: next ? "Shown in the public preview" : "Hidden from the public preview",
      description: next
        ? "Visitors who aren't signed in may see your first name, last initial, job and city."
        : "Only signed-in members can find you in the directory.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Profile Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="public-preview" className="text-base">
              Show me in the public directory preview
            </Label>
            <p id="public-preview-help" className="text-sm text-muted-foreground">
              Visitors who aren't signed in see a short preview of members: first name, last
              initial, job, field and city. Never your photo, full name, profile page or contact
              details.
            </p>
          </div>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Switch
              id="public-preview"
              aria-describedby="public-preview-help"
              checked={enabled}
              disabled={saving}
              onCheckedChange={handleChange}
              className="shrink-0"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Your full profile is only visible to signed-in members. Contact details (email, phone,
          WhatsApp) are never shared automatically; they only appear if you add them to your
          profile.
        </p>
      </CardContent>
    </Card>
  );
};

export default PublicPreviewSettings;
