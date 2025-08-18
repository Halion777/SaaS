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

    // Schedule stage-1 follow-ups for quotes that are sent but have no ACTIVE follow-ups yet
    // Use enhanced tracking logic to determine which quotes need follow-ups
    const { data: quotes, error: qErr } = await admin
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
      .eq('status', 'sent')
      .not('sent_at', 'is', null) // Only quotes that have actually been sent
      .limit(1000)
    if (qErr) throw qErr

    for (const q of quotes || []) {
      // Check if quote already has active follow-ups
      const { count, error: fuErr } = await admin
        .from('quote_follow_ups')
        .select('id', { count: 'exact', head: true })
        .eq('quote_id', q.id)
        .in('status', ['pending', 'scheduled'])
      if (fuErr) throw fuErr
      
      if ((count || 0) === 0) {
        // Check if quote needs follow-up based on tracking data
        const needsFollowUp = await checkIfQuoteNeedsFollowUp(admin, q)
        
        if (needsFollowUp) {
          // Create intelligent follow-up based on tracking status
          await createIntelligentFollowUp(admin, q)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})

/**
 * Check if a quote needs follow-up based on tracking data
 */
async function checkIfQuoteNeedsFollowUp(admin: any, quote: any): Promise<boolean> {
  try {
    const now = new Date();
    
    // Check if quote is expired
    if (quote.valid_until && new Date(quote.valid_until) < now) {
      return false; // Don't follow up on expired quotes
    }
    
    // Check if quote was sent recently (within last 2 days)
    if (quote.sent_at) {
      const sentDate = new Date(quote.sent_at);
      const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceSent < 2) {
        return false; // Too early for follow-up
      }
    }
    
    // Check access logs to see if client has viewed the quote
    const { data: accessLogs, error: logsError } = await admin
      .from('quote_access_logs')
      .select('action, accessed_at')
      .eq('quote_id', quote.id)
      .order('accessed_at', { ascending: false })
      .limit(1);
    
    if (logsError) {
      console.warn('Error checking access logs for quote', quote.id, logsError);
      // If we can't check logs, assume follow-up is needed
      return true;
    }
    
    // If no access logs, client hasn't opened the email
    if (!accessLogs || accessLogs.length === 0) {
      return true; // Need follow-up - client hasn't opened
    }
    
    // Check if client viewed but took no action
    const lastAction = accessLogs[0];
    const daysSinceLastAction = Math.floor((now.getTime() - new Date(lastAction.accessed_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (lastAction.action === 'viewed' && daysSinceLastAction >= 3) {
      return true; // Need follow-up - client viewed but no action for 3+ days
    }
    
    return false; // No follow-up needed
  } catch (error) {
    console.error('Error checking if quote needs follow-up:', error);
    return false; // Don't follow up if there's an error
  }
}

/**
 * Create intelligent follow-up based on tracking status
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
    
    // Check access logs to determine follow-up type
    const { data: accessLogs, error: logsError } = await admin
      .from('quote_access_logs')
      .select('action, accessed_at')
      .eq('quote_id', quote.id)
      .order('accessed_at', { ascending: false })
      .limit(1);
    
    let followUpType = 'general';
    let subject = `Devis ${quote.quote_number} - Relance`;
    let text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous vous rappelons notre devis ${quote.quote_number} pour votre projet "${quote.title}".\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nVotre équipe`;
    let html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous vous rappelons notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p><p>N'hésitez pas à nous contacter si vous avez des questions.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
    
    if (!logsError && accessLogs && accessLogs.length > 0) {
      const lastAction = accessLogs[0];
      
      if (lastAction.action === 'viewed') {
        followUpType = 'viewed_no_action';
        subject = `Devis ${quote.quote_number} - Des questions sur notre proposition ?`;
        text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous avons remarqué que vous avez consulté notre devis ${quote.quote_number} pour votre projet "${quote.title}".\n\nAvez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?\n\nNous sommes là pour vous accompagner dans votre décision.\n\nCordialement,\nVotre équipe`;
        html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous avons remarqué que vous avez consulté notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p><p>Avez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?</p><p>Nous sommes là pour vous accompagner dans votre décision.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
      } else {
        followUpType = 'email_not_opened';
        subject = `Devis ${quote.quote_number} - Avez-vous reçu notre proposition ?`;
        text = `Bonjour ${client.name || 'Madame, Monsieur'},\n\nNous avons envoyé notre devis ${quote.quote_number} pour votre projet "${quote.title}" il y a quelques jours.\n\nAvez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nVotre équipe`;
        html = `<p>Bonjour ${client.name || 'Madame, Monsieur'},</p><p>Nous avons envoyé notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong> il y a quelques jours.</p><p>Avez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.</p><p>Nous restons à votre disposition pour toute question.</p><p>Cordialement,<br><strong>Votre équipe</strong></p>`;
      }
    }
    
    // Create the follow-up record
    const { error: followUpError } = await admin
      .from('quote_follow_ups')
      .insert({
        quote_id: quote.id,
        user_id: quote.user_id,
        client_id: quote.client_id,
        stage: 1,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(), // Send immediately
        template_subject: subject,
        template_text: text,
        template_html: html,
        meta: {
          follow_up_type: followUpType,
          automated: true,
          created_at: new Date().toISOString()
        }
      });
    
    if (followUpError) {
      console.error('Error creating intelligent follow-up:', followUpError);
    } else {
      console.log(`Created intelligent follow-up for quote ${quote.quote_number}, type: ${followUpType}`);
    }
  } catch (error) {
    console.error('Error creating intelligent follow-up:', error);
  }
}


