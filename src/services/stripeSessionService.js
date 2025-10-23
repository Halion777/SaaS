import { supabase } from './supabaseClient';

/**
 * Retrieve Stripe checkout session data
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{data, error}>} Session data or error
 */
export async function getStripeSession(sessionId) {
  try {
    console.log('Fetching Stripe session data for:', sessionId);

    const { data, error } = await supabase.functions.invoke('get-stripe-session', {
      body: { sessionId }
    });

    if (error) {
      console.error('Error fetching Stripe session:', error);
      return { data: null, error };
    }

    console.log('Stripe session data retrieved:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching Stripe session:', error);
    return { data: null, error };
  }
}

