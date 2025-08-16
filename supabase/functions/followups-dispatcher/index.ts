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

// Minimal email sender using Resend (or no-op if missing key)
async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
  if (!RESEND_API_KEY) {
    // No provider configured; simulate success
    return { id: 'simulated', status: 'sent' }
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html, text })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Resend error: ${resp.status} ${err}`)
  }
  return await resp.json()
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

    // Find due follow-ups
    const nowIso = new Date().toISOString()
    const { data: dueFollowUps, error: dueErr } = await admin
      .from('quote_follow_ups')
      .select('id, quote_id, user_id, client_id, stage, template_subject, template_html, template_text')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_at', nowIso)
      .limit(100)
    if (dueErr) throw dueErr

    // Process at most one follow-up per quote at a time
    const processedQuotes = new Set<string>();
    for (const fu of dueFollowUps || []) {
      if (processedQuotes.has(String(fu.quote_id))) {
        // Skip duplicates for the same quote in this run
        continue;
      }
      // Get destination email
      const { data: quote, error: qErr } = await admin
        .from('quotes')
        .select('id, user_id, client_id, quote_number, title, valid_until')
        .eq('id', fu.quote_id)
        .single()
      if (qErr || !quote) { continue }

      const { data: client, error: cErr } = await admin
        .from('clients')
        .select('email, name')
        .eq('id', quote.client_id)
        .single()
      if (cErr || !client?.email) {
        // Mark failed
        await admin.from('quote_follow_ups').update({ status: 'failed', last_error: 'Missing client email' }).eq('id', fu.id)
        continue
      }

      const subject = fu.template_subject || `Relance devis ${quote.quote_number}`
      const text = fu.template_text || `Bonjour ${client.name || ''},\n\nAvez-vous eu le temps de consulter notre devis ${quote.quote_number} ?\n\nCordialement.`
      const html = fu.template_html || `<p>Bonjour ${client.name || ''},</p><p>Avez-vous eu le temps de consulter notre devis <strong>${quote.quote_number}</strong> ?</p><p>Cordialement.</p>`

      try {
        // Enqueue outbox record
        const { data: outbox, error: obErr } = await admin
          .from('email_outbox')
          .insert({ follow_up_id: fu.id, user_id: fu.user_id, to_email: client.email, subject, html, text, status: 'sending' })
          .select()
          .single()
        if (obErr) throw obErr

        // Send via provider
        const resp = await sendEmail({ to: client.email, subject, html, text })

        // Mark outbox and follow-up as sent
        await admin.from('email_outbox').update({ status: 'sent', provider_message_id: resp.id, sent_at: new Date().toISOString() }).eq('id', outbox.id)
        await admin.from('quote_follow_ups').update({ status: 'sent', attempts: (1) }).eq('id', fu.id)
        processedQuotes.add(String(fu.quote_id))
        await admin.from('quote_events').insert({ quote_id: fu.quote_id, user_id: fu.user_id, type: 'followup_sent', meta: { stage: fu.stage } })
      } catch (err: any) {
        await admin.from('email_outbox').insert({ follow_up_id: fu.id, user_id: fu.user_id, to_email: client.email, subject, html, text, status: 'failed', error: err?.message || 'send failed' })
        await admin.from('quote_follow_ups').update({ status: 'failed', last_error: err?.message || 'send failed' }).eq('id', fu.id)
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: dueFollowUps?.length || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


