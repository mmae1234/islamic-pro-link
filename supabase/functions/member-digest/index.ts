import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// Weekly "new members" email for members.
// Triggered by pg_cron (job 'member-digest-weekly') through pg_net with the
// shared x-digest-secret (same Vault secret as signup-digest / notify-user).
//
// For each member with a confirmed email and profiles.weekly_digest = true:
//   * list professionals who created a professional profile in the last 7
//     days (not themselves, nobody either side has blocked), same field first;
//   * send ONE email only if there is at least one new member (no empty
//     "nothing happened" emails);
//   * show first name + last initial, job and city only.
//
// Body (all optional, for testing):
//   { "dry_run": true }            -> no emails, returns who would get what
//   { "only_user_id": "<uuid>" }   -> send/preview for one member only
//   { "days": 7 }                  -> look-back window (1-31)

const SITE = "https://muslimprosnet.com";
const FROM = "Muslim Pros Network <contact@muslimprosnet.com>";
const MAX_SHOWN = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type NewMember = {
  user_id: string;
  first_name: string;
  last_initial: string;
  occupation: string | null;
  sector: string | null;
  city: string | null;
  country: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function memberLine(m: NewMember) {
  const name = m.last_initial ? `${m.first_name} ${m.last_initial}.` : m.first_name;
  const place = [m.city, m.country].filter(Boolean).join(", ");
  return { name, detail: [m.occupation, place].filter(Boolean).join(" · ") };
}

function buildEmail(firstName: string, shown: NewMember[], total: number, sameField: number, sector: string | null) {
  const hello = firstName ? `Assalamu alaikum ${escapeHtml(firstName)},` : "Assalamu alaikum,";
  const intro = total === 1
    ? "1 new professional joined Muslim Pros Network this week."
    : `${total} new professionals joined Muslim Pros Network this week.`;
  const fieldNote = sector && sameField > 0
    ? ` ${sameField === 1 ? "One works" : `${sameField} work`} in ${sector}.`
    : "";
  const rows = shown.map((m) => {
    const { name, detail } = memberLine(m);
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #f0efec;">
      <div style="font-weight:bold;color:#1c1917;">${escapeHtml(name)}</div>
      ${detail ? `<div style="font-size:14px;color:#57534e;">${escapeHtml(detail)}</div>` : ""}
    </td></tr>`;
  }).join("");
  const more = total > shown.length ? `<p style="margin:12px 0 0;font-size:14px;color:#57534e;">and ${total - shown.length} more.</p>` : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f6b3f;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold;">Muslim Pros Network</td></tr>
        <tr><td style="padding:24px;font-size:16px;line-height:1.5;">
          <p style="margin:0 0 12px;">${hello}</p>
          <p style="margin:0 0 16px;">${escapeHtml(intro + fieldNote)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          ${more}
          <a href="${SITE}/search" style="display:inline-block;margin-top:20px;background:#0f6b3f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;">Say salaam</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e7e5e4;font-size:12px;line-height:1.5;color:#78716c;">
          You get this weekly summary because it's on for your account. We only send it in weeks when someone new joins.
          <a href="${SITE}/settings" style="color:#78716c;">Turn it off in Settings</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    hello.replace(/&amp;/g, "&"),
    "",
    intro + fieldNote,
    "",
    ...shown.map((m) => {
      const { name, detail } = memberLine(m);
      return `- ${name}${detail ? ` (${detail})` : ""}`;
    }),
    total > shown.length ? `and ${total - shown.length} more.` : "",
    "",
    `Browse members: ${SITE}/search`,
    `Turn off this weekly email in Settings: ${SITE}/settings`,
  ].join("\n");

  const subject = total === 1
    ? "1 new Muslim professional joined this week"
    : `${total} new Muslim professionals joined this week`;
  return { subject, html, text };
}

serve(async (req) => {
  try {
    const expected = Deno.env.get("DIGEST_SECRET");
    if (!expected || (req.headers.get("x-digest-secret") ?? "") !== expected) {
      return json(403, { success: false, error: "Forbidden" });
    }
    if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const onlyUserId = typeof body?.only_user_id === "string" && UUID_RE.test(body.only_user_id) ? body.only_user_id : null;
    const days = Math.min(31, Math.max(1, Number(body?.days) || 7));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 1. New professionals this window (named, with a job title).
    const { data: newPros, error: newErr } = await supabase
      .from("professional_profiles")
      .select("user_id, occupation, sector, city, country, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (newErr) throw newErr;
    if (!newPros?.length) return json(200, { success: true, sent: 0, reason: "no new members" });

    const newIds = newPros.map((p) => p.user_id);
    const { data: newNames, error: namesErr } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", newIds);
    if (namesErr) throw namesErr;
    const nameById = new Map((newNames ?? []).map((n) => [n.user_id, n]));

    const newMembers: NewMember[] = newPros
      .map((p) => {
        const n = nameById.get(p.user_id);
        const first = (n?.first_name ?? "").trim();
        return {
          user_id: p.user_id,
          first_name: first,
          last_initial: (n?.last_name ?? "").trim().charAt(0).toUpperCase(),
          occupation: p.occupation?.trim() || null,
          sector: p.sector?.trim() || null,
          city: p.city?.trim() || null,
          country: p.country?.trim() || null,
        };
      })
      .filter((m) => m.first_name && m.occupation);
    if (!newMembers.length) return json(200, { success: true, sent: 0, reason: "no complete new profiles" });

    // 2. Recipients: weekly_digest on.
    let recQuery = supabase.from("profiles").select("user_id, first_name").eq("weekly_digest", true);
    if (onlyUserId) recQuery = recQuery.eq("user_id", onlyUserId);
    const { data: recipients, error: recErr } = await recQuery;
    if (recErr) throw recErr;

    const recIds = (recipients ?? []).map((r) => r.user_id);
    const [{ data: recPros }, { data: blocks }] = await Promise.all([
      supabase.from("professional_profiles").select("user_id, sector").in("user_id", recIds.length ? recIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("blocked_users").select("blocker_id, blocked_id"),
    ]);
    const sectorById = new Map((recPros ?? []).map((p) => [p.user_id, p.sector?.trim() || null]));
    const blocked = new Set((blocks ?? []).flatMap((b) => [`${b.blocker_id}:${b.blocked_id}`, `${b.blocked_id}:${b.blocker_id}`]));

    const results: Array<Record<string, unknown>> = [];
    let sent = 0;
    for (const r of recipients ?? []) {
      const candidates = newMembers.filter((m) => m.user_id !== r.user_id && !blocked.has(`${r.user_id}:${m.user_id}`));
      if (!candidates.length) continue;

      const sector = sectorById.get(r.user_id) ?? null;
      const sameField = sector ? candidates.filter((m) => m.sector === sector) : [];
      const ordered = [...sameField, ...candidates.filter((m) => !sameField.includes(m))];
      const shown = ordered.slice(0, MAX_SHOWN);

      const { data: u } = await supabase.auth.admin.getUserById(r.user_id);
      const email = u?.user?.email;
      if (!email || !u?.user?.email_confirmed_at) continue;

      const msg = buildEmail((r.first_name ?? "").trim(), shown, candidates.length, sameField.length, sector);
      if (dryRun) {
        results.push({ user_id: r.user_id, new_members: candidates.length, same_field: sameField.length, subject: msg.subject });
        continue;
      }
      const { error } = await resend.emails.send({ from: FROM, to: [email], subject: msg.subject, html: msg.html, text: msg.text });
      if (error) {
        console.error("member-digest: Resend error", { user_id: r.user_id, error });
        results.push({ user_id: r.user_id, error: "send failed" });
      } else {
        sent++;
      }
      await sleep(600); // stay under Resend's per-second limit
    }

    console.log("member-digest: done", { dryRun, sent, newMembers: newMembers.length });
    return json(200, { success: true, dry_run: dryRun, new_members: newMembers.length, sent, results });
  } catch (err) {
    console.error("member-digest: unexpected error", err);
    return json(500, { success: false, error: "Internal error" });
  }
});
