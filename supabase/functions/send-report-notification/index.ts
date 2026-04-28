import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Per-instance rate limit: max 10 report notifications per user per 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const userHits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const arr = (userHits.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) {
    userHits.set(userId, arr);
    return true;
  }
  arr.push(now);
  userHits.set(userId, arr);
  return false;
}

interface ReportNotificationRequest {
  reportId?: unknown;
  reportType?: unknown;
}

const TYPE_MAP: Record<string, string> = {
  profile: "Profile Report",
  message: "Message Report",
  conversation: "Conversation Report",
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userId = claimsData.claims.sub as string;

    if (rateLimited(userId)) {
      return new Response(
        JSON.stringify({ error: "Too many reports. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const body = (await req.json()) as ReportNotificationRequest;
    const reportId = typeof body.reportId === "string" ? body.reportId : "";
    const reportType =
      typeof body.reportType === "string" && TYPE_MAP[body.reportType]
        ? (body.reportType as keyof typeof TYPE_MAP)
        : null;

    if (!reportId || !reportType) {
      return new Response(
        JSON.stringify({ error: "reportId and valid reportType are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Use service role to look up the report and party names server-side
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: report, error: reportErr } = await admin
      .from("abuse_reports")
      .select("id, reporter_id, accused_id, reason, details")
      .eq("id", reportId)
      .maybeSingle();

    if (reportErr || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Caller must be the reporter
    if (report.reporter_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: parties } = await admin
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", [report.reporter_id, report.accused_id]);

    const nameOf = (id: string) => {
      const p = parties?.find((x) => x.user_id === id);
      if (!p) return "Unknown user";
      return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unnamed user";
    };

    const reporterName = escapeHtml(nameOf(report.reporter_id));
    const accusedName = escapeHtml(nameOf(report.accused_id));
    const reason = escapeHtml(report.reason ?? "");
    const details = report.details ? escapeHtml(report.details).replace(/\n/g, "<br>") : "";
    const typeLabel = TYPE_MAP[reportType];

    const emailResponse = await resend.emails.send({
      from: "Muslim Pros Net <contact@muslimprosnet.com>",
      to: ["contact@muslimprosnet.com"],
      subject: `${typeLabel} - Action Required`,
      html: `
        <h2>New ${typeLabel} Submitted</h2>
        <p><strong>Reporter:</strong> ${reporterName}</p>
        <p><strong>Reported User:</strong> ${accusedName}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${details ? `<p><strong>Additional Details:</strong></p><p>${details}</p>` : ""}
        <p><strong>Report ID:</strong> ${escapeHtml(report.id)}</p>
        <hr>
        <p><em>This report was submitted through Muslim Pros Net platform at www.muslimprosnet.com and requires moderation review.</em></p>
      `,
    });

    if ((emailResponse as { error?: unknown }).error) {
      console.error("Resend error:", (emailResponse as { error: unknown }).error);
      return new Response(JSON.stringify({ success: false, error: "Failed to send email" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-report-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
