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
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)
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

        // Update user record with real Stripe data if payment was successful
        if (session.payment_status === 'paid' && session.metadata?.userId) {
          try {
            // Get subscription details to check if it's a trial
            let isTrial = false
            let subscriptionDetails = null
            if (session.subscription) {
              try {
                subscriptionDetails = await stripe.subscriptions.retrieve(session.subscription as string)
                isTrial = subscriptionDetails.status === 'trialing'
              } catch (e) {
                console.error('Error retrieving subscription details:', e)
              }
            }

            await supabaseClient
              .from('users')
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                registration_completed: true,
                has_used_trial: isTrial ? true : undefined // Mark trial as used if starting a trial
              })
              .eq('id', session.metadata.userId)

            // CRITICAL FIX: Create subscription record immediately
            if (session.subscription && subscriptionDetails) {
              const priceId = subscriptionDetails.items.data[0]?.price?.id
              const priceAmount = subscriptionDetails.items.data[0]?.price?.unit_amount || 0
              const priceInterval = subscriptionDetails.items.data[0]?.price?.recurring?.interval || 'month'
              
              // Determine plan type from price ID
              let planType = 'starter'
              const starterMonthly = Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID')
              const starterYearly = Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID')
              const proMonthly = Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')
              const proYearly = Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')
              
              if (priceId === proMonthly || priceId === proYearly) {
                planType = 'pro'
              }

              // Check if subscription record already exists
              const { data: existingSub } = await supabaseClient
                .from('subscriptions')
                .select('id')
                .eq('user_id', session.metadata.userId)
                .single()

              if (existingSub) {
                // Update existing subscription record
                await supabaseClient
                  .from('subscriptions')
                  .update({
                    stripe_subscription_id: subscriptionDetails.id,
                    stripe_customer_id: session.customer as string,
                    plan_type: planType,
                    plan_name: planType === 'pro' ? 'Pro Plan' : 'Starter Plan',
                    status: subscriptionDetails.status,
                    interval: priceInterval === 'year' ? 'yearly' : 'monthly',
                    amount: priceAmount / 100,
                    current_period_start: new Date(subscriptionDetails.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscriptionDetails.current_period_end * 1000).toISOString(),
                    trial_start: subscriptionDetails.trial_start ? new Date(subscriptionDetails.trial_start * 1000).toISOString() : null,
                    trial_end: subscriptionDetails.trial_end ? new Date(subscriptionDetails.trial_end * 1000).toISOString() : null,
                    cancel_at_period_end: subscriptionDetails.cancel_at_period_end || false,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingSub.id)
              } else {
                // Create new subscription record
                await supabaseClient
                  .from('subscriptions')
                  .insert({
                    user_id: session.metadata.userId,
                    stripe_subscription_id: subscriptionDetails.id,
                    stripe_customer_id: session.customer as string,
                    plan_type: planType,
                    plan_name: planType === 'pro' ? 'Pro Plan' : 'Starter Plan',
                    status: subscriptionDetails.status,
                    interval: priceInterval === 'year' ? 'yearly' : 'monthly',
                    amount: priceAmount / 100,
                    current_period_start: new Date(subscriptionDetails.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscriptionDetails.current_period_end * 1000).toISOString(),
                    trial_start: subscriptionDetails.trial_start ? new Date(subscriptionDetails.trial_start * 1000).toISOString() : null,
                    trial_end: subscriptionDetails.trial_end ? new Date(subscriptionDetails.trial_end * 1000).toISOString() : null,
                    cancel_at_period_end: subscriptionDetails.cancel_at_period_end || false
                  })
              }

              // Create payment record if there was an immediate charge (no trial)
              // Skip for $0 amounts as invoice.payment_succeeded will handle it
              if (session.amount_total > 0 && session.payment_intent) {
                const { data: subRecord } = await supabaseClient
                  .from('subscriptions')
                  .select('id')
                  .eq('stripe_subscription_id', subscriptionDetails.id)
                  .single()

                // Check if payment record already exists (prevent duplicates)
                const { data: existingPayment } = await supabaseClient
                  .from('payment_records')
                  .select('id')
                  .eq('stripe_payment_intent_id', session.payment_intent as string)
                  .single()

                // Only create if it doesn't exist
                if (!existingPayment) {
                  await supabaseClient
                    .from('payment_records')
                    .insert({
                      subscription_id: subRecord?.id || null,
                      user_id: session.metadata.userId,
                      stripe_payment_intent_id: session.payment_intent as string,
                      stripe_invoice_id: null,
                      amount: (session.amount_total / 100).toFixed(2),
                      currency: session.currency?.toUpperCase() || 'EUR',
                      status: 'succeeded',
                      payment_method: 'card',
                      description: `Initial subscription - ${planType === 'pro' ? 'Pro' : 'Starter'} Plan`,
                      paid_at: new Date().toISOString(),
                      created_at: new Date().toISOString()
                    })
                }
              }
            }
          } catch (error) {
            console.error('Error processing checkout completion:', error)
          }
        }
        break

      case 'checkout.session.async_payment_succeeded':
        const asyncSuccessSession = event.data.object as Stripe.Checkout.Session
        // Handle async payment success if needed
        break

      case 'checkout.session.async_payment_failed':
        const asyncFailedSession = event.data.object as Stripe.Checkout.Session
        // Handle async payment failure if needed
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        // Handle expired session if needed
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice

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

            //  CRITICAL FIX: Get subscription record with user_id
            const { data: subRecord } = await supabaseClient
              .from('subscriptions')
              .select('id, user_id')
              .eq('stripe_subscription_id', invoice.subscription as string)
              .single()

            // Check if payment record already exists (prevent duplicates)
            const { data: existingPayment } = await supabaseClient
              .from('payment_records')
              .select('id')
              .eq('stripe_invoice_id', invoice.id)
              .single()

            // Only create payment record if it doesn't exist
            if (!existingPayment) {
              await supabaseClient
                .from('payment_records')
                .insert({
                  subscription_id: subRecord?.id || null,
                  user_id: subRecord?.user_id, //  Add user_id
                  stripe_payment_intent_id: invoice.payment_intent as string,
                  stripe_invoice_id: invoice.id,
                  amount: (invoice.amount_paid / 100).toFixed(2),
                  currency: invoice.currency.toUpperCase(),
                  status: 'succeeded',
                  payment_method: 'card',
                  description: 'Subscription payment',
                  paid_at: new Date(invoice.created * 1000).toISOString(), //  Add paid_at timestamp
                  created_at: new Date().toISOString()
                })
            }
          } catch (error) {
            console.error('Error updating subscription after payment:', error)
          }
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice

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
          } catch (error) {
            console.error('Error updating subscription after payment failure:', error)
          }
        }
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        const previousAttributes = event.data.previous_attributes as any

        // Update subscription status in database
        try {
          // Get the old subscription data for comparison
          const { data: oldSubData } = await supabaseClient
            .from('subscriptions')
            .select('*, users!inner(id, email, first_name, last_name, full_name, language_preference)')
            .eq('stripe_subscription_id', updatedSubscription.id)
            .single()

          // Detect plan change to update plan details
          const isPlanChange = previousAttributes?.items !== undefined
          const newPriceId = updatedSubscription.items.data[0]?.price?.id
          const newPrice = updatedSubscription.items.data[0]?.price
          
          // Determine plan type and interval from price ID
          const starterMonthly = Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID')
          const starterYearly = Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID')
          const proMonthly = Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')
          const proYearly = Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')
          
          let planType = oldSubData?.plan_type || 'starter'
          let planName = oldSubData?.plan_name || 'Starter Plan'
          let interval = oldSubData?.interval || 'monthly'
          let amount = oldSubData?.amount || 0
          
          if (isPlanChange && newPriceId) {
            if (newPriceId === starterMonthly || newPriceId === starterYearly) {
              planType = 'starter'
              planName = 'Starter Plan'
            } else if (newPriceId === proMonthly || newPriceId === proYearly) {
              planType = 'pro'
              planName = 'Pro Plan'
            }
            
            interval = newPrice?.recurring?.interval || interval
            amount = newPrice ? (newPrice.unit_amount || 0) / 100 : amount // Convert cents to euros
          }

          // Update subscription in database
          await supabaseClient
            .from('subscriptions')
            .update({
              status: updatedSubscription.status,
              plan_type: planType,
              plan_name: planName,
              interval: interval,
              amount: amount,
              current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(), //  Update period start
              current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(), //  Update period end (fixes "Next Billing" display)
              trial_end: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end * 1000).toISOString() : null, //  Update trial end
              cancel_at_period_end: updatedSubscription.cancel_at_period_end || false,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', updatedSubscription.id)

          // LIFETIME ACCESS PROTECTION: Don't update subscription_status for lifetime access users
          await supabaseClient
            .from('users')
            .update({
              subscription_status: updatedSubscription.status,
              selected_plan: planType
            })
            .eq('stripe_subscription_id', updatedSubscription.id)
            .eq('has_lifetime_access', false) // Only update users WITHOUT lifetime access

          // Send email notification if plan changed, status changed, or reactivated
          if (oldSubData && oldSubData.users) {
            const userData = oldSubData.users
            const oldStatus = previousAttributes?.status || oldSubData.status
            const newStatus = updatedSubscription.status
            const oldCancelAtPeriodEnd = previousAttributes?.cancel_at_period_end !== undefined 
              ? previousAttributes.cancel_at_period_end 
              : oldSubData.cancel_at_period_end
            const newCancelAtPeriodEnd = updatedSubscription.cancel_at_period_end

            // Detect reactivation: cancel_at_period_end changed from true to false
            const isReactivation = oldCancelAtPeriodEnd === true && newCancelAtPeriodEnd === false

            // Detect plan change: items changed
            const isPlanChange = previousAttributes?.items !== undefined
            const oldPriceId = previousAttributes?.items?.data?.[0]?.price?.id
            const newPriceId = updatedSubscription.items.data[0]?.price?.id

            // Determine if upgrade or downgrade
            let isUpgrade = false
            let isDowngrade = false
            if (isPlanChange && oldPriceId && newPriceId && oldPriceId !== newPriceId) {
              // Get price amounts to determine upgrade/downgrade
              const oldPrice = previousAttributes.items.data[0]?.price
              const newPrice = updatedSubscription.items.data[0]?.price
              const oldAmount = oldPrice?.unit_amount || 0
              const newAmount = newPrice?.unit_amount || 0
              
              // Also check plan hierarchy (starter = 1, pro = 2)
              const planHierarchy: Record<string, number> = {
                'starter': 1,
                'pro': 2
              }
              
              // Get plan types from price IDs (check environment variables)
              const starterMonthly = Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID')
              const starterYearly = Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID')
              const proMonthly = Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')
              const proYearly = Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')
              
              let oldPlanType = 'starter'
              if (oldPriceId === proMonthly || oldPriceId === proYearly) {
                oldPlanType = 'pro'
              }
              
              let newPlanType = 'starter'
              if (newPriceId === proMonthly || newPriceId === proYearly) {
                newPlanType = 'pro'
              }
              
              // Determine upgrade/downgrade
              isUpgrade = planHierarchy[newPlanType] > planHierarchy[oldPlanType] || 
                         (newPlanType === oldPlanType && newAmount > oldAmount)
              isDowngrade = planHierarchy[newPlanType] < planHierarchy[oldPlanType] ||
                           (newPlanType === oldPlanType && newAmount < oldAmount)
            }

            // Check if there's a meaningful change worth notifying
            const shouldNotify = 
              (oldStatus !== newStatus) || // Status changed
              isPlanChange || // Plan changed
              isReactivation // Reactivated

            if (shouldNotify) {
              try {
                // Get subscription details from database
                const subscriptionDetails = await supabaseClient
                  .from('subscriptions')
                  .select('plan_name, plan_type, amount, interval')
                  .eq('stripe_subscription_id', updatedSubscription.id)
                  .single()

                const sub = subscriptionDetails?.data || oldSubData

                // Determine email type based on the change
                let emailType = 'subscription_activated' // Default
                if (isReactivation) {
                  emailType = 'subscription_reactivated'
                } else if (isUpgrade) {
                  emailType = 'subscription_upgraded'
                } else if (isDowngrade) {
                  emailType = 'subscription_downgraded'
                } else if (newStatus === 'canceled' || newStatus === 'cancelled') {
                  emailType = 'subscription_cancelled'
                } else if (newStatus === 'past_due') {
                  emailType = 'subscription_cancelled'
                }

                // Prepare email data
                const emailData: any = {
                  user_email: userData.email,
                  user_id: userData.id,
                  user_name: userData.full_name || userData.first_name || 'User',
                  language: userData.language_preference || 'fr'
                }

                // Add subscription details for upgrade/downgrade/reactivation emails
                if ((isUpgrade || isDowngrade || isReactivation) && sub) {
                  emailData.variables = {
                    plan_name: sub.plan_name || '',
                    new_plan_name: sub.plan_name || '',
                    amount: sub.amount ? `${sub.amount}` : '',
                    new_amount: sub.amount ? `${sub.amount}` : '',
                    billing_interval: sub.interval || 'monthly',
                    effective_date: new Date().toLocaleDateString('fr-FR'),
                    company_name: 'Haliqo',
                    support_email: 'support@haliqo.com'
                  }
                  
                  // For upgrade/downgrade, also include old plan info if available
                  if (isUpgrade || isDowngrade) {
                    const oldSub = oldSubData
                    if (oldSub) {
                      emailData.variables.old_plan_name = oldSub.plan_name || ''
                      emailData.variables.old_amount = oldSub.amount ? `${oldSub.amount}` : ''
                    }
                  }
                }

                // Invoke the send-emails function
                const response = await fetch(
                  `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-emails`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                    },
                    body: JSON.stringify({
                      emailType: emailType,
                      emailData: emailData
                    })
                  }
                )

                if (!response.ok) {
                  console.error('Failed to send subscription update email:', await response.text())
                } else {
                  console.log(`Subscription email sent: ${emailType} for user ${userData.id}`)
                }
              } catch (emailError) {
                console.error('Error sending subscription update email:', emailError)
                // Don't fail the webhook for email errors
              }
            }
          }
        } catch (error) {
          console.error('Error updating subscription:', error)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription

        // Update subscription status to 'cancelled'
        try {
          // Get user data for email notification
          const { data: cancelledSubData } = await supabaseClient
            .from('subscriptions')
            .select('*, users!inner(id, email, first_name, last_name, full_name, language_preference)')
            .eq('stripe_subscription_id', deletedSubscription.id)
            .single()

          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: deletedSubscription.canceled_at ? new Date(deletedSubscription.canceled_at * 1000).toISOString() : new Date().toISOString(), //  Set cancelled_at timestamp
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', deletedSubscription.id)

          // LIFETIME ACCESS PROTECTION: Don't update subscription_status for lifetime access users
          // They should always maintain access regardless of Stripe subscription status
          await supabaseClient
            .from('users')
            .update({
              subscription_status: 'cancelled'
            })
            .eq('stripe_subscription_id', deletedSubscription.id)
            .eq('has_lifetime_access', false) // Only update users WITHOUT lifetime access

          // Send cancellation email notification (CONSISTENT WITH subscription.updated)
          if (cancelledSubData && cancelledSubData.users) {
            const userData = cancelledSubData.users
            try {
              // Prepare email data in the same format as subscription.updated
              const emailData: any = {
                user_email: userData.email,
                user_id: userData.id,
                user_name: userData.full_name || userData.first_name || 'User',
                language: userData.language_preference || 'fr',
                variables: {
                  user_name: userData.full_name || userData.first_name || 'User',
                  user_email: userData.email,
                  old_plan_name: cancelledSubData.plan_name || 'Plan',
                  plan_name: cancelledSubData.plan_name || 'Plan',
                  effective_date: deletedSubscription.canceled_at 
                    ? new Date(deletedSubscription.canceled_at * 1000).toLocaleDateString('fr-FR')
                    : new Date().toLocaleDateString('fr-FR'),
                  cancellation_reason: 'User request',
                  company_name: 'Haliqo',
                  support_email: 'support@haliqo.com'
                }
              }

              // Invoke the send-emails function
              const response = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-emails`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                  },
                  body: JSON.stringify({
                    emailType: 'subscription_cancelled',
                    emailData: emailData
                  })
                }
              )

              if (!response.ok) {
                console.error('Failed to send cancellation email:', await response.text())
              } else {
                console.log(`Subscription email sent: subscription_cancelled for user ${userData.id}`)
              }
            } catch (emailError) {
              console.error('Error sending cancellation email:', emailError)
              // Don't fail the webhook for email errors
            }
          }
        } catch (error) {
          console.error('Error updating cancelled subscription:', error)
        }
        break

      default:
        // Unhandled event type - no action needed
        break
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