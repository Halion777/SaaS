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

    // Get global follow-up rules (no user_id dependency)
    let { data: globalRules, error: rulesErr } = await admin
      .from('quote_follow_up_rules')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (rulesErr || !globalRules) {
      console.warn('No global follow-up rules found, using defaults');
      // Use default values if no rules exist
      globalRules = {
        max_stages: 3,
        stage_1_delay: 0,  // INSTANT
        stage_2_delay: 1,  // 1 day
        stage_3_delay: 3,  // 3 days
        max_attempts_per_stage: 2,
        instant_view_followup: true,
        view_followup_template: 'viewed_instant',
        sent_followup_template: 'followup_not_viewed'
      };
    }

    // Process quotes that need follow-up based on behavior
    const { data: quotesNeedingFollowUp, error: qErr } = await admin
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
      .in('status', ['sent', 'viewed'])
      .neq('status', 'accepted')
      .neq('status', 'rejected')
      .limit(1000)
    
    if (qErr) throw qErr

    for (const quote of quotesNeedingFollowUp || []) {
      // Check if quote needs follow-up based on behavior rules
      const needsFollowUp = await checkIfQuoteNeedsFollowUp(admin, quote, globalRules)
      
      if (needsFollowUp) {
        // Create intelligent follow-up based on quote status and behavior
        await createIntelligentFollowUp(admin, quote, globalRules)
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
async function checkIfQuoteNeedsFollowUp(admin: any, quote: any, rules: any): Promise<boolean> {
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
    
    // For 'viewed' status - instant follow-up if enabled
    if (quote.status === 'viewed' && rules.instant_view_followup) {
      return true; // Send immediate follow-up when viewed
    }
    
    // For 'sent' status - check delay for unopened emails
    if (quote.status === 'sent') {
      if (quote.sent_at) {
        const daysSinceSent = Math.floor((Date.now() - new Date(quote.sent_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceSent >= rules.stage_2_delay; // Follow-up after configured delay
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
async function createIntelligentFollowUp(admin: any, quote: any, rules: any) {
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
    
    // Check if follow-up already exists for this quote
    const { data: existingFollowUp, error: checkError } = await admin
      .from('quote_follow_ups')
      .select('id')
      .eq('quote_id', quote.id)
      .eq('status', 'scheduled')
      .maybeSingle();
    
    if (checkError) {
      console.warn('Error checking existing follow-up:', checkError);
      return;
    }
    
    if (existingFollowUp) {
      console.log(`Follow-up already scheduled for quote ${quote.quote_number}`);
      return;
    }
    
    // Determine follow-up type and stage based on quote status
    let followUpType = 'general';
    let stage = 1;
    let templateType = rules.view_followup_template || 'viewed_instant';
    let scheduledAt = new Date().toISOString(); // Default to immediate
    
    if (quote.status === 'viewed') {
      // Client viewed - instant follow-up
      followUpType = 'viewed_instant';
      stage = 1; // Stage 1: Client just viewed
      templateType = rules.view_followup_template || 'viewed_instant';
      scheduledAt = new Date().toISOString(); // Send IMMEDIATELY
    } else if (quote.status === 'sent') {
      // Client hasn't opened/viewed the quote
      followUpType = 'email_not_opened';
      stage = 2; // Stage 2: Email not opened
      templateType = rules.sent_followup_template || 'followup_not_viewed';
      
      // Calculate scheduled time based on delay
      if (quote.sent_at) {
        const scheduledDate = new Date(quote.sent_at);
        scheduledDate.setDate(scheduledDate.getDate() + rules.stage_2_delay);
        scheduledAt = scheduledDate.toISOString();
      }
    }
    
    // Get template from email_templates
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .maybeSingle();
    
    let subject, html, text;
    
    if (templateError || !template) {
      // Fallback to hardcoded templates if database template not found
      console.warn(`Template ${templateType} not found, using fallback`);
      subject = `Devis ${quote.quote_number} - Relance`;
      text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous vous rappelons notre devis ${quote.quote_number} pour votre projet "${quote.title}".\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nVotre équipe`;
      html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous vous rappelons notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p><p>N'hésitez pas à nous contacter si vous avez des questions.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
    } else {
      // Use database template with variable replacement
      subject = template.subject
        .replace('{quote_number}', quote.quote_number)
        .replace('{client_name}', client.name || 'Madame, Monsieur')
        .replace('{quote_title}', quote.title || 'votre projet');
      
      text = template.text_content
        .replace('{quote_number}', quote.quote_number)
        .replace('{client_name}', client.name || 'Madame, Monsieur')
        .replace('{quote_title}', quote.title || 'votre projet');
      
      html = template.html_content
        .replace('{quote_number}', quote.quote_number)
        .replace('{client_name}', client.name || 'Madame, Monsieur')
        .replace('{quote_title}', quote.title || 'votre projet');
    }
    
    // Create the follow-up record
    const { error: followUpError } = await admin
      .from('quote_follow_ups')
      .insert({
        quote_id: quote.id,
        user_id: quote.user_id,
        client_id: quote.client_id,
        stage: stage,
        status: 'scheduled',
        scheduled_at: scheduledAt,
        template_subject: subject,
        template_text: text,
        template_html: html,
        attempts: 0,
        max_attempts: rules.max_attempts_per_stage || 3,
        channel: 'email',
        meta: {
          follow_up_type: followUpType,
          automated: true,
          created_at: new Date().toISOString(),
          behavior_based: true,
          quote_status: quote.status,
          instant_followup: quote.status === 'viewed',
          template_type: templateType
        }
      });
    
    if (followUpError) {
      console.error('Error creating intelligent follow-up:', followUpError);
    } else {
      console.log(`Created intelligent follow-up for quote ${quote.quote_number}, stage: ${stage}, type: ${followUpType}, scheduled: ${scheduledAt}`);
    }
  } catch (error) {
    console.error('Error creating intelligent follow-up:', error);
  }
}


