import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// Email alerts for members.
// Called only by database triggers (public.queue_email_alert) through pg_net.
// Auth: shared secret in x-digest-secret (same Vault secret as signup-digest).
// Body: { kind: "message" | "mentorship_request" | "mentorship_accepted" | "session_scheduled",
//         recipient_id: uuid, actor_id: uuid }
// Privacy: never includes message content, only who acted and a link.

const SITE = "https://muslimprosnet.com";
const FROM = "Muslim Pros Network <contact@muslimprosnet.com>";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Kind = "message" | "message_request" | "mentorship_request" | "mentorship_accepted" | "session_scheduled";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function displayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  const first = (data?.first_name ?? "").trim();
  const lastInitial = (data?.last_name ?? "").trim().charAt(0);
  // Business accounts usually have no personal name: use the business name.
  if (!first) return ((data as { display_name?: string | null } | null)?.display_name ?? "").trim() || "A member";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function content(kind: Kind, actor: string) {
  switch (kind) {
    case "message":
      return {
        subject: `${actor} sent you a message on Muslim Pros Network`,
        line: `${actor} sent you a message.`,
        cta: "Read and reply",
        path: "/messages",
      };
    case "message_request":
      return {
        subject: `${actor} wants to connect with you on Muslim Pros Network`,
        line: `${actor} sent you a message request. Accept it to reply, or decline if you don't want to hear from them.`,
        cta: "See the request",
        path: "/messages?tab=requests",
      };
    case "mentorship_request":
      return {
        subject: `${actor} asked you to be their mentor`,
        line: `${actor} sent you a mentorship request.`,
        cta: "View the request",
        path: "/mentorship",
      };
    case "session_scheduled":
      return {
        subject: `${actor} scheduled a mentorship session with you`,
        line: `${actor} scheduled a mentorship session with you. See the date, time and meeting link on the Mentorship page.`,
        cta: "See the session",
        path: "/mentorship",
      };
    case "mentorship_accepted":
      return {
        subject: `${actor} accepted your mentorship request`,
        line: `Good news: ${actor} accepted your mentorship request. You can now message each other.`,
        cta: "Start the conversation",
        path: "/mentorship",
      };
  }
}

function buildHtml(firstName: string, line: string, cta: string, url: string) {
  const hello = firstName ? `Assalamu alaikum ${escapeHtml(firstName)},` : "Assalamu alaikum,";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f6b3f;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold;">Muslim Pros Network</td></tr>
        <tr><td style="padding:24px;font-size:16px;line-height:1.5;">
          <p style="margin:0 0 12px;">${hello}</p>
          <p style="margin:0 0 20px;">${escapeHtml(line)}</p>
          <a href="${url}" style="display:inline-block;background:#0f6b3f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;">${escapeHtml(cta)}</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e7e5e4;font-size:12px;line-height:1.5;color:#78716c;">
          You're getting this because email alerts are on for your account.
          <a href="${SITE}/settings?tab=notifications" style="color:#78716c;">Turn them off in Settings</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  try {
    const expected = Deno.env.get("DIGEST_SECRET");
    const provided = req.headers.get("x-digest-secret") ?? "";
    if (!expected || provided !== expected) {
      return json(403, { success: false, error: "Forbidden" });
    }
    if (req.method !== "POST") {
      return json(405, { success: false, error: "Method not allowed" });
    }

    const body = await req.json().catch(() => null);
    const kind = body?.kind as Kind;
    const recipientId = String(body?.recipient_id ?? "");
    const actorId = String(body?.actor_id ?? "");

    if (!["message", "message_request", "mentorship_request", "mentorship_accepted", "session_scheduled"].includes(kind)) {
      return json(400, { success: false, error: "Invalid kind" });
    }
    if (!UUID_RE.test(recipientId) || !UUID_RE.test(actorId) || recipientId === actorId) {
      return json(400, { success: false, error: "Invalid ids" });
    }

    // Respect the recipient's switch (re-checked here in case it changed).
    const { data: prefs } = await supabase
      .from("profiles")
      .select("first_name, email_alerts")
      .eq("user_id", recipientId)
      .maybeSingle();
    if (!prefs || prefs.email_alerts === false) {
      return json(200, { success: true, skipped: "alerts off or no profile" });
    }

    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(recipientId);
    const email = userData?.user?.email;
    if (userErr || !email || !userData?.user?.email_confirmed_at) {
      return json(200, { success: true, skipped: "no confirmed email" });
    }

    const actor = await displayName(actorId);
    const c = content(kind, actor);
    const html = buildHtml((prefs.first_name ?? "").trim(), c.line, c.cta, `${SITE}${c.path}`);
    const text = `${c.line}\n\n${c.cta}: ${SITE}${c.path}\n\nTurn off email alerts in Settings: ${SITE}/settings?tab=notifications`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: c.subject,
      html,
      text,
    });
    if (error) {
      console.error("notify-user: Resend error", { kind, error });
      return json(502, { success: false, error: "Email provider error" });
    }

    console.log("notify-user: sent", { kind, id: data?.id });
    return json(200, { success: true, id: data?.id });
  } catch (err) {
    console.error("notify-user: unexpected error", err);
    return json(500, { success: false, error: "Internal error" });
  }
});
