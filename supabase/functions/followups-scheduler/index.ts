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

    // Process quotes in stage 0 (initial stage) to determine next follow-up based on behavior
    const { data: stage0Quotes, error: qErr } = await admin
      .from('quote_follow_ups')
      .select(`
        id,
        quote_id,
        stage,
        status,
        meta
      `)
      .eq('stage', 0)
      .eq('status', 'pending')
      .limit(1000)
    if (qErr) throw qErr

    for (const followUp of stage0Quotes || []) {
      // Get quote details
      const { data: quote, error: quoteErr } = await admin
        .from('quotes')
        .select(`
          id, 
          user_id, 
          client_id,
          quote_number,
          title,
          status,
          created_at,
          sent_at,
          valid_until
        `)
        .eq('id', followUp.quote_id)
        .single()
      
      if (quoteErr || !quote) {
        console.warn('Could not get quote details for follow-up', followUp.id);
        continue;
      }
      
      // Check if quote needs follow-up based on tracking data and behavior rules
      const needsFollowUp = await checkIfQuoteNeedsFollowUp(admin, quote)
      
      if (needsFollowUp) {
        // Create intelligent follow-up based on tracking status and behavior
        await createIntelligentFollowUp(admin, quote)
        
        // Mark stage 0 follow-up as completed
        await admin
          .from('quote_follow_ups')
          .update({ 
            status: 'completed',
            meta: { 
              ...followUp.meta,
              completed_at: new Date().toISOString(),
              next_stage_created: true
            }
          })
          .eq('id', followUp.id)
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})

/**
 * Check if a quote needs follow-up based on quote status and behavior rules
 */
async function checkIfQuoteNeedsFollowUp(admin: any, quote: any): Promise<boolean> {
  try {
    // Check if quote is expired based on valid_until date
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      return false; // Don't follow up on expired quotes
    }
    
    // Check current quote status - no follow-up if accepted/rejected
    if (quote.status === 'accepted' || quote.status === 'rejected') {
      return false; // No relance for accepted/rejected quotes
    }
    
    // Only follow up on quotes with status 'sent' or 'viewed'
    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      return false; // Only follow up on sent/viewed quotes
    }
    
    // For 'sent' status - client hasn't opened the email
    if (quote.status === 'sent') {
      return true; // Need follow-up - client hasn't opened
    }
    
    // For 'viewed' status - client viewed but no action taken
    if (quote.status === 'viewed') {
      // Check if enough time has passed since sent_at
      if (quote.sent_at) {
        const daysSinceSent = Math.floor((Date.now() - new Date(quote.sent_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceSent >= 3; // Follow-up after 3 days of no action
      }
      return true; // If no sent_at, allow follow-up
    }
    
    return false; // No follow-up needed
    
  } catch (error) {
    console.error('Error checking if quote needs follow-up:', error);
    return false; // Don't follow up if there's an error
  }
}

/**
 * Create intelligent follow-up based on quote status and behavior
 */
async function createIntelligentFollowUp(admin: any, quote: any) {
  try {
    // Get client details
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('name, email')
      .eq('id', quote.client_id)
      .single();
    
    if (clientError || !client) {
      console.warn('Could not get client details for quote', quote.id);
      return;
    }
    
    // Determine follow-up type and stage based on quote status
    let followUpType = 'general';
    let stage = 1;
    let subject = `Devis ${quote.quote_number} - Relance`;
    let text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous vous rappelons notre devis ${quote.quote_number} pour votre projet "${quote.title}".\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nVotre équipe`;
    let html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous vous rappelons notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p><p>N'hésitez pas à nous contacter si vous avez des questions.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
    
    if (quote.status === 'viewed') {
      // Client viewed but no action taken
      followUpType = 'viewed_no_action';
      stage = 2; // Stage 2: Client viewed but no action
      subject = `Devis ${quote.quote_number} - Des questions sur notre proposition ?`;
      text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous avons remarqué que vous avez consulté notre devis ${quote.quote_number} pour votre projet "${quote.title}".\n\nAvez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?\n\nNous sommes là pour vous accompagner dans votre décision.\n\nCordialement,\nVotre équipe`;
      html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous avons remarqué que vous avez consulté notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p><p>Avez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?</p><p>Nous sommes là pour vous accompagner dans votre décision.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
    } else if (quote.status === 'sent') {
      // Client hasn't opened/viewed the quote
      followUpType = 'email_not_opened';
      stage = 1; // Stage 1: Email not opened
      subject = `Devis ${quote.quote_number} - Avez-vous reçu notre proposition ?`;
      text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous avons envoyé notre devis ${quote.quote_number} pour votre projet "${quote.title}" il y a quelques jours.\n\nAvez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nVotre équipe`;
      html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous avons envoyé notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong> il y a quelques jours.</p><p>Avez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.</p><p>Nous restons à votre disposition pour toute question.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
    }
    
    // Create the follow-up record with proper template columns
    const { error: followUpError } = await admin
      .from('quote_follow_ups')
      .insert({
        quote_id: quote.id,
        user_id: quote.user_id,
        client_id: quote.client_id,
        stage: stage,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(), // Send immediately
        template_subject: subject,
        template_text: text,
        template_html: html,
        attempts: 0,
        max_attempts: 3,
        channel: 'email',
        meta: {
          follow_up_type: followUpType,
          automated: true,
          created_at: new Date().toISOString(),
          behavior_based: true,
          quote_status: quote.status
        }
      });
    
    if (followUpError) {
      console.error('Error creating intelligent follow-up:', followUpError);
    } else {
      console.log(`Created intelligent follow-up for quote ${quote.quote_number}, stage: ${stage}, type: ${followUpType}`);
    }
  } catch (error) {
    console.error('Error creating intelligent follow-up:', error);
  }
}


