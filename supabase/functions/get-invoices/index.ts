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
    const { userId, limit = 10 } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !userData?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Stripe customer found for this user',
          invoices: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerId = userData.stripe_customer_id

    // Check if customer ID is valid (not a placeholder)
    if (customerId.includes('placeholder') || customerId.includes('temp_')) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          invoices: [],
          message: 'No billing history available yet'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit,
      expand: ['data.subscription']
    })

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_due: invoice.amount_due / 100, // Convert from cents
      amount_paid: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      created: invoice.created * 1000, // Convert to milliseconds
      due_date: invoice.due_date ? invoice.due_date * 1000 : null,
      paid_at: invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : null,
      period_start: invoice.period_start * 1000,
      period_end: invoice.period_end * 1000,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      description: invoice.description || `Invoice for ${invoice.lines?.data?.[0]?.description || 'subscription'}`,
      subscription_id: invoice.subscription
    }))

    // Also get upcoming invoice if subscription is active
    let upcomingInvoice = null
    try {
      const upcoming = await stripe.invoices.retrieveUpcoming({
        customer: customerId
      })
      
      if (upcoming) {
        upcomingInvoice = {
          amount_due: upcoming.amount_due / 100,
          currency: upcoming.currency.toUpperCase(),
          next_payment_attempt: upcoming.next_payment_attempt ? upcoming.next_payment_attempt * 1000 : null,
          period_start: upcoming.period_start * 1000,
          period_end: upcoming.period_end * 1000,
          description: upcoming.lines?.data?.[0]?.description || 'Upcoming subscription payment'
        }
      }
    } catch (upcomingError: any) {
      // No upcoming invoice (subscription might be cancelled or no active subscription)
      console.log('No upcoming invoice:', upcomingError.message)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoices: formattedInvoices,
        upcoming_invoice: upcomingInvoice,
        has_more: invoices.has_more
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Get invoices error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch invoices',
        invoices: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

