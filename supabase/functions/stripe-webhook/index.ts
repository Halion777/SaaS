// @ts-ignore
declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    // Create Supabase client with service role key for webhook operations
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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update user subscription status
        if (session.metadata?.userId) {
          // First check if user exists in database
          const { data: existingUser, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', session.metadata.userId)
            .single()

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist, create it from auth data
            // Get user from auth.users
            const { data: authData, error: authError } = await supabaseClient.auth.admin.getUserById(session.metadata.userId)
            
            if (authError || !authData?.user) {
              break
            }

            // Create user record
            const { error: createError } = await supabaseClient
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: authData.user.user_metadata?.full_name || 'Unknown',
                company_name: authData.user.user_metadata?.company_name || '',
                phone: authData.user.user_metadata?.phone || '',
                profession: authData.user.user_metadata?.profession || '',
                country: authData.user.user_metadata?.country || 'FR',
                business_size: authData.user.user_metadata?.business_size || '',
                selected_plan: authData.user.user_metadata?.selected_plan || 'starter',
                subscription_status: 'active',
                stripe_subscription_id: session.subscription as string,
                trial_start_date: new Date().toISOString(),
                trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                stripe_customer_id: session.customer as string
              })

            if (createError) {
              console.error('Error creating user record:', createError)
            }
          } else if (existingUser) {
            // User exists, update subscription status
            const { error } = await supabaseClient
              .from('users')
              .update({
                subscription_status: 'active',
                stripe_subscription_id: session.subscription as string,
                stripe_customer_id: session.customer as string
              })
              .eq('id', session.metadata.userId)

            if (error) {
              console.error('Error updating user subscription:', error)
            }
          }
        }
        break

      case 'checkout.session.async_payment_succeeded':
        const asyncSuccessSession = event.data.object as Stripe.Checkout.Session
        
        // Handle async payment success (similar to completed)
        if (asyncSuccessSession.metadata?.userId) {
          const { error } = await supabaseClient
            .from('users')
            .update({
              subscription_status: 'active',
              stripe_subscription_id: asyncSuccessSession.subscription as string
            })
            .eq('id', asyncSuccessSession.metadata.userId)

          if (error) {
            console.error('Error updating user subscription (async success):', error)
          }
        }
        break

      case 'checkout.session.async_payment_failed':
        const asyncFailedSession = event.data.object as Stripe.Checkout.Session
        
        // Handle async payment failure
        if (asyncFailedSession.metadata?.userId) {
          const { error } = await supabaseClient
            .from('users')
            .update({
              subscription_status: 'payment_failed'
            })
            .eq('id', asyncFailedSession.metadata.userId)

          if (error) {
            console.error('Error updating user subscription (async failed):', error)
          }
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        
        // Handle expired checkout session
        if (expiredSession.metadata?.userId) {
          const { error } = await supabaseClient
            .from('users')
            .update({
              subscription_status: 'expired'
            })
            .eq('id', expiredSession.metadata.userId)

          if (error) {
            console.error('Error updating user subscription (expired):', error)
          }
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        
        // Update user subscription status based on subscription status
        const { error } = await supabaseClient
          .from('users')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' : 'inactive'
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription status:', error)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        
        // Update user subscription status to inactive
        const { error: deleteError } = await supabaseClient
          .from('users')
          .update({
            subscription_status: 'inactive'
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        if (deleteError) {
          console.error('Error updating deleted subscription status:', deleteError)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 