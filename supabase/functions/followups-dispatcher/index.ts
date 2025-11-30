// @ts-ignore
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Minimal email sender using Resend (or no-op if missing key)
async function sendEmail({ to, subject, html, text }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  if (!RESEND_API_KEY) {
    // No provider configured; simulate success
    return {
      id: 'simulated',
      status: 'sent'
    };
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [
        to
      ],
      subject,
      html,
      text
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Resend error: ${resp.status} ${err}`);
  }
  return await resp.json();
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // ========================================
    // 1. FIND DUE FOLLOW-UPS
    // ========================================
    const nowIso = new Date().toISOString();
    const { data: dueFollowUps, error: dueErr } = await admin.from('quote_follow_ups').select(`
        id, quote_id, user_id, client_id, stage, 
        template_subject, template_html, template_text,
        meta, created_at, attempts, max_attempts, status
      `).in('status', [
      'pending',
      'scheduled',
      'ready_for_dispatch'
    ]).lte('scheduled_at', nowIso).order('meta->priority', {
      ascending: false
    }) // High priority first
    .limit(100);
    if (dueErr) throw dueErr;
    // ========================================
    // 2. PROCESS FOLLOW-UPS BY PRIORITY
    // ========================================
    const processedQuotes = new Set();
    const results = {
      high_priority: 0,
      medium_priority: 0,
      low_priority: 0,
      failed: 0,
      total: dueFollowUps?.length || 0
    };
    for (const fu of dueFollowUps || []){
      if (processedQuotes.has(String(fu.quote_id))) {
        continue;
      }
      try {
        const result = await processFollowUp(admin, fu);
        if (result.success) {
          // Use meta column for priority if available, otherwise default to medium
          const priority = fu.meta?.priority || 'medium';
          switch(priority){
            case 'high':
              results.high_priority++;
              break;
            case 'medium':
              results.medium_priority++;
              break;
            case 'low':
              results.low_priority++;
              break;
          }
          processedQuotes.add(String(fu.quote_id));
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Error processing follow-up ${fu.id}:`, error);
        results.failed++;
      }
    }
    // ========================================
    // 3. RETURN RESULTS
    // ========================================
    return new Response(JSON.stringify({
      ok: true,
      processed: processedQuotes.size,
      results,
      timestamp: nowIso
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: e?.message || 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
/**
 * Process a single follow-up
 */ async function processFollowUp(admin, followUp) {
  try {
    // ========================================
    // 1. GET QUOTE AND CLIENT DETAILS
    // ========================================
    const { data: quote, error: qErr } = await admin.from('quotes').select('id, user_id, client_id, quote_number, title, valid_until, status, sent_at, share_token').eq('id', followUp.quote_id).single();
    if (qErr || !quote) {
      console.error('Quote not found for follow-up:', followUp.id);
      return {
        success: false,
        error: 'Quote not found'
      };
    }
    // Check if quote is still valid for follow-up
    if (quote.status === 'accepted' || quote.status === 'rejected') {
      console.log(`Quote ${quote.quote_number} is ${quote.status}, stopping follow-ups`);
      await stopFollowUpsForQuote(admin, quote.id);
      return {
        success: false,
        error: 'Quote finalized'
      };
    }
    // Check if quote is expired
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      console.log(`Quote ${quote.quote_number} is expired, stopping follow-ups`);
      await stopFollowUpsForQuote(admin, quote.id);
      return {
        success: false,
        error: 'Quote expired'
      };
    }
    const { data: client, error: cErr } = await admin.from('clients').select('email, name, language_preference').eq('id', quote.client_id).single();
    if (cErr || !client?.email) {
      // Mark failed
      await admin.from('quote_follow_ups').update({
        status: 'failed',
        last_error: 'Missing client email'
      }).eq('id', followUp.id);
      return {
        success: false,
        error: 'Missing client email'
      };
    }
    // Get client's language preference (default to 'fr')
    // Note: Templates are already stored in follow-up record, but we capture language for logging
    const clientLanguage = (client.language_preference || 'fr').split('-')[0] || 'fr';
    // ========================================
    // 2. PREPARE EMAIL CONTENT WITH VARIABLE REPLACEMENT
    // ========================================
    // Calculate additional template variables
    const daysSinceSent = (()=>{
      if (quote.sent_at) {
        const sentDate = new Date(quote.sent_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - sentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 1; // Default to 1 day if no sent_at
    })();
    // Build quote link - use share_token if available, otherwise use quote ID
    // Use SITE_URL from environment variables for proper domain
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.haliqo.com';
    const quoteLink = `${siteUrl}/quote-share/${quote.share_token || quote.id}`;
    const companyName = 'Haliqo'; // This should come from user settings or company table
    // Replace template variables in all content
    const replaceTemplateVariables = (content)=>{
      return content.replace(/\{quote_number\}/g, quote.quote_number).replace(/\{client_name\}/g, client.name || 'Madame, Monsieur').replace(/\{quote_title\}/g, quote.title || 'votre projet').replace(/\{days_since_sent\}/g, daysSinceSent.toString()).replace(/\{quote_link\}/g, quoteLink).replace(/\{company_name\}/g, companyName);
    };
    const subject = replaceTemplateVariables(followUp.template_subject || `Relance devis ${quote.quote_number}`);
    const text = replaceTemplateVariables(followUp.template_text || `Bonjour ${client.name || ''},\n\nAvez-vous eu le temps de consulter notre devis ${quote.quote_number} ?\n\nCordialement.`);
    const html = replaceTemplateVariables(followUp.template_html || `<p>Bonjour ${client.name || ''},</p><p>Avez-vous eu le temps de consulter notre devis <strong>${quote.quote_number}</strong> ?</p><p>Cordialement.</p>`);
    // ========================================
    // 3. SEND EMAIL
    // ========================================
    try {
      // Enqueue outbox record
      const { data: outbox, error: obErr } = await admin.from('email_outbox').insert({
        follow_up_id: followUp.id,
        user_id: followUp.user_id,
        to_email: client.email,
        subject,
        html,
        text,
        status: 'sending',
        email_type: followUp.meta?.follow_up_type || 'general_followup'
      }).select().single();
      if (obErr) throw obErr;
      // Send via provider
      const resp = await sendEmail({
        to: client.email,
        subject,
        html,
        text
      });
      // ========================================
      // 4. UPDATE FOLLOW-UP STATUS
      // ========================================
      await admin.from('email_outbox').update({
        status: 'sent',
        provider_message_id: resp.id,
        sent_at: new Date().toISOString()
      }).eq('id', outbox.id);
      // Update follow-up status and increment attempts
      const newAttempts = (followUp.attempts || 0) + 1;
      const maxAttempts = followUp.max_attempts || 3;
      console.log(`Incrementing attempts for follow-up ${followUp.id}: ${followUp.attempts || 0} → ${newAttempts}/${maxAttempts}`);
      // Check if we need to reschedule for next attempt within same stage
      if (newAttempts < maxAttempts) {
        // Reschedule for next attempt (1 day delay between attempts)
        const nextScheduledAt = new Date();
        nextScheduledAt.setDate(nextScheduledAt.getDate() + 1); // 1 day delay
        const { error: updateError } = await admin.from('quote_follow_ups').update({
          status: 'scheduled',
          attempts: newAttempts,
          scheduled_at: nextScheduledAt.toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', followUp.id);
        if (updateError) {
          console.error('Error updating follow-up status:', updateError);
        } else {
          console.log(`✅ Rescheduled follow-up ${followUp.id} for next attempt (${newAttempts + 1}/${maxAttempts}) on ${nextScheduledAt.toISOString()}`);
        }
      } else {
        // Max attempts reached, mark as sent - scheduler will handle stage progression on next run
        const { error: updateError } = await admin.from('quote_follow_ups').update({
          status: 'sent',
          attempts: newAttempts,
          updated_at: new Date().toISOString()
        }).eq('id', followUp.id);
        if (updateError) {
          console.error('Error updating follow-up status:', updateError);
        } else {
          console.log(`✅ Follow-up ${followUp.id} reached max attempts (${newAttempts}/${maxAttempts}), will progress to next stage on scheduler run`);
        }
      }
      // ========================================
      // 5. LOG EVENTS
      // ========================================
      const eventMeta = {
        stage: followUp.stage,
        follow_up_id: followUp.id,
        follow_up_type: followUp.meta?.follow_up_type || 'general',
        automated: followUp.meta?.automated || false,
        template_subject: followUp.template_subject,
        client_email: client.email,
        instant_followup: followUp.meta?.instant_followup || false,
        attempts: newAttempts,
        priority: followUp.meta?.priority || 'medium' // Use meta for priority
      };
      await admin.from('quote_events').insert({
        quote_id: followUp.quote_id,
        user_id: followUp.user_id,
        type: 'followup_sent',
        meta: eventMeta,
        timestamp: new Date().toISOString()
      });
      // Note: Event already logged above, no need for duplicate insert
      return {
        success: true,
        data: {
          quote_number: quote.quote_number,
          client_email: client.email
        }
      };
    } catch (err) {
      const errorMessage = err?.message || 'send failed';
      // ========================================
      // 6. HANDLE FAILURES
      // ========================================
      // Log failed outbox
      await admin.from('email_outbox').insert({
        follow_up_id: followUp.id,
        user_id: followUp.user_id,
        to_email: client.email,
        subject,
        html,
        text,
        status: 'failed',
        error: errorMessage
      });
      // Update follow-up status
      const newAttempts = (followUp.attempts || 0) + 1;
      console.log(`Incrementing failed attempts for follow-up ${followUp.id}: ${followUp.attempts || 0} → ${newAttempts}/${followUp.max_attempts || 3}`);
      await admin.from('quote_follow_ups').update({
        status: 'failed',
        last_error: errorMessage,
        last_attempt: new Date().toISOString(),
        attempts: newAttempts
      }).eq('id', followUp.id);
      // Log failure event
      await admin.from('quote_events').insert({
        quote_id: followUp.quote_id,
        user_id: followUp.user_id,
        type: 'followup_failed',
        meta: {
          stage: followUp.stage,
          follow_up_id: followUp.id,
          error: errorMessage,
          follow_up_type: followUp.meta?.follow_up_type || 'general',
          attempts: newAttempts
        },
        timestamp: new Date().toISOString()
      });
      console.error(`Failed to send follow-up for quote ${quote.quote_number}: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('Error processing follow-up:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
/**
 * Stop all follow-ups for a quote
 */ async function stopFollowUpsForQuote(admin, quoteId) {
  try {
    const { error } = await admin.from('quote_follow_ups').update({
      status: 'stopped',
      updated_at: new Date().toISOString()
    }).eq('quote_id', quoteId).in('status', [
      'pending',
      'scheduled'
    ]);
    if (error) {
      console.error('Error stopping follow-ups for quote:', error);
    } else {
      console.log(`Stopped all follow-ups for quote ${quoteId}`);
    }
  } catch (error) {
    console.error('Error stopping follow-ups:', error);
  }
}