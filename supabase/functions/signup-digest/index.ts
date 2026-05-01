import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// Signup digest emailer.
// Triggered by pg_cron every Friday at 00:00 UTC (5 PM PDT / 4 PM PST).
// - Always sends the WEEKLY digest.
// - Sends the MONTHLY digest only if today is the LAST Friday of the month
//   (in America/Los_Angeles), since cron can't natively express that.
// Body params (optional, for manual testing):
//   { "mode": "weekly" | "monthly" | "auto", "force": true }

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RECIPIENT = "contact@muslimprosnet.com";
const TZ = "America/Los_Angeles";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Get the date parts in a target timezone.
function partsInTZ(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday, // e.g. "Fri"
  };
}

function isLastFridayOfMonth(now: Date, tz: string): boolean {
  const today = partsInTZ(now, tz);
  if (today.weekday !== "Fri") return false;
  // Add 7 days; if month changes, today is the last Friday.
  const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextParts = partsInTZ(next, tz);
  return nextParts.month !== today.month;
}

interface SignupRow {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
}

async function fetchSignups(sinceISO: string): Promise<SignupRow[]> {
  // Use admin API to list users; paginate up to a reasonable cap.
  const all: SignupRow[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    for (const u of users) {
      if (u.created_at && u.created_at >= sinceISO) {
        all.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at ?? null,
          raw_user_meta_data: (u.user_metadata as Record<string, unknown>) ?? null,
        });
      }
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 20) break; // safety cap (~20k users)
  }
  return all;
}

async function totalUserCount(): Promise<number> {
  let total = 0;
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    total += users.length;
    if (users.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }
  return total;
}

async function fetchProfileRoles(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, role")
    .in("user_id", userIds);
  if (error) {
    console.error("profiles lookup failed:", error);
    return map;
  }
  for (const r of data ?? []) {
    if (r.user_id) map.set(r.user_id as string, (r.role as string) ?? "—");
  }
  return map;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TZ, year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function buildEmailHtml(opts: {
  period: "Weekly" | "Monthly";
  rangeLabel: string;
  current: SignupRow[];
  previousCount: number;
  totalUsers: number;
  roles: Map<string, string>;
}): string {
  const { period, rangeLabel, current, previousCount, totalUsers, roles } = opts;
  const count = current.length;
  const delta = count - previousCount;
  const deltaPct = previousCount > 0
    ? `${delta >= 0 ? "+" : ""}${Math.round((delta / previousCount) * 100)}%`
    : (count > 0 ? "new" : "—");
  const deltaColor = delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#6b7280";

  const byType = new Map<string, number>();
  for (const u of current) {
    const role = roles.get(u.id) ?? "unknown";
    byType.set(role, (byType.get(role) ?? 0) + 1);
  }
  const typeRows = Array.from(byType.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${v}</li>`)
    .join("") || "<li>None</li>";

  const confirmed = current.filter((u) => u.email_confirmed_at).length;
  const confirmRate = count > 0 ? Math.round((confirmed / count) * 100) : 0;

  const userRows = current.length === 0
    ? `<tr><td colspan="4" style="padding:12px;text-align:center;color:#6b7280">No new signups in this period.</td></tr>`
    : current
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((u) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(u.email ?? "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(roles.get(u.id) ?? "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb">${u.email_confirmed_at ? "✅" : "⏳"}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">${escapeHtml(fmtDate(u.created_at))}</td>
          </tr>`)
        .join("");

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;color:#111827">
    <h1 style="margin:0 0 4px">${period} Signup Digest</h1>
    <p style="margin:0 0 24px;color:#6b7280">${escapeHtml(rangeLabel)}</p>

    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
      <div style="flex:1;min-width:140px;padding:16px;background:#f9fafb;border-radius:8px">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase">New signups</div>
        <div style="font-size:28px;font-weight:700">${count}</div>
        <div style="font-size:12px;color:${deltaColor}">${deltaPct} vs prior ${period.toLowerCase()}</div>
      </div>
      <div style="flex:1;min-width:140px;padding:16px;background:#f9fafb;border-radius:8px">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase">Email confirmed</div>
        <div style="font-size:28px;font-weight:700">${confirmed}/${count}</div>
        <div style="font-size:12px;color:#6b7280">${confirmRate}% confirmation</div>
      </div>
      <div style="flex:1;min-width:140px;padding:16px;background:#f9fafb;border-radius:8px">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase">Total users</div>
        <div style="font-size:28px;font-weight:700">${totalUsers}</div>
      </div>
    </div>

    <h2 style="font-size:16px;margin:24px 0 8px">By account type</h2>
    <ul style="margin:0 0 24px;padding-left:20px">${typeRows}</ul>

    <h2 style="font-size:16px;margin:24px 0 8px">New users</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Email</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Role</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Confirmed</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">Signed up (PT)</th>
        </tr>
      </thead>
      <tbody>${userRows}</tbody>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
    <p style="color:#6b7280;font-size:12px">
      Muslim Professionals Network · automated digest · times in America/Los_Angeles
    </p>
  </div>`;
}

async function sendDigest(period: "Weekly" | "Monthly", windowDays: number) {
  const now = new Date();
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const prevSince = new Date(since.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const [currentRange, previousRange, totalUsers] = await Promise.all([
    fetchSignups(since.toISOString()),
    fetchSignups(prevSince.toISOString()).then((rows) =>
      rows.filter((r) => r.created_at < since.toISOString())
    ),
    totalUserCount(),
  ]);

  const roles = await fetchProfileRoles(currentRange.map((u) => u.id));

  const rangeLabel = `${fmtDate(since.toISOString())} – ${fmtDate(now.toISOString())}`;
  const html = buildEmailHtml({
    period,
    rangeLabel,
    current: currentRange,
    previousCount: previousRange.length,
    totalUsers,
    roles,
  });

  const subject = `${period} signup digest: ${currentRange.length} new ${currentRange.length === 1 ? "user" : "users"}`;

  const { data, error } = await resend.emails.send({
    from: "Muslim Pros Net <contact@muslimprosnet.com>",
    to: [RECIPIENT],
    subject,
    html,
  });
  if (error) {
    console.error(`Resend error (${period}):`, error);
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
  return { period, count: currentRange.length, id: data?.id };
}

serve(async (req) => {
  try {
    // Auth: require the service role key as a Bearer token. pg_cron is
    // configured to send this header, and it is never exposed to clients.
    const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("authorization") ?? "";
    const provided = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!expected || provided !== expected) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    let mode: "weekly" | "monthly" | "auto" = "auto";
    let force = false;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.mode === "weekly" || body?.mode === "monthly" || body?.mode === "auto") {
          mode = body.mode;
        }
        force = body?.force === true;
      } catch {
        // ignore — empty body is fine for cron
      }
    }

    const results: unknown[] = [];
    const now = new Date();
    const isLastFriday = isLastFridayOfMonth(now, TZ);

    if (mode === "weekly" || mode === "auto") {
      results.push(await sendDigest("Weekly", 7));
    }
    if (mode === "monthly" || (mode === "auto" && (isLastFriday || force))) {
      results.push(await sendDigest("Monthly", 30));
    }

    return new Response(
      JSON.stringify({ success: true, isLastFridayOfMonth: isLastFriday, results }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("signup-digest error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
