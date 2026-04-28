import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCorsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const jwt = authHeader.replace('Bearer ', '')

    // 1) Verify the JWT and resolve the caller's user id (uses anon client + getUser)
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const userId = user.id
    console.log('Deleting user data via RPC for:', userId)

    // 2) Delegate ALL deletes (including auth.users) to the SECURITY DEFINER RPC.
    //    The RPC enforces auth.uid() = user_id_param, so we MUST call it as the user
    //    (forward their JWT) — not with the service role.
    const supabaseAsUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      }
    )

    const { error: rpcError } = await supabaseAsUser.rpc('delete_user_account', {
      user_id_param: userId,
    })

    if (rpcError) {
      console.error('delete_user_account RPC failed:', rpcError)
      return new Response(JSON.stringify({ error: rpcError.message || 'Failed to delete account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('Successfully deleted user account:', userId)
    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
