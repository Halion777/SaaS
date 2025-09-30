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

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Add a simple test endpoint (no auth required)
  if (req.url.includes('test')) {
    return new Response(
      JSON.stringify({ 
        message: 'Webhook function is working!',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }

  // For actual webhook requests, proceed with Stripe verification
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature || !endpointSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing signature or endpoint secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
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

    // Handle the event - SIMPLIFIED VERSION WITH USER UPDATE
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Payment completed:', {
          sessionId: session.id,
          userId: session.metadata?.userId,
          paymentStatus: session.payment_status,
          amount: session.amount_total,
          currency: session.currency,
          customer: session.customer,
          subscription: session.subscription
        })

        // Update user record with real Stripe data if payment was successful
        if (session.payment_status === 'paid' && session.metadata?.userId) {
          try {
            await supabaseClient
              .from('users')
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                registration_completed: true
              })
              .eq('id', session.metadata.userId)
            
            console.log('User record updated with Stripe data')
          } catch (error) {
            console.error('Error updating user record:', error)
          }
        }
        break

      case 'checkout.session.async_payment_succeeded':
        const asyncSuccessSession = event.data.object as Stripe.Checkout.Session
        console.log('Async payment succeeded:', {
          sessionId: asyncSuccessSession.id,
          userId: asyncSuccessSession.metadata?.userId,
          paymentStatus: asyncSuccessSession.payment_status
        })
        break

      case 'checkout.session.async_payment_failed':
        const asyncFailedSession = event.data.object as Stripe.Checkout.Session
        console.log('Async payment failed:', {
          sessionId: asyncFailedSession.id,
          userId: asyncFailedSession.metadata?.userId,
          paymentStatus: asyncFailedSession.payment_status
        })
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session expired:', {
          sessionId: expiredSession.id,
          userId: expiredSession.metadata?.userId
        })
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', {
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          customer: updatedSubscription.customer
        })
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', {
          subscriptionId: deletedSubscription.id,
          customer: deletedSubscription.customer
        })
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})