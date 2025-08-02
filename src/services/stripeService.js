import { supabase } from './supabaseClient';

/**
 * Create Stripe checkout session for subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<{data, error}>} Stripe session data
 */
export async function createCheckoutSession(subscriptionData) {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planType: subscriptionData.planType,
        billingCycle: subscriptionData.billingCycle,
        userId: subscriptionData.userId,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/register?step=3&canceled=true`
      }
    });

    return { data, error };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error };
  }
}

/**
 * Create Stripe customer portal session
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Portal session data
 */
export async function createPortalSession(userId) {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        userId: userId,
        returnUrl: `${window.location.origin}/dashboard`
      }
    });

    return { data, error };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { error };
  }
}

/**
 * Get subscription status
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Subscription data
 */
export async function getSubscriptionStatus(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_status, stripe_subscription_id, trial_end_date, selected_plan')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { error };
  }
}

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<{data, error}>} Cancellation result
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscriptionId: subscriptionId
      }
    });

    return { data, error };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { error };
  }
} 