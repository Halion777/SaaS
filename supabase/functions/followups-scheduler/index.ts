// @ts-ignore
declare const Deno: any;
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For each user, ensure a default rule exists
    // Create missing rules for users who have quotes but no rules
    const { data: usersWithQuotes, error: uqErr } = await admin
      .from('quotes')
      .select('user_id')
      .neq('status', 'accepted')
      .neq('status', 'rejected')
      .neq('status', 'expired')
      .limit(1000)
    if (uqErr) throw uqErr

    const uniqueUserIds = Array.from(new Set((usersWithQuotes || []).map((q: any) => q.user_id)))
    for (const userId of uniqueUserIds) {
      const { data: existing, error: ruleErr } = await admin
        .from('quote_follow_up_rules')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (ruleErr) throw ruleErr
      if (!existing) {
        await admin.from('quote_follow_up_rules').insert({ user_id: userId })
      }
    }

    // Schedule stage-1 follow-ups for quotes that are sent but have no follow-ups yet
    const { data: quotes, error: qErr } = await admin
      .from('quotes')
      .select('id, user_id')
      .eq('status', 'sent')
      .limit(1000)
    if (qErr) throw qErr

    for (const q of quotes || []) {
      const { count, error: fuErr } = await admin
        .from('quote_follow_ups')
        .select('id', { count: 'exact', head: true })
        .eq('quote_id', q.id)
      if (fuErr) throw fuErr
      if ((count || 0) === 0) {
        const { error: rpcErr } = await admin.rpc('create_follow_up_for_quote', { p_quote_id: q.id, p_stage: 1 })
        if (rpcErr) throw rpcErr
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


