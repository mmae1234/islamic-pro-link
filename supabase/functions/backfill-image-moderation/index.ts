import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface ImageRow {
  table: "profiles" | "professional_profiles" | "business_accounts";
  column: "avatar_url" | "logo_url" | "cover_url";
  id: string;
  user_or_owner_id: string | null;
  url: string;
}

interface BackfillSummary {
  scanned: number;
  flagged: number;
  cleared: number;
  errors: number;
  flagged_items: Array<{
    table: string;
    column: string;
    id: string;
    url: string;
    categories: string[];
    cleared: boolean;
  }>;
}

async function moderateImage(
  url: string,
  apiKey: string,
): Promise<{ flagged: boolean; categories: string[] } | { error: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url } }],
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result?.error?.message || `HTTP ${res.status}` };
    }
    const flagged = result.results?.[0]?.flagged ?? false;
    const cats = result.results?.[0]?.categories || {};
    const categories = Object.keys(cats).filter((k) => cats[k]);
    return { flagged, categories };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key is not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Require admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Verify admin role via has_role helper
  const { data: isAdminData, error: roleErr } = await admin.rpc("is_admin", {
    _user_id: claimsData.claims.sub,
  });
  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse options
  let dryRun = true;
  let limit = 500;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.dryRun === "boolean") dryRun = body.dryRun;
    if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 2000) {
      limit = body.limit;
    }
  } catch {
    // optional body
  }

  // Restrict moderation to URLs hosted in this project's storage
  const allowedHostSuffix = supabaseUrl.replace(/^https?:\/\//, "");
  const isAllowedUrl = (u: string): boolean => {
    try {
      const p = new URL(u);
      return p.protocol === "https:" && p.hostname.endsWith(allowedHostSuffix);
    } catch {
      return false;
    }
  };

  // Collect candidate rows
  const items: ImageRow[] = [];

  const { data: pAvatars } = await admin
    .from("profiles")
    .select("id, user_id, avatar_url")
    .not("avatar_url", "is", null)
    .limit(limit);
  for (const r of pAvatars ?? []) {
    if (r.avatar_url) items.push({
      table: "profiles",
      column: "avatar_url",
      id: r.id,
      user_or_owner_id: r.user_id,
      url: r.avatar_url,
    });
  }

  const { data: ppAvatars } = await admin
    .from("professional_profiles")
    .select("id, user_id, avatar_url")
    .not("avatar_url", "is", null)
    .limit(limit);
  for (const r of ppAvatars ?? []) {
    if (r.avatar_url) items.push({
      table: "professional_profiles",
      column: "avatar_url",
      id: r.id,
      user_or_owner_id: r.user_id,
      url: r.avatar_url,
    });
  }

  const { data: bizLogos } = await admin
    .from("business_accounts")
    .select("id, owner_id, logo_url, cover_url")
    .or("logo_url.not.is.null,cover_url.not.is.null")
    .limit(limit);
  for (const r of bizLogos ?? []) {
    if (r.logo_url) items.push({
      table: "business_accounts",
      column: "logo_url",
      id: r.id,
      user_or_owner_id: r.owner_id,
      url: r.logo_url,
    });
    if (r.cover_url) items.push({
      table: "business_accounts",
      column: "cover_url",
      id: r.id,
      user_or_owner_id: r.owner_id,
      url: r.cover_url,
    });
  }

  const summary: BackfillSummary = {
    scanned: 0,
    flagged: 0,
    cleared: 0,
    errors: 0,
    flagged_items: [],
  };

  for (const item of items.slice(0, limit)) {
    summary.scanned += 1;

    if (!isAllowedUrl(item.url)) {
      // Skip externally-hosted URLs to avoid SSRF / off-domain calls
      continue;
    }

    const result = await moderateImage(item.url, OPENAI_API_KEY);
    if ("error" in result) {
      summary.errors += 1;
      console.error(`Moderation error for ${item.table}.${item.column} id=${item.id}:`, result.error);
      continue;
    }

    if (result.flagged) {
      summary.flagged += 1;
      let cleared = false;

      if (!dryRun) {
        const { error: upErr } = await admin
          .from(item.table)
          .update({ [item.column]: null })
          .eq("id", item.id);
        if (upErr) {
          console.error(`Failed to clear ${item.table}.${item.column} id=${item.id}:`, upErr);
        } else {
          cleared = true;
          summary.cleared += 1;
        }
      }

      summary.flagged_items.push({
        table: item.table,
        column: item.column,
        id: item.id,
        url: item.url,
        categories: result.categories,
        cleared,
      });

      console.warn(
        `[BACKFILL] Flagged ${item.table}.${item.column} id=${item.id} owner=${item.user_or_owner_id} categories=${result.categories.join(",")} cleared=${cleared}`,
      );
    }

    // Light throttle: ~5 req/s to stay well under OpenAI limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return new Response(
    JSON.stringify({
      ok: true,
      dryRun,
      limit,
      summary,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
