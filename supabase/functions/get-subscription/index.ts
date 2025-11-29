// @ts-ignore
declare const Deno: any;
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.21.0'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
})

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
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user's Stripe subscription ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found',
          subscription: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const subscriptionId = userData?.stripe_subscription_id
    const customerId = userData?.stripe_customer_id

    // Check if IDs are valid (not placeholders)
    const hasValidSubscription = subscriptionId && 
      !subscriptionId.includes('placeholder') && 
      !subscriptionId.includes('temp_')

    if (!hasValidSubscription) {
      // Return local database subscription data as fallback
      const { data: localSub } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscription: localSub || null,
          source: 'database',
          message: 'No Stripe subscription found, using database data'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice']
    })

    // Get price details
    const priceId = stripeSubscription.items.data[0]?.price?.id
    const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount || 0
    const priceInterval = stripeSubscription.items.data[0]?.price?.recurring?.interval || 'month'
    const productId = stripeSubscription.items.data[0]?.price?.product

    // Determine plan type from price ID or product
    let planType = 'starter'
    const starterMonthlyPriceId = Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID')
    const starterYearlyPriceId = Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID')
    const proMonthlyPriceId = Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')
    const proYearlyPriceId = Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')

    if (priceId === proMonthlyPriceId || priceId === proYearlyPriceId) {
      planType = 'pro'
    } else if (priceId === starterMonthlyPriceId || priceId === starterYearlyPriceId) {
      planType = 'starter'
    }

    // Normalize status (Stripe uses 'trialing', we also accept 'trial')
    let normalizedStatus = stripeSubscription.status
    if (normalizedStatus === 'canceled') {
      normalizedStatus = 'cancelled'
    }

    // Format subscription data
    const formattedSubscription = {
      id: stripeSubscription.id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customerId,
      status: normalizedStatus,
      plan_type: planType,
      plan_name: planType === 'pro' ? 'Pro Plan' : 'Starter Plan',
      amount: priceAmount / 100, // Convert from cents
      interval: priceInterval === 'year' ? 'yearly' : 'monthly',
      currency: stripeSubscription.currency?.toUpperCase() || 'EUR',
      current_period_start: stripeSubscription.current_period_start * 1000,
      current_period_end: stripeSubscription.current_period_end * 1000,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at ? stripeSubscription.canceled_at * 1000 : null,
      trial_start: stripeSubscription.trial_start ? stripeSubscription.trial_start * 1000 : null,
      trial_end: stripeSubscription.trial_end ? stripeSubscription.trial_end * 1000 : null,
      created_at: stripeSubscription.created * 1000,
      // Payment method info
      payment_method: stripeSubscription.default_payment_method ? {
        brand: (stripeSubscription.default_payment_method as any)?.card?.brand,
        last4: (stripeSubscription.default_payment_method as any)?.card?.last4,
        exp_month: (stripeSubscription.default_payment_method as any)?.card?.exp_month,
        exp_year: (stripeSubscription.default_payment_method as any)?.card?.exp_year
      } : null
    }

    // Also sync to local database
    try {
      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: stripeSubscription.id,
          status: normalizedStatus,
          plan_type: planType,
          plan_name: formattedSubscription.plan_name,
          amount: formattedSubscription.amount,
          interval: formattedSubscription.interval,
          current_period_start: new Date(formattedSubscription.current_period_start).toISOString(),
          current_period_end: new Date(formattedSubscription.current_period_end).toISOString(),
          cancel_at_period_end: formattedSubscription.cancel_at_period_end,
          trial_end: formattedSubscription.trial_end ? new Date(formattedSubscription.trial_end).toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    } catch (syncError) {
      console.error('Error syncing subscription to database:', syncError)
      // Don't fail the request if sync fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: formattedSubscription,
        source: 'stripe'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Get subscription error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch subscription',
        subscription: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

