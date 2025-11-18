// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore     
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.21.0'
// @ts-ignore
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, returnUrl } = await req.json()

    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      throw new Error('User not found in database')
    }

    if (!user.stripe_customer_id) {
      throw new Error('No Stripe customer ID found. Please complete your subscription setup.')
    }

    // Check if customer ID is a placeholder (from test/incomplete registration)
    if (user.stripe_customer_id.includes('placeholder') || user.stripe_customer_id.includes('temp_')) {
      throw new Error('Your subscription setup is incomplete. Please complete payment or contact support.')
    }

    console.log('Creating billing portal for customer:', user.stripe_customer_id)

    // Get billing portal configuration ID from environment variable, with fallback
    // @ts-ignore
    const portalConfigurationId = Deno.env.get('STRIPE_BILLING_PORTAL_CONFIG_ID') || 'bpc_1SLPbeE7PWeGNoP4HixyoKue'

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
      configuration: portalConfigurationId,
    })

    console.log('Billing portal session created successfully')

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 