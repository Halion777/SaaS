// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check environment variables
    const envVars = {
      STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY') ? 'SET' : 'NOT SET',
      STRIPE_STARTER_MONTHLY_PRICE_ID: Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID') ? 'SET' : 'NOT SET',
      STRIPE_STARTER_YEARLY_PRICE_ID: Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID') ? 'SET' : 'NOT SET',
      STRIPE_PRO_MONTHLY_PRICE_ID: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') ? 'SET' : 'NOT SET',
      STRIPE_PRO_YEARLY_PRICE_ID: Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID') ? 'SET' : 'NOT SET',
      SITE_URL: Deno.env.get('SITE_URL') || 'NOT SET'
    }

    return new Response(
      JSON.stringify({ 
        message: 'Environment variables check',
        envVars 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 