import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * On/off switch for email alerts (new messages, mentorship requests,
 * accepted mentorship). Stored in profiles.email_alerts and read by the
 * notify-user edge function before every email.
 */
const EmailAlertSettings = () => {
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
        .select("email_alerts")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) setEnabled(data.email_alerts !== false);
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
      .update({ email_alerts: next })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      setEnabled(previous);
      toast({
        title: "Couldn't save",
        description: "Your email alert setting wasn't changed. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: next ? "Email alerts on" : "Email alerts off",
      description: next
        ? "We'll email you when someone messages you or sends a mentorship request."
        : "You won't get alert emails. You'll still see everything when you log in.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Email Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="email-alerts" className="text-base">
              Email me about new activity
            </Label>
            <p id="email-alerts-help" className="text-sm text-muted-foreground">
              One email when someone messages you (not one per message), when you get a
              mentorship request, and when your request is accepted. Emails never include
              the message itself.
            </p>
          </div>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Switch
              id="email-alerts"
              aria-describedby="email-alerts-help"
              checked={enabled}
              disabled={saving}
              onCheckedChange={handleChange}
              className="shrink-0"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailAlertSettings;
