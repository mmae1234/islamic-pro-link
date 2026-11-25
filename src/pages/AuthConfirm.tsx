import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Landing page for links in our auth emails:
 *   /auth/confirm?token_hash=...&type=recovery|signup|email|email_change|magiclink|invite&next=/path
 *
 * Unlike Supabase's default {{ .ConfirmationURL }} (which spends the one-time
 * token on the first GET), this page only verifies the token when its
 * JavaScript runs in a real browser. Email security scanners (Outlook Safe
 * Links etc.) that pre-open links therefore can't use the link up, and the
 * link works in any browser, not only the one that asked for it.
 */
const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

// Only same-site paths; never redirect off the site.
function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}

const AuthConfirm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  const type = params.get("type") as EmailOtpType | null;
  const isRecovery = type === "recovery";

  useEffect(() => {
    if (ran.current) return; // React StrictMode would otherwise verify twice
    ran.current = true;

    const tokenHash = params.get("token_hash");
    if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
      setError("This link is incomplete. Please use the button in the most recent email we sent you.");
      return;
    }

    (async () => {
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (verifyError) {
        // A link that was already used still leaves the person signed in in
        // the browser that used it; let them continue if so.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError("This link has expired or was already used. Links work once and expire after 1 hour.");
          return;
        }
      }
      const next = safeNext(params.get("next"), isRecovery ? "/reset-password" : "/dashboard");
      navigate(isRecovery ? "/reset-password" : next, { replace: true });
    })();
  }, [params, type, isRecovery, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardContent className="p-8 text-center space-y-4">
          {error ? (
            <>
              <h1 className="text-xl font-semibold text-foreground">That link didn't work</h1>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex flex-col gap-2 pt-2">
                {isRecovery ? (
                  <Button asChild variant="hero">
                    <Link to="/forgot-password">Send me a new reset link</Link>
                  </Button>
                ) : (
                  <Button asChild variant="hero">
                    <Link to="/login">Go to sign in</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/">Back to the homepage</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" aria-hidden="true" />
              <p className="text-muted-foreground" role="status">
                {isRecovery ? "Checking your reset link…" : "Confirming…"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthConfirm;
