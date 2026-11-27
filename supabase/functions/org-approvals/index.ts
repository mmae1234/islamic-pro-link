import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// Emails the site admin about organizations waiting for approval.
//   { mode: "new", org_id }  — sent right after an organization signs up
//   { mode: "reminder" }      — pg_cron every 3 days; sends nothing if none wait
// Auth: x-digest-secret header (same Vault secret as the other digests).

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RECIPIENT = "contact@muslimprosnet.com";
const SITE = "https://muslimprosnet.com";
const TYPE_LABEL: Record<string, string> = {
  mosque: "Mosque / Islamic center",
  student_association: "Student association",
  professional_association: "Professional association",
  nonprofit: "Nonprofit / charity",
  school: "School",
  other: "Other",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type Org = {
  id: string;
  name: string | null;
  org_type: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  email: string | null;
  created_at: string;
};

serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const expected = Deno.env.get("DIGEST_SECRET");
  if (!expected || (req.headers.get("x-digest-secret") ?? "") !== expected) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "new" ? "new" : "reminder";

    const { data, error } = await supabase
      .from("business_accounts")
      .select("id, name, org_type, city, state, country, website, email, created_at")
      .eq("kind", "organization")
      .eq("verified", false)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const pending = (data ?? []) as Org[];
    if (pending.length === 0) return json({ success: true, skipped: "none pending" });

    const newOrg = mode === "new" ? pending.find((o) => o.id === body?.org_id) : undefined;
    if (mode === "new" && !newOrg) return json({ success: true, skipped: "already handled" });

    const rows = pending
      .map((o) => {
        const place = [o.city, o.state, o.country].filter(Boolean).join(", ");
        const bits = [TYPE_LABEL[o.org_type ?? ""] ?? "Organization", place].filter(Boolean).join(" · ");
        const site = o.website ? `<br><span style="color:#6b7280">${esc(o.website)}</span>` : "";
        const days = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000);
        const waiting = days <= 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`;
        return `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb">
          <strong>${esc(o.name || "Unnamed organization")}</strong><br>
          <span style="color:#6b7280">${esc(bits)} · signed up ${waiting}</span>${site}
        </td></tr>`;
      })
      .join("");

    const subject =
      mode === "new"
        ? `New organization to approve: ${newOrg?.name || "Unnamed"}`
        : `${pending.length} organization${pending.length === 1 ? "" : "s"} waiting for approval`;

    const html = `<!doctype html><html><body style="margin:0;background:#f4f4f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#346b47;color:#fff;padding:20px 28px;font-size:20px;font-weight:700">Muslim Pros Network</td></tr>
<tr><td style="padding:24px 28px;color:#111;font-size:15px;line-height:1.5">
<p style="margin:0 0 12px">${mode === "new" ? "A new organization signed up and is waiting for you." : "These organizations are waiting for approval."}
They aren't listed and can't post events until you verify them.</p>
<p style="margin:0 0 16px;color:#374151">Check they're real (state registry or IRS Tax Exempt Organization Search), then switch on <strong>Verified</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:24px 0 0"><a href="${SITE}/admin/reports" style="background:#346b47;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">Review in Admin</a></p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">You get this as the site admin. Reminders come every 3 days while anything is waiting.</td></tr>
</table></td></tr></table></body></html>`;

    const { data: sent, error: sendError } = await resend.emails.send({
      from: "Muslim Pros Network <contact@muslimprosnet.com>",
      to: [RECIPIENT],
      subject,
      html,
    });
    if (sendError) throw new Error(typeof sendError === "string" ? sendError : JSON.stringify(sendError));
    return json({ success: true, pending: pending.length, id: sent?.id });
  } catch (err) {
    console.error("org-approvals error:", err);
    return json({ success: false, error: (err as Error).message }, 500);
  }
});
