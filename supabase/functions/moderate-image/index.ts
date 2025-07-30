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
      throw new Error('OPENAI_API_KEY is not set')
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

    return new Response(
      JSON.stringify({
        approved: !isInappropriate,
        flagged_categories: Object.keys(categories).filter(key => categories[key])
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in moderate-image function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})