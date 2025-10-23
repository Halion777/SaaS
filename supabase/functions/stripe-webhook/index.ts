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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

 
    if (!signature) {
      console.error('ERROR: Missing stripe-signature header')
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!endpointSecret) {
      console.error('ERROR: Missing STRIPE_WEBHOOK_SECRET environment variable')
      return new Response(
        JSON.stringify({ error: 'Missing webhook secret configuration' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
      console.log('✅ Signature verified successfully')
    } catch (err) {
      console.error('❌ Signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed', details: err.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded (trial ended or renewal):', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          customer: invoice.customer,
          amount: invoice.amount_paid,
          status: invoice.status
        })

        // Update subscription status to 'active' after trial ends
        if (invoice.subscription) {
          try {
            // Update subscriptions table
            await supabaseClient
              .from('subscriptions')
              .update({
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription as string)

            // Update users table
            await supabaseClient
              .from('users')
              .update({
                subscription_status: 'active'
              })
              .eq('stripe_subscription_id', invoice.subscription as string)

            // Create payment record
            await supabaseClient
              .from('payment_records')
              .insert({
                stripe_payment_intent_id: invoice.payment_intent as string,
                stripe_invoice_id: invoice.id,
                amount: (invoice.amount_paid / 100).toFixed(2),
                currency: invoice.currency.toUpperCase(),
                status: 'succeeded',
                description: 'Subscription payment after trial',
                created_at: new Date().toISOString()
              })
            
            console.log('Subscription activated and payment recorded after trial end')
          } catch (error) {
            console.error('Error updating subscription after payment:', error)
          }
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', {
          invoiceId: failedInvoice.id,
          subscriptionId: failedInvoice.subscription,
          customer: failedInvoice.customer,
          attemptCount: failedInvoice.attempt_count
        })

        // Update subscription status to 'past_due'
        if (failedInvoice.subscription) {
          try {
            await supabaseClient
              .from('subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', failedInvoice.subscription as string)

            await supabaseClient
              .from('users')
              .update({
                subscription_status: 'past_due'
              })
              .eq('stripe_subscription_id', failedInvoice.subscription as string)
            
            console.log('Subscription marked as past_due after payment failure')
          } catch (error) {
            console.error('Error updating subscription after payment failure:', error)
          }
        }
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', {
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          customer: updatedSubscription.customer
        })

        // Update subscription status in database
        try {
          await supabaseClient
            .from('subscriptions')
            .update({
              status: updatedSubscription.status,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', updatedSubscription.id)

          await supabaseClient
            .from('users')
            .update({
              subscription_status: updatedSubscription.status
            })
            .eq('stripe_subscription_id', updatedSubscription.id)
        } catch (error) {
          console.error('Error updating subscription:', error)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', {
          subscriptionId: deletedSubscription.id,
          customer: deletedSubscription.customer
        })

        // Update subscription status to 'cancelled'
        try {
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', deletedSubscription.id)

          await supabaseClient
            .from('users')
            .update({
              subscription_status: 'cancelled'
            })
            .eq('stripe_subscription_id', deletedSubscription.id)
        } catch (error) {
          console.error('Error updating cancelled subscription:', error)
        }
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