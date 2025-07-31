import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user ID from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token and get the user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Invalid token or user not found')
    }

    const userId = user.id

    // Delete user data from all related tables
    console.log('Deleting user data for:', userId)

    // Delete mentorship sessions first (due to foreign key constraints)
    const { error: sessionsError } = await supabase
      .from('mentorship_sessions')
      .delete()
      .in('request_id', 
        supabase
          .from('mentorship_requests')
          .select('id')
          .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      )

    if (sessionsError) {
      console.error('Error deleting mentorship sessions:', sessionsError)
    }

    // Delete mentorship requests
    const { error: requestsError } = await supabase
      .from('mentorship_requests')
      .delete()
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)

    if (requestsError) {
      console.error('Error deleting mentorship requests:', requestsError)
    }

    // Delete messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
    }

    // Delete favorites
    const { error: favoritesError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)

    if (favoritesError) {
      console.error('Error deleting favorites:', favoritesError)
    }

    // Delete professional profile
    const { error: professionalError } = await supabase
      .from('professional_profiles')
      .delete()
      .eq('user_id', userId)

    if (professionalError) {
      console.error('Error deleting professional profile:', professionalError)
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // Finally, delete the auth user (this requires service role)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      throw new Error('Failed to delete user account')
    }

    console.log('Successfully deleted user account:', userId)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})