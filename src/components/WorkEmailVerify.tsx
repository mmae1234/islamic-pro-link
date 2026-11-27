import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

const db = supabase as unknown as SupabaseClient;

/** Edit Profile: prove you work somewhere by confirming a code sent to your work email. */
const WorkEmailVerify = ({ verifiedDomain, onChange }: { verifiedDomain: string | null; onChange: (d: string | null) => void }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-work-email", { body: { email } });
    setBusy(false);
    // functions.invoke puts non-2xx bodies in error.context
    let msg: string | null = (data as { error?: string } | null)?.error ?? null;
    if (error) {
      try {
        msg = (await (error as { context?: Response }).context?.json())?.error ?? getErrorMessage(error);
      } catch {
        msg = getErrorMessage(error);
      }
    }
    if (msg) return toast({ title: "Couldn't send the code", description: msg, variant: "destructive" });
    setSentTo(email.trim().toLowerCase());
    setCode("");
    toast({ title: "Code sent", description: `Check ${email.trim()} for a 6-digit code.` });
  };

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await db.rpc("confirm_work_email", { _code: code });
    setBusy(false);
    if (error) return toast({ title: "Couldn't verify", description: getErrorMessage(error), variant: "destructive" });
    if (!data) return toast({ title: "That code isn't right", description: "Check the email and try again.", variant: "destructive" });
    toast({ title: "Verified", description: `Your profile now shows "Verified at ${data}".` });
    setSentTo(null);
    setEmail("");
    onChange(data as string);
  };

  const remove = async () => {
    const { error } = await db.rpc("remove_work_verification");
    if (error) return toast({ title: "Couldn't remove", description: getErrorMessage(error), variant: "destructive" });
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Verify where you work</h3>
      {verifiedDomain ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <BadgeCheck className="w-4 h-4" /> Verified at {verifiedDomain}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={remove}>Remove</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>Changed jobs? Verify a new one</Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            We email a code to your work address. Your profile shows only the company domain (for example "Verified at
            acme.com"), never the address.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="work-email" className="sr-only">Work email</Label>
              <Input id="work-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="button" variant="outline" disabled={busy || !email.includes("@")} onClick={send}>
              {sentTo ? "Resend code" : "Send code"}
            </Button>
          </div>
          {sentTo && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="work-code" className="sr-only">6-digit code</Label>
                <Input id="work-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </div>
              <Button type="button" variant="accent" disabled={busy || code.length !== 6} onClick={confirm}>Verify</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkEmailVerify;
