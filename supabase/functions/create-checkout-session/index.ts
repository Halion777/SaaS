// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@14.21.0';
// @ts-ignore
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia'
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Helper function to convert arrays to strings for Stripe metadata
const convertToString = (value)=>{
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value || '');
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Check for authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({
      error: 'Missing authorization header'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const body = await req.json();
    const { planType, billingCycle, userId, successUrl, cancelUrl } = body;
    // Validate required parameters
    if (!planType || !billingCycle || !userId) {
      throw new Error(`Missing required parameters. Received: planType=${planType}, billingCycle=${billingCycle}, userId=${userId}`);
    }
    // Get user from Supabase
    // @ts-ignore
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // Create service role client for admin operations
    // @ts-ignore
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // First try to get user from public.users table
    let { data: user, error: userError } = await supabaseClient.from('users').select('*').eq('id', userId).single();
    // If user doesn't exist in public.users, get from auth.users
    if (userError && userError.code === 'PGRST116') {
      // Get user from auth.users using service role
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authError || !authData?.user) {
        throw new Error(`User not found in auth: ${authError?.message || 'Unknown error'}`);
      }
      // Create a temporary user object from auth data
      // The actual user record will be created after successful payment
      user = {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name || 'Unknown',
        company_name: authData.user.user_metadata?.company_name || '',
        phone: authData.user.user_metadata?.phone || '',
        profession: authData.user.user_metadata?.profession || '',
        country: authData.user.user_metadata?.country || 'FR',
        business_size: authData.user.user_metadata?.business_size || '',
        selected_plan: authData.user.user_metadata?.selected_plan || 'starter',
        subscription_status: 'trial',
        trial_start_date: new Date().toISOString(),
        stripe_customer_id: null // Will be set below
      };
    } else if (userError) {
      throw new Error(`User lookup failed: ${userError.message}`);
    }
    // Define plan prices based on plan type and billing cycle
    
    const planPrices = {
      starter: {
        // @ts-ignore
        monthly: Deno.env.get('STRIPE_STARTER_MONTHLY_PRICE_ID'),
        // @ts-ignore
        yearly: Deno.env.get('STRIPE_STARTER_YEARLY_PRICE_ID')
      },
      pro: {
        // @ts-ignore
        monthly: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID'), 
        // @ts-ignore
        yearly: Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID')
      }
    };
    const priceId = planPrices[planType]?.[billingCycle];
    if (!priceId) {
      throw new Error(`Invalid plan type (${planType}) or billing cycle (${billingCycle})`);
    }
    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;
      // Update user with Stripe customer ID
      await supabaseClient.from('users').update({
        stripe_customer_id: customerId
      }).eq('id', userId);
    }
    // Create checkout session WITH 14-DAY TRIAL
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: [
        'card'
      ],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      locale: 'en',
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: userId,
          planType: planType,
          billingCycle: billingCycle,
          email: convertToString(user.email),
          fullName: convertToString(user.full_name),
          companyName: convertToString(user.company_name),
          vatNumber: convertToString(user.vat_number),
          phone: convertToString(user.phone),
          profession: convertToString(user.profession),
          country: convertToString(user.country),
          businessSize: convertToString(user.business_size)
        }
      },
      // @ts-ignore
      success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:4028'}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        planType: planType,
        billingCycle: billingCycle,
        email: convertToString(user.email),
        fullName: convertToString(user.full_name),
        companyName: convertToString(user.company_name),
        vatNumber: convertToString(user.vat_number),
        phone: convertToString(user.phone),
        profession: convertToString(user.profession),
        country: convertToString(user.country),
        businessSize: convertToString(user.business_size)
      }
    });
    return new Response(JSON.stringify({
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
