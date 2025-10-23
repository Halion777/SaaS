// @ts-ignore
declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.21.0'

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
    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching Stripe session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'payment_intent']
    })

    console.log('Stripe session retrieved:', {
      id: session.id,
      customer: session.customer,
      subscription: session.subscription,
      payment_status: session.payment_status,
      amount_total: session.amount_total
    })

    // Get plan amount from subscription (for trials, amount_total is 0)
    let planAmount = session.amount_total || 0;
    if (session.subscription && typeof session.subscription === 'object') {
      const subscriptionItems = session.subscription?.items?.data;
      if (subscriptionItems && subscriptionItems.length > 0) {
        const priceData = subscriptionItems[0]?.price;
        planAmount = priceData?.unit_amount || planAmount;
      }
    }

    console.log('Plan amount calculated:', {
      session_amount: session.amount_total,
      plan_amount: planAmount,
      is_trial: session.subscription?.status === 'trialing'
    });

    // Extract relevant data
    const sessionData = {
      id: session.id,
      customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      plan_amount: planAmount, // Real subscription plan amount (even for trials)
      currency: session.currency,
      metadata: session.metadata,
      // Subscription details (if expanded)
      subscription_details: session.subscription ? {
        id: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
        status: session.subscription?.status,
        current_period_start: session.subscription?.current_period_start,
        current_period_end: session.subscription?.current_period_end,
        trial_start: session.subscription?.trial_start,
        trial_end: session.subscription?.trial_end,
        items: session.subscription?.items?.data
      } : null
    }

    return new Response(
      JSON.stringify(sessionData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error retrieving Stripe session:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to retrieve session',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

