// Admin-only: suspend or restore a member.
// Suspend = Supabase Auth ban (can't sign in) + member_suspensions row
// (hidden from the directory/profiles, can't send or receive messages).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { buildCorsHeaders } from "../_shared/cors.ts"

const BAN_FOREVER = "876000h" // ~100 years

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
    if (!jwt) return json({ error: "Not signed in" }, 401)

    const url = Deno.env.get("SUPABASE_URL") ?? ""
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const asCaller = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })
    const { data: { user }, error: authError } = await asCaller.auth.getUser(jwt)
    if (authError || !user) return json({ error: "Not signed in" }, 401)

    const { data: isAdmin, error: adminError } = await asCaller.rpc("is_admin", { _user_id: user.id })
    if (adminError || isAdmin !== true) return json({ error: "Admins only" }, 403)

    const body = await req.json().catch(() => ({}))
    const userId = typeof body.userId === "string" ? body.userId : ""
    const suspend = body.suspend === true
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Invalid user" }, 400)
    if (userId === user.id) return json({ error: "You can't suspend yourself" }, 400)

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: targetIsAdmin } = await admin.rpc("is_admin", { _user_id: userId })
    if (suspend && targetIsAdmin === true) return json({ error: "Can't suspend another admin" }, 400)

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: suspend ? BAN_FOREVER : "none",
    })
    if (banError) return json({ error: banError.message }, 400)

    const { error: rowError } = suspend
      ? await admin
          .from("member_suspensions")
          .upsert({ user_id: userId, suspended_by: user.id, reason }, { onConflict: "user_id" })
      : await admin.from("member_suspensions").delete().eq("user_id", userId)
    if (rowError) return json({ error: rowError.message }, 400)

    return json({ success: true, suspended: suspend })
  } catch (error) {
    console.error("admin-suspend-user failed:", error)
    return json({ error: (error as Error).message }, 500)
  }
})
