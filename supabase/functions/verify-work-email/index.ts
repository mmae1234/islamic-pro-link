// Sends a 6-digit code to a member's work email so they can earn a
// "Verified at <domain>" badge. Confirmation happens in the database
// (confirm_work_email RPC); only a hash of the code is stored.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Free/personal mail providers can't prove an employer.
const FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com", "outlook.com", "hotmail.com",
  "live.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me",
  "gmx.com", "gmx.net", "mail.com", "yandex.com", "yandex.ru", "zoho.com", "zohomail.com", "tutanota.com",
  "tuta.io", "hey.com", "fastmail.com", "att.net", "comcast.net", "verizon.net", "sbcglobal.net", "qq.com",
  "163.com", "126.com", "mail.ru", "web.de", "hotmail.co.uk", "yahoo.co.uk", "outlook.fr", "live.co.uk",
]);

const EMAIL_RE = /^[a-z0-9._%+-]{1,64}@([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/i;

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const url = Deno.env.get("SUPABASE_URL")!;
    const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user } } = await asCaller.auth.getUser(jwt);
    if (!user) return json({ error: "Please sign in" }, 401);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid work email address" }, 400);
    const domain = email.split("@")[1];
    if (FREE_DOMAINS.has(domain)) {
      return json({ error: "Use your work address (at your employer's domain), not a personal email" }, 400);
    }

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Must have a professional profile to show the badge on.
    const { data: pro } = await admin.from("professional_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!pro) return json({ error: "Add your professional profile first" }, 400);

    // Rate limit: 3 codes per hour per member.
    const { data: existing } = await admin.from("work_email_codes").select("*").eq("user_id", user.id).maybeSingle();
    const now = Date.now();
    let windowStart = now;
    let sends = 1;
    if (existing) {
      const started = new Date(existing.sends_window_start).getTime();
      if (now - started < 3600_000) {
        if (existing.sends_in_window >= 3) return json({ error: "Too many codes requested. Try again in an hour." }, 429);
        windowStart = started;
        sends = existing.sends_in_window + 1;
      }
    }

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const codeHash = await sha256Hex(`${code}:${user.id}`);
    const { error: upsertError } = await admin.from("work_email_codes").upsert({
      user_id: user.id,
      email,
      domain,
      code_hash: codeHash,
      expires_at: new Date(now + 15 * 60_000).toISOString(),
      attempts: 0,
      sends_window_start: new Date(windowStart).toISOString(),
      sends_in_window: sends,
    });
    if (upsertError) throw upsertError;

    const { error: sendError } = await resend.emails.send({
      from: "Muslim Pros Network <contact@muslimprosnet.com>",
      to: [email],
      subject: `Your verification code: ${code}`,
      html: `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f2;padding:32px 12px">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#346b47;color:#fff;padding:20px 28px;font-size:20px;font-weight:700">Muslim Pros Network</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 12px">Enter this code on Muslim Pros Network to verify you work at <strong>${domain}</strong>:</p>
<p style="font-size:32px;letter-spacing:6px;font-weight:700;margin:12px 0">${code}</p>
<p style="margin:0;color:#6b7280">It expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`,
    });
    if (sendError) throw new Error(typeof sendError === "string" ? sendError : JSON.stringify(sendError));
    return json({ success: true, domain });
  } catch (err) {
    console.error("verify-work-email error:", err);
    return json({ error: "Couldn't send the code. Please try again." }, 500);
  }
});
