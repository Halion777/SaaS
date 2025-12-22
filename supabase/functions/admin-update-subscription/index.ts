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
    const { 
      userId,
      stripeSubscriptionId,
      action, // 'update_plan', 'cancel' (admin only), 'reactivate' (admin only), 'update_status'
      planType,
      billingInterval,
      cancelAtPeriodEnd,
      prorationBehavior // 'always_invoice' for immediate, 'none' for scheduled
    } = await req.json()

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

    // Get user's Stripe subscription ID if not provided
    let subscriptionId = stripeSubscriptionId
    if (!subscriptionId && userId) {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single()

      if (userError || !userData?.stripe_subscription_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No Stripe subscription found for this user' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      subscriptionId = userData.stripe_subscription_id
    }

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Stripe subscription ID is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any = null

    switch (action) {
      case 'update_plan':
        // Get the new price ID based on plan type and interval
        const planPrices: Record<string, Record<string, string>> = {
          starter: {
            monthly: Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID') || '',
            yearly: Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID') || ''
          },
          pro: {
            monthly: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') || '',
            yearly: Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID') || ''
          }
        }

        // Plan hierarchy for determining upgrade vs downgrade
        const planHierarchy: Record<string, number> = {
          'starter': 1,
          'pro': 2
        }

        // Price amounts for comparison (monthly prices)
        const planAmounts: Record<string, Record<string, number>> = {
          starter: { monthly: 2999, yearly: 29988 }, // in cents
          pro: { monthly: 4999, yearly: 49992 }
        }

        const newPriceId = planPrices[planType]?.[billingInterval]
        if (!newPriceId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Invalid plan type (${planType}) or billing interval (${billingInterval})` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get current subscription to find the item ID and current plan
        let currentSub = await stripe.subscriptions.retrieve(subscriptionId)
        const currentItemId = currentSub.items.data[0]?.id
        const currentPriceId = currentSub.items.data[0]?.price?.id
        const currentAmount = currentSub.items.data[0]?.price?.unit_amount || 0
        const currentInterval = currentSub.items.data[0]?.price?.recurring?.interval

        if (!currentItemId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Could not find subscription item' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // If subscription is set to cancel, remove cancellation first to allow plan change
        if (currentSub.cancel_at_period_end) {
          const cancelSchedule = currentSub.schedule
          
          if (cancelSchedule) {
            // Check if schedule is for cancellation
            const scheduleData = await stripe.subscriptionSchedules.retrieve(cancelSchedule as string)
            if (scheduleData.end_behavior === 'cancel') {
              // Release the cancellation schedule
              await stripe.subscriptionSchedules.release(cancelSchedule as string)
            } else {
              // Just remove cancellation flag
              await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: false
              })
            }
          } else {
            // No schedule - remove cancellation directly
            await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false
            })
          }
          
          // Re-fetch subscription to get updated state
          currentSub = await stripe.subscriptions.retrieve(subscriptionId)
        }

        // Determine current plan type from price ID
        let currentPlanType = 'starter'
        if (currentPriceId === planPrices.pro.monthly || currentPriceId === planPrices.pro.yearly) {
          currentPlanType = 'pro'
        }

        // Determine if this is an upgrade or downgrade
        // Upgrade: Moving to higher tier plan OR same plan with higher price (monthly to yearly doesn't count as downgrade)
        // Downgrade: Moving to lower tier plan OR switching to shorter billing interval
        const newAmount = planAmounts[planType]?.[billingInterval] || 0
        const isUpgrade = planHierarchy[planType] > planHierarchy[currentPlanType] || 
                          (planType === currentPlanType && newAmount > currentAmount)
        const isDowngrade = planHierarchy[planType] < planHierarchy[currentPlanType] ||
                           (planType === currentPlanType && billingInterval === 'monthly' && currentInterval === 'year')

        console.log(`Plan change: ${currentPlanType} -> ${planType}, isUpgrade: ${isUpgrade}, isDowngrade: ${isDowngrade}`)

        // Check if immediate change is requested
        const applyImmediately = prorationBehavior === 'always_invoice'

        if (isDowngrade && !applyImmediately) {
          // DOWNGRADE: Wait until end of billing period (as per Stripe portal settings)
          // BUT: If in trial, schedule for after trial ends (no charge during trial)
          // Use subscription schedule to schedule the change
          
          // Check if subscription is in trial period
          const now = Math.floor(Date.now() / 1000)
          const isInTrial = (currentSub.status === 'trialing' || (currentSub.trial_end && currentSub.trial_end > now)) && currentSub.trial_end
          const effectiveDate = isInTrial ? currentSub.trial_end : currentSub.current_period_end
          
          // Check if there's already a schedule
          let schedule = currentSub.schedule
          
          if (schedule) {
            // Release the existing schedule first (can't update phases that have ended)
            try {
              await stripe.subscriptionSchedules.release(schedule as string)
            } catch (releaseError) {
              
              // If release fails, try to cancel it
              try {
                await stripe.subscriptionSchedules.cancel(schedule as string)
              } catch (cancelError) {
                console.error('Error canceling schedule:', cancelError)
              }
            }
            
            // Re-fetch subscription to get updated state
            currentSub = await stripe.subscriptions.retrieve(subscriptionId)
          }
          
          {
            // Create new schedule from subscription
            const newSchedule = await stripe.subscriptionSchedules.create({
              from_subscription: subscriptionId
            })
            
            // Update the schedule with the downgrade at period/trial end
            result = await stripe.subscriptionSchedules.update(newSchedule.id, {
              end_behavior: 'release', // Release schedule at end (subscription continues with new plan)
              phases: [
                {
                  items: [{ price: currentPriceId, quantity: 1 }],
                  start_date: currentSub.current_period_start,
                  end_date: effectiveDate
                },
                {
                  items: [{ price: newPriceId, quantity: 1 }],
                  start_date: effectiveDate
                  // Last phase has no end_date - will continue indefinitely
                }
              ]
            })
          }
          
          // For scheduled downgrades, send email immediately to confirm scheduling
          // Webhook will send another email when change actually takes effect
          if (userId) {
            try {
              const { data: userData } = await supabaseClient
                .from('users')
                .select('id, email, first_name, last_name, full_name, language_preference')
                .eq('id', userId)
                .single()

              if (userData) {
                const { data: subData } = await supabaseClient
                  .from('subscriptions')
                  .select('plan_name, plan_type, amount, interval')
                  .eq('user_id', userId)
                  .single()

                if (subData) {
                  const emailData: any = {
                    user_email: userData.email,
                    user_id: userData.id,
                    user_name: userData.full_name || userData.first_name || 'User',
                    language: userData.language_preference || 'fr',
                    variables: {
                      plan_name: subData.plan_name || '',
                      new_plan_name: subData.plan_name || '',
                      amount: subData.amount ? `${subData.amount}€` : '',
                      new_amount: subData.amount ? `${subData.amount}€` : '',
                      billing_interval: subData.interval || 'monthly',
                      effective_date: new Date(effectiveDate * 1000).toLocaleDateString('fr-FR'),
                      company_name: 'Haliqo',
                      support_email: 'support@haliqo.com'
                    }
                  }

                  // Get old plan info
                  const { data: oldSub } = await supabaseClient
                    .from('subscriptions')
                    .select('plan_name, amount')
                    .eq('user_id', userId)
                    .single()
                  
                  if (oldSub) {
                    emailData.variables.old_plan_name = oldSub.plan_name || ''
                    emailData.variables.old_amount = oldSub.amount ? `${oldSub.amount}€` : ''
                  }

                  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-emails`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                    },
                    body: JSON.stringify({
                      emailType: 'subscription_downgraded',
                      emailData: emailData
                    })
                  })
                }
              }
            } catch (e) {
              console.error('Error sending downgrade email:', e)
            }
          }

          // Return schedule info
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                id: subscriptionId,
                status: currentSub.status,
                cancel_at_period_end: false,
                current_period_end: currentSub.current_period_end,
                plan: currentPriceId,
                scheduled_change: {
                  new_plan: newPriceId,
                  effective_date: effectiveDate
                }
              },
              message: isInTrial 
                ? 'Downgrade scheduled for after trial period ends (no charge during trial)'
                : 'Downgrade scheduled for end of billing period'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // UPGRADE OR IMMEDIATE CHANGE: Check if subscription is in trial period
          // Check both status and trial_end date to handle reactivated subscriptions that are still in trial
          const now = Math.floor(Date.now() / 1000)
          const isInTrial = (currentSub.status === 'trialing' || (currentSub.trial_end && currentSub.trial_end > now)) && currentSub.trial_end
          const effectiveDate = isInTrial ? currentSub.trial_end : currentSub.current_period_end
          
          if (isInTrial && !applyImmediately) {
            // If in trial, schedule upgrade for after trial ends (no charge during trial)
            
            // Check if there's already a schedule
            let schedule = currentSub.schedule
            
            if (schedule) {
              // Release the existing schedule first (can't update phases that have ended)
              try {
                await stripe.subscriptionSchedules.release(schedule as string)
                
              } catch (releaseError) {
                console.error('Error releasing schedule:', releaseError)
                // If release fails, try to cancel it
                try {
                  await stripe.subscriptionSchedules.cancel(schedule as string)
                } catch (cancelError) {
                  console.error('Error canceling schedule:', cancelError)
                }
              }
              
              // Re-fetch subscription to get updated state
              currentSub = await stripe.subscriptions.retrieve(subscriptionId)
            }
            
            {
              // Create new schedule from subscription
              const newSchedule = await stripe.subscriptionSchedules.create({
                from_subscription: subscriptionId
              })
              
              // Update the schedule with the upgrade at trial end
              result = await stripe.subscriptionSchedules.update(newSchedule.id, {
                end_behavior: 'release', // Release schedule at end (subscription continues with new plan)
                phases: [
                  {
                    items: [{ price: currentPriceId, quantity: 1 }],
                    start_date: currentSub.current_period_start,
                    end_date: effectiveDate
                  },
                  {
                    items: [{ price: newPriceId, quantity: 1 }],
                    start_date: effectiveDate
                    // Last phase has no end_date - will continue indefinitely
                  }
                ]
              })
            }
            
            // For scheduled upgrades during trial, send email immediately to confirm scheduling
            // Webhook will send another email when change actually takes effect
            if (userId) {
              try {
                const { data: userData } = await supabaseClient
                  .from('users')
                  .select('id, email, first_name, last_name, full_name, language_preference')
                  .eq('id', userId)
                  .single()

                if (userData) {
                  const { data: subData } = await supabaseClient
                    .from('subscriptions')
                    .select('plan_name, plan_type, amount, interval')
                    .eq('user_id', userId)
                    .single()

                  if (subData) {
                    const emailData: any = {
                      user_email: userData.email,
                      user_id: userData.id,
                      user_name: userData.full_name || userData.first_name || 'User',
                      language: userData.language_preference || 'fr',
                      variables: {
                        plan_name: subData.plan_name || '',
                        new_plan_name: subData.plan_name || '',
                        amount: subData.amount ? `${subData.amount}€` : '',
                        new_amount: subData.amount ? `${subData.amount}€` : '',
                        billing_interval: subData.interval || 'monthly',
                        effective_date: new Date(effectiveDate * 1000).toLocaleDateString('fr-FR'),
                        company_name: 'Haliqo',
                        support_email: 'support@haliqo.com'
                      }
                    }

                    // Get old plan info
                    const { data: oldSub } = await supabaseClient
                      .from('subscriptions')
                      .select('plan_name, amount')
                      .eq('user_id', userId)
                      .single()
                    
                    if (oldSub) {
                      emailData.variables.old_plan_name = oldSub.plan_name || ''
                      emailData.variables.old_amount = oldSub.amount ? `${oldSub.amount}€` : ''
                    }

                    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-emails`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                      },
                      body: JSON.stringify({
                        emailType: 'subscription_upgraded',
                        emailData: emailData
                      })
                    })
                  }
                }
              } catch (e) {
                console.error('Error sending upgrade email:', e)
              }
            }

            // Return schedule info
            return new Response(
              JSON.stringify({ 
                success: true, 
                data: {
                  id: subscriptionId,
                  status: currentSub.status,
                  cancel_at_period_end: false,
                  current_period_end: currentSub.current_period_end,
                  trial_end: currentSub.trial_end,
                  plan: currentPriceId,
                  scheduled_change: {
                    new_plan: newPriceId,
                    effective_date: effectiveDate,
                    is_trial_upgrade: true
                  }
                },
                message: 'Upgrade scheduled for after trial period ends (no charge during trial)'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            // Not in trial: Apply immediately with proration (as per Stripe portal settings)
            // BUT: Double-check trial_end to prevent charging during trial period
            const now = Math.floor(Date.now() / 1000)
            const stillInTrial = currentSub.trial_end && currentSub.trial_end > now
            
            if (stillInTrial) {
              // Still in trial period - schedule for after trial ends (no charge during trial)
              const effectiveDate = currentSub.trial_end
              
              // Check if there's already a schedule
              let schedule = currentSub.schedule
              
              if (schedule) {
                // Update existing schedule
                result = await stripe.subscriptionSchedules.update(schedule as string, {
                  end_behavior: 'release',
                  phases: [
                    {
                      items: [{ price: currentPriceId, quantity: 1 }],
                      start_date: currentSub.current_period_start,
                      end_date: effectiveDate
                    },
                    {
                      items: [{ price: newPriceId, quantity: 1 }],
                      start_date: effectiveDate
                    }
                  ]
                })
              } else {
                // Create new schedule from subscription
                const newSchedule = await stripe.subscriptionSchedules.create({
                  from_subscription: subscriptionId
                })
                
                // Update the schedule with the upgrade at trial end
                result = await stripe.subscriptionSchedules.update(newSchedule.id, {
                  end_behavior: 'release',
                  phases: [
                    {
                      items: [{ price: currentPriceId, quantity: 1 }],
                      start_date: currentSub.current_period_start,
                      end_date: effectiveDate
                    },
                    {
                      items: [{ price: newPriceId, quantity: 1 }],
                      start_date: effectiveDate
                    }
                  ]
                })
              }
              
              // Return schedule info
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  data: {
                    id: subscriptionId,
                    status: currentSub.status,
                    cancel_at_period_end: false,
                    current_period_end: currentSub.current_period_end,
                    trial_end: currentSub.trial_end,
                    plan: currentPriceId,
                    scheduled_change: {
                      new_plan: newPriceId,
                      effective_date: effectiveDate,
                      is_trial_upgrade: true
                    }
                  },
                  message: 'Change scheduled for after trial period ends (no charge during trial)'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
            
            // Not in trial - apply immediately with proration
            result = await stripe.subscriptions.update(subscriptionId, {
              items: [{
                id: currentItemId,
                price: newPriceId
              }],
              proration_behavior: 'always_invoice' // Prorate charges immediately
            })
            
            // For immediate upgrades, send email immediately (webhook will also send as backup)
            // Store action info for email sending at the end
            // (Email sending happens after switch statement)
          }
        }
        break

      case 'cancel':
        // Cancel subscription (immediately or at period end)
        // First, check if there's a scheduled plan change and release it
        const cancelSub = await stripe.subscriptions.retrieve(subscriptionId)
        const cancelSchedule = cancelSub.schedule
        
        if (cancelSchedule) {
          // Release any existing schedule (plan changes) first
          await stripe.subscriptionSchedules.release(cancelSchedule as string)
          // Re-fetch subscription after schedule release
          const updatedCancelSub = await stripe.subscriptions.retrieve(subscriptionId)
          
          if (cancelAtPeriodEnd) {
            result = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: true
            })
          } else {
            result = await stripe.subscriptions.cancel(subscriptionId)
          }
        } else {
          // No schedule - proceed with cancellation directly
          if (cancelAtPeriodEnd) {
            result = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: true
            })
          } else {
            result = await stripe.subscriptions.cancel(subscriptionId)
          }
        }
        break

      case 'reactivate':
        // Reactivate a subscription that was set to cancel at period end
        const reactivateSub = await stripe.subscriptions.retrieve(subscriptionId)
        const reactivateSchedule = reactivateSub.schedule
        
        if (reactivateSchedule) {
          // If there's a schedule, check if it's for cancellation or plan change
          const scheduleData = await stripe.subscriptionSchedules.retrieve(reactivateSchedule as string)
          
          if (scheduleData.end_behavior === 'cancel') {
            // Schedule is for cancellation - update to release instead
            await stripe.subscriptionSchedules.update(reactivateSchedule as string, {
              end_behavior: 'release'
            })
            result = await stripe.subscriptions.retrieve(subscriptionId)
            result.cancel_at_period_end = false
          } else {
            // Schedule is for plan change - just remove cancellation flag
            result = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false
            })
          }
        } else {
          // No schedule - update subscription directly
          result = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
          })
        }
        break

      case 'update_status':
        // For status-only updates, we can pause/resume
        // Note: Stripe doesn't have a direct "status" update - most status changes happen through other actions
        // We'll just retrieve the current subscription
        result = await stripe.subscriptions.retrieve(subscriptionId)
        break

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send email notification immediately after successful update
    // For immediate changes (upgrades, cancel, reactivate), send email right away
    // For scheduled changes (downgrades, upgrades during trial), webhook will send email when change takes effect
    if (result && userId && action !== 'update_status') {
      try {
        // Get user data for email
        const { data: userData } = await supabaseClient
          .from('users')
          .select('id, email, first_name, last_name, full_name, language_preference')
          .eq('id', userId)
          .single()

        if (userData) {
          // Get current subscription details from database
          const { data: subData } = await supabaseClient
            .from('subscriptions')
            .select('plan_name, plan_type, amount, interval')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          let emailType: string | null = null
          let shouldSendImmediately = false
          const emailData: any = {
            user_email: userData.email,
            user_id: userData.id,
            user_name: userData.full_name || userData.first_name || 'User',
            language: userData.language_preference || 'fr'
          }

          // Determine email type and if we should send immediately
          if (action === 'update_plan' && result) {
            // Check if change is immediate or scheduled
            // If result is a subscription object (not schedule), change is immediate
            // If result is a schedule, change is scheduled (webhook will handle)
            const isSchedule = result.object === 'subscription_schedule'
            
            if (!isSchedule) {
              // Immediate change - send email now
              shouldSendImmediately = true
              
              // Get old subscription to compare
              const { data: oldSub } = await supabaseClient
                .from('subscriptions')
                .select('plan_type, plan_name, amount')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

              if (oldSub && subData) {
                const newPriceAmount = result.items?.data[0]?.price?.unit_amount || 0
                const oldAmount = parseFloat(oldSub.amount || '0') * 100 // Convert to cents
                const planHierarchy: Record<string, number> = { 'starter': 1, 'pro': 2 }
                const oldPlanType = oldSub.plan_type || 'starter'
                const newPlanType = subData.plan_type || 'starter'
                
                const isUpgrade = planHierarchy[newPlanType] > planHierarchy[oldPlanType] || 
                                 (newPlanType === oldPlanType && newPriceAmount > oldAmount)
                const isDowngrade = planHierarchy[newPlanType] < planHierarchy[oldPlanType] ||
                                   (newPlanType === oldPlanType && newPriceAmount < oldAmount)

                if (isUpgrade) {
                  emailType = 'subscription_upgraded'
                } else if (isDowngrade) {
                  emailType = 'subscription_downgraded'
                }
              }
            }
            // If scheduled, webhook will send email when change takes effect
          } else if (action === 'cancel') {
            emailType = 'subscription_cancelled'
            shouldSendImmediately = true
          } else if (action === 'reactivate') {
            emailType = 'subscription_reactivated'
            shouldSendImmediately = true
          }

          // Send email immediately for immediate changes
          if (shouldSendImmediately && emailType && subData) {
            emailData.variables = {
              plan_name: subData.plan_name || '',
              new_plan_name: subData.plan_name || '',
              amount: subData.amount ? `${subData.amount}€` : '',
              new_amount: subData.amount ? `${subData.amount}€` : '',
              billing_interval: subData.interval || 'monthly',
              effective_date: new Date().toLocaleDateString('fr-FR'),
              company_name: 'Haliqo',
              support_email: 'support@haliqo.com'
            }

            // For upgrade/downgrade, add old plan info
            if (emailType === 'subscription_upgraded' || emailType === 'subscription_downgraded') {
              const { data: oldSub } = await supabaseClient
                .from('subscriptions')
                .select('plan_name, amount')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()
              
              if (oldSub) {
                emailData.variables.old_plan_name = oldSub.plan_name || ''
                emailData.variables.old_amount = oldSub.amount ? `${oldSub.amount}€` : ''
              }
            }

            // Call send-emails edge function
            const emailResponse = await fetch(
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

            if (!emailResponse.ok) {
              console.error('Failed to send subscription email:', await emailResponse.text())
            } else {
              console.log(`Subscription email sent immediately: ${emailType} for user ${userId}`)
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending subscription email:', emailError)
        // Don't fail the main operation if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          id: result.id,
          status: result.status,
          cancel_at_period_end: result.cancel_at_period_end,
          current_period_end: result.current_period_end,
          plan: result.items?.data[0]?.price?.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin subscription update error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to update subscription in Stripe' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})