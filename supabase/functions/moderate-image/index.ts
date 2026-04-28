import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { buildCorsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured')
      return new Response(
        JSON.stringify({
          error: "Content moderation is not available. OpenAI API key is required.",
          approved: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503,
        }
      )
    }

    // Require authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', approved: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', approved: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { imageUrl } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: "Image URL is required", approved: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // SSRF protection: only allow URLs from our own Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const allowedHostSuffix = supabaseUrl.replace(/^https?:\/\//, '')
    let parsed: URL
    try {
      parsed = new URL(imageUrl)
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL", approved: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith(allowedHostSuffix)) {
      return new Response(
        JSON.stringify({ error: "Image URL must be from project storage", approved: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CORRECT shape: pass image as a typed input part. The previous version sent
    // the URL as a string, which only moderates the URL TEXT (always passes).
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: [
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }),
    })

    const moderationResult = await moderationResponse.json()

    if (!moderationResponse.ok) {
      throw new Error(`Moderation API error: ${moderationResult.error?.message || 'Unknown error'}`)
    }

    const isInappropriate = moderationResult.results?.[0]?.flagged || false
    const categories = moderationResult.results?.[0]?.categories || {}
    const flaggedCategories = Object.keys(categories).filter(key => categories[key])

    if (isInappropriate) {
      console.warn(`Image content flagged: ${imageUrl}`, {
        categories: flaggedCategories,
        userId: claimsData.claims.sub,
        timestamp: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify({
        approved: !isInappropriate,
        flagged_categories: flaggedCategories,
        moderation_score: moderationResult.results?.[0]?.category_scores || {}
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in moderate-image function:", error)
    return new Response(
      JSON.stringify({
        error: "Content moderation failed. Image rejected for security.",
        approved: false,
        reason: "moderation_service_error"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
