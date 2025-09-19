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

// Helper function to convert string back to array for profession field
const convertProfessionToArray = (professionString) => {
  if (!professionString) return null;
  if (typeof professionString === 'string') {
    // Split by comma and trim whitespace
    return professionString.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }
  if (Array.isArray(professionString)) {
    return professionString;
  }
  return null;
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
        
        // Only complete registration if payment was successful
        if (session.payment_status === 'paid' && session.metadata?.userId) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Determine subscription status based on trial period
          const subscriptionStatus = subscription.status === 'trialing' ? 'trial' : 'active'
          
          // Get user data from auth.users metadata
          const { data: authUser, error: authUserError } = await supabaseClient.auth.admin.getUserById(session.metadata.userId)
          
          if (authUserError) {
            console.error('Error getting auth user:', authUserError)
            return new Response(JSON.stringify({ error: 'Failed to get user data' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          const userMetadata = authUser?.user?.user_metadata || {}
          console.log('User metadata from auth:', userMetadata)
          
          // Create user record in public.users table
          const professionString = userMetadata.profession || session.metadata.profession;
          const professionArray = convertProfessionToArray(professionString);
          
          const userRecord = {
            id: session.metadata.userId,
            email: userMetadata.email || session.customer_email || session.metadata.email,
            full_name: userMetadata.full_name || session.metadata.fullName,
            company_name: userMetadata.company_name || session.metadata.companyName,
            vat_number: userMetadata.vat_number || session.metadata.vatNumber,
            phone: userMetadata.phone || session.metadata.phone,
            profession: professionArray, // Store as array in database
            country: userMetadata.country || session.metadata.country || 'FR',
            business_size: userMetadata.business_size || session.metadata.businessSize,
            selected_plan: userMetadata.selected_plan || session.metadata.planType,
            subscription_status: subscriptionStatus,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            registration_completed: true
          }
          
          console.log('Creating user record:', userRecord)

          // Insert or update user record
          const { error: userError } = await supabaseClient
            .from('users')
            .upsert(userRecord, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })

          if (userError) {
            console.error('Error creating user record:', userError)
            return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('User record created successfully')
          
          // Create initial user profile for multi-user system
          const { error: profileError } = await supabaseClient
            .from('user_profiles')
            .insert({
              user_id: session.metadata.userId,
              name: userRecord.full_name,
              email: userRecord.email,
              role: 'admin',
              permissions: {
                dashboard: 'full_access',
                analytics: 'full_access',
                peppolAccessPoint: 'full_access',
                leadsManagement: 'full_access',
                quoteCreation: 'full_access',
                quotesManagement: 'full_access',
                quotesFollowUp: 'full_access',
                invoicesFollowUp: 'full_access',
                clientInvoices: 'full_access',
                supplierInvoices: 'full_access',
                clientManagement: 'full_access',
                creditInsurance: 'full_access',
                recovery: 'full_access'
              },
              is_active: true
            })

          if (profileError) {
            console.error('Error creating user profile:', profileError)
          } else {
            console.log('User profile created successfully')
          }

          // Create subscription record
          const planType = session.metadata.planType || 'starter';
          const billingCycle = session.metadata.billingCycle || 'monthly';
          
          const subscriptionRecord = {
            user_id: session.metadata.userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            plan_name: subscriptionStatus === 'trial' ? 'Trial' : planType,
            plan_type: planType,
            status: subscriptionStatus,
            interval: billingCycle,
            amount: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
            currency: subscription.currency?.toUpperCase() || 'EUR',
            current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          }

          const { data: subscriptionData, error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .insert(subscriptionRecord)
            .select()
            .single()

          if (subscriptionError) {
            console.error('Error creating subscription record:', subscriptionError)
          } else {
            console.log('Subscription record created successfully:', subscriptionData.id)

            // Create initial payment record for trial start
            const paymentRecord = {
              subscription_id: subscriptionData.id,
              user_id: session.metadata.userId,
              stripe_payment_intent_id: null, // No payment intent for trial
              stripe_invoice_id: null, // No invoice for trial
              amount: 0, // Trial is free
              currency: subscription.currency?.toUpperCase() || 'EUR',
              status: 'trial_started',
              payment_method: 'trial',
              description: `Trial started for ${planType} plan`,
              paid_at: new Date().toISOString()
            }

            const { error: paymentError } = await supabaseClient
              .from('payment_records')
              .insert(paymentRecord)

            if (paymentError) {
              console.error('Error creating payment record:', paymentError)
            } else {
              console.log('Payment record created successfully')
            }
          }

          console.log(`Registration completed for user: ${session.metadata.userId}`)
        } else if (session.payment_status === 'unpaid') {
          console.log(`Payment failed for user: ${session.metadata?.userId}`)
          
          // Delete the auth user since payment failed
          try {
            const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(session.metadata.userId)
            if (deleteError) {
              console.error('Error deleting auth user after payment failure:', deleteError)
            } else {
              console.log('Auth user deleted after payment failure')
            }
          } catch (error) {
            console.error('Error deleting auth user:', error)
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
        
        // Handle async payment failure - delete auth user
        if (asyncFailedSession.metadata?.userId) {
          console.log(`Async payment failed for user: ${asyncFailedSession.metadata.userId}`)
          
          // Delete the auth user since payment failed
          try {
            const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(asyncFailedSession.metadata.userId)
            if (deleteError) {
              console.error('Error deleting auth user after async payment failure:', deleteError)
            } else {
              console.log('Auth user deleted after async payment failure')
            }
          } catch (error) {
            console.error('Error deleting auth user:', error)
          }
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        
        // Handle expired checkout session - delete auth user
        if (expiredSession.metadata?.userId) {
          console.log(`Checkout session expired for user: ${expiredSession.metadata.userId}`)
          
          // Delete the auth user since session expired
          try {
            const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(expiredSession.metadata.userId)
            if (deleteError) {
              console.error('Error deleting auth user after session expiry:', deleteError)
            } else {
              console.log('Auth user deleted after session expiry')
            }
          } catch (error) {
            console.error('Error deleting auth user:', error)
          }
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        
        // Determine the correct status based on Stripe subscription status
        let userStatus = 'inactive'
        if (subscription.status === 'active') {
          userStatus = 'active'
        } else if (subscription.status === 'trialing') {
          userStatus = 'trial'
        } else if (subscription.status === 'past_due') {
          userStatus = 'past_due'
        } else if (subscription.status === 'canceled') {
          userStatus = 'cancelled'
        }
        
        // Update user subscription status
        const { error: userError } = await supabaseClient
          .from('users')
          .update({
            subscription_status: userStatus,
            trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
          })
          .eq('stripe_subscription_id', subscription.id)

        if (userError) {
          console.error('Error updating user subscription status:', userError)
        }

        // Update subscription record
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          })
          .eq('stripe_subscription_id', subscription.id)

        if (subError) {
          console.error('Error updating subscription record:', subError)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        
        // Update user subscription status to inactive
        const { error: userDeleteError } = await supabaseClient
          .from('users')
          .update({
            subscription_status: 'inactive'
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        if (userDeleteError) {
          console.error('Error updating user deleted subscription status:', userDeleteError)
        }

        // Update subscription record
        const { error: subDeleteError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        if (subDeleteError) {
          console.error('Error updating deleted subscription record:', subDeleteError)
        }
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        
        // Create payment record for successful payments
        if (invoice.subscription) {
          const { error: paymentError } = await supabaseClient
            .from('payment_records')
            .insert({
              subscription_id: (await supabaseClient
                .from('subscriptions')
                .select('id')
                .eq('stripe_subscription_id', invoice.subscription)
                .single()
              ).data?.id,
              user_id: (await supabaseClient
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', invoice.subscription)
                .single()
              ).data?.user_id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              stripe_invoice_id: invoice.id,
              amount: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency,
              status: 'succeeded',
              payment_method: 'card', // Default, can be enhanced
              description: `Payment for ${invoice.lines.data[0]?.description || 'subscription'}`,
              paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            })

          if (paymentError) {
            console.error('Error creating payment record:', paymentError)
          }
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