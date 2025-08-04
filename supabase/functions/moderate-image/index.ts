import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
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

    const body = await req.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use OpenAI's moderation API for image content
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: imageUrl,
        model: 'omni-moderation-latest'
      }),
    })

    const moderationResult = await moderationResponse.json()
    
    if (!moderationResponse.ok) {
      throw new Error(`Moderation API error: ${moderationResult.error?.message || 'Unknown error'}`)
    }

    const isInappropriate = moderationResult.results?.[0]?.flagged || false
    const categories = moderationResult.results?.[0]?.categories || {}
    const flaggedCategories = Object.keys(categories).filter(key => categories[key])

    // Enhanced logging for security monitoring
    if (isInappropriate) {
      console.warn(`Image content flagged: ${imageUrl}`, {
        categories: flaggedCategories,
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
    
    // For security, reject images when moderation fails
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