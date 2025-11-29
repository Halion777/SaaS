// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
        // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user exists in auth.users (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim()
    
    // Try to get user by email with exact match first
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Get all users for now - can optimize later
    })

    if (authError || !authUsers?.users) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to check user existence' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find user with case-insensitive email match
    const authUser = authUsers.users.find(user => 
      user.email && user.email.toLowerCase().trim() === normalizedEmail
    )

    if (!authUser) {
      // User doesn't exist in auth, can register (new user - eligible for trial)
      return new Response(
        JSON.stringify({ 
          canRegister: true,
          userExists: false,
          registrationComplete: false,
          hasUsedTrial: false
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // User exists in auth, check full user data including subscription history
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, registration_completed, has_used_trial, subscription_status')
      .eq('id', authUser.id)
      .single()

    
    if (userError || !userData) {
      // User exists in auth but not in public.users (incomplete registration)
      return new Response(
        JSON.stringify({ 
          canRegister: true,
          userExists: true,
          registrationComplete: false,
          hasUsedTrial: false,
          userId: authUser.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has already used a trial (to prevent multiple free trials)
    const hasUsedTrial = userData.has_used_trial === true
    
    // Also check subscription history for past trials
    const { data: subscriptionHistory } = await supabaseClient
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', authUser.id)
      .limit(1)
    
    const hasSubscriptionHistory = subscriptionHistory && subscriptionHistory.length > 0

    if (userData.registration_completed) {
      // User has completed registration - check if they can register again
      // They CANNOT register again (should login instead)
      console.log('User has completed registration - blocking registration');
      return new Response(
        JSON.stringify({ 
          canRegister: false,
          userExists: true,
          registrationComplete: true,
          hasUsedTrial: hasUsedTrial || hasSubscriptionHistory,
          message: 'An account with this email already exists. Please log in to manage your subscription.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // User exists but registration not complete
    console.log('User exists but registration not complete - allowing registration');
    return new Response(
      JSON.stringify({ 
        canRegister: true,
        userExists: true,
        registrationComplete: false,
        hasUsedTrial: hasUsedTrial || hasSubscriptionHistory,
        userId: authUser.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error checking user registration:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
