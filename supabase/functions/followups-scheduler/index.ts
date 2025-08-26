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

// Helper function to calculate priority based on status and stage
const calculatePriority = (status: string, currentStage: number, hasRecent: boolean) => {
  // Higher stages always get high priority regardless of recent activity
  if (currentStage > 1) return 'high';
  
  // For Stage 1, maintain status distinction even with recent activity
  if (status === 'sent') {
    return hasRecent ? 'medium' : 'high'; // Sent quotes stay at least medium priority
  }
  if (status === 'viewed') {
    return hasRecent ? 'low' : 'medium'; // Viewed quotes can go to low priority
  }
  
  return 'medium'; // default
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if this is a frontend-triggered request
    const body = await req.json().catch(() => ({}));
    const { action, quote_id, status } = body;
    
    if (action === 'create_followup_for_quote' && quote_id && status === 'sent') {
      // Frontend request to create follow-up for specific quote
      // Process follow-up creation for quote
      
      // Get the quote details
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(`
          id, user_id, client_id, quote_number, title, status, sent_at, created_at
        `)
        .eq('id', quote_id)
        .eq('status', 'sent')
        .single();
      
      if (quoteError || !quote) {
        console.error('Quote not found or not in sent status:', quoteError);
        return new Response(JSON.stringify({ error: 'Quote not found or not in sent status' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Use hardcoded default rules (no database table needed)
      const globalRules = {
        max_stages: 3,
        stage_1_delay: 1,  // 1 day (24 hours) for unviewed quotes
        stage_2_delay: 3,  // 3 days for second follow-up
        stage_3_delay: 5,  // 5 days for third follow-up
        max_attempts_per_stage: 3, // Consistent with database default
        instant_view_followup: true,
        view_followup_template: 'followup_viewed_no_action',
        sent_followup_template: 'followup_not_viewed'
      };
      
      // Create initial follow-up immediately
      await createInitialFollowUpForSentQuote(admin, quote, globalRules);
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Follow-up created for quote ${quote.quote_number}`,
        quote_id: quote.id
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (action === 'sync_quote_status' && quote_id) {
      // Frontend request to sync quote status with backend
      // Process status sync for quote
      
      // Get the quote details
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(`
          id, status, quote_number, user_id, client_id, valid_until
        `)
        .eq('id', quote_id)
        .single();
      
      if (quoteError || !quote) {
        console.error('Quote not found:', quoteError);
        return new Response(JSON.stringify({ error: 'Quote not found' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check if quote should be expired
      let updatedStatus = quote.status;
      if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
        if (['sent', 'viewed', 'draft'].includes(quote.status)) {
          updatedStatus = 'expired';
          // Update quote status to expired
          await admin
            .from('quotes')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', quote_id);
        }
      }
      
      // Check if quote status should be 'viewed' based on access logs
      if (quote.status === 'sent') {
        const { data: accessLogs, error: logsError } = await admin
          .from('quote_access_logs')
          .select('id')
          .eq('quote_id', quote_id)
          .eq('action', 'viewed')
          .limit(1);
        
        if (!logsError && accessLogs && accessLogs.length > 0) {
          updatedStatus = 'viewed';
          // Update quote status to viewed
          await admin
            .from('quotes')
            .update({ status: 'viewed', updated_at: new Date().toISOString() })
            .eq('id', quote_id);
        }
      }
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Quote status synced`,
        quote_id: quote.id,
        current_status: updatedStatus,
        previous_status: quote.status
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (action === 'cleanup_finalized_quote' && quote_id) {
      // Frontend request to cleanup follow-ups when quote is accepted/rejected
      // Process follow-up cleanup for finalized quote
      
      // Get the quote details
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(`
          id, status, quote_number, user_id, client_id
        `)
        .eq('id', quote_id)
        .in('status', ['accepted', 'rejected', 'expired'])
        .single();
      
      if (quoteError || !quote) {
        console.error('Quote not found or not finalized:', quoteError);
        return new Response(JSON.stringify({ error: 'Quote not found or not finalized' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // IMMEDIATELY STOP ALL PENDING FOLLOW-UPS FOR THIS QUOTE
      const { error: cleanupError } = await admin
        .from('quote_follow_ups')
        .update({ 
          status: 'stopped', 
          updated_at: new Date().toISOString(),
          meta: {
            stopped_reason: 'quote_finalized',
            stopped_at: new Date().toISOString(),
            final_status: quote.status,
            cleanup_triggered_by: 'frontend_request'
          }
        })
        .eq('quote_id', quote_id)
        .in('status', ['pending', 'scheduled']);
      
      if (cleanupError) {
        console.error(`Error cleaning up follow-ups for quote ${quote.quote_number}:`, cleanupError);
        return new Response(JSON.stringify({ error: 'Failed to cleanup follow-ups' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Log the cleanup event
      await admin
        .from('quote_events')
        .insert({
          quote_id: quote.id,
          user_id: quote.user_id,
          type: 'followups_stopped',
          meta: {
            reason: 'quote_finalized',
            final_status: quote.status,
            automated: false,
            triggered_by: 'frontend_request',
            timestamp: new Date().toISOString()
          }
        });
      
      // Stopped all follow-ups for quote
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Follow-ups cleaned up for ${quote.status} quote`,
        quote_id: quote.id,
        status: quote.status,
        cleanup_completed: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (action === 'mark_quote_viewed' && quote_id) {
      // Frontend request to mark quote as viewed
      // Process marking quote as viewed
      
      // Get the quote details
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(`
          id, status, quote_number, user_id, client_id
        `)
        .eq('id', quote_id)
        .single();
      
      if (quoteError || !quote) {
        console.error('Quote not found:', quoteError);
        return new Response(JSON.stringify({ error: 'Quote not found' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Only update if status is 'sent' (not already viewed/accepted/rejected)
      if (quote.status === 'sent') {
        // Update quote status to 'viewed'
        const { error: updateError } = await admin
          .from('quotes')
          .update({ 
            status: 'viewed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', quote_id);
        
        if (updateError) {
          console.error(`Error updating quote ${quote.quote_number} status to viewed:`, updateError);
          return new Response(JSON.stringify({ error: 'Failed to update quote status' }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Updated quote status from 'sent' to 'viewed'
        
              // Use hardcoded default rules for follow-up creation
      const globalRules = {
        max_stages: 3,
          stage_1_delay: 1,  // 1 day for unviewed quotes (daily scheduler)
          stage_2_delay: 3,  // 3 days for second follow-up
          stage_3_delay: 5,  // 5 days for third follow-up
        max_attempts_per_stage: 3, // Consistent with database default
        instant_view_followup: true,
          view_followup_template: 'followup_viewed_no_action',
        sent_followup_template: 'followup_not_viewed'
      };
        
        // Create delayed follow-up for viewed quote (1 hour delay)
        console.log(`Creating delayed follow-up for viewed quote ${quote.quote_number}`);
        await createDelayedViewFollowUp(admin, quote);
        console.log(`Delayed follow-up created for quote ${quote.quote_number}`);
        
        // Log the status change event
        await admin
          .from('quote_events')
          .insert({
            quote_id: quote.id,
            user_id: quote.user_id,
            type: 'quote_status_changed',
            meta: {
              previous_status: 'sent',
              new_status: 'viewed',
              reason: 'client_viewed',
              automated: false,
              triggered_by: 'frontend_request',
              timestamp: new Date().toISOString()
            }
          });
        
        return new Response(JSON.stringify({ 
          ok: true, 
          message: `Quote marked as viewed`,
          quote_id: quote.id,
          previous_status: 'sent',
          current_status: 'viewed',
          delayed_followup_created: globalRules.instant_view_followup,
          followup_delay: '1 day'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      } else {
        // Quote is not in 'sent' status
        return new Response(JSON.stringify({ 
          ok: true, 
          message: `Quote status unchanged`,
          quote_id: quote.id,
          current_status: quote.status,
          reason: 'Quote not in sent status'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }
    }

    if (action === 'process_expirations' && body.user_id) {
      // Frontend request to process expirations during data loading
      // This functionality has been moved to the quotesService.js file
      const userId = body.user_id;
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Expiration processing moved to quotesService.js`,
        timestamp: new Date().toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    if (action === 'test_expiration' && quote_id) {
      // Test action to manually trigger expiration for a specific quote
      // This functionality has been moved to the quotesService.js file
      // Here we just set the quote's valid_until to yesterday
      
      const { data: quote, error: quoteError } = await admin
        .from('quotes')
        .select(`
          id, status, quote_number, user_id, client_id, valid_until
        `)
        .eq('id', quote_id)
        .single();
      
      if (quoteError || !quote) {
        return new Response(JSON.stringify({ error: 'Quote not found' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Force expiration by setting valid_until to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { error: updateError } = await admin
        .from('quotes')
        .update({ 
          valid_until: yesterday.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', quote_id);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update valid_until' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Note: The actual expiration processing should now be done by calling 
      // checkAndUpdateQuoteExpiration() from quotesService.js

      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Quote valid_until set to yesterday. Call quotesService.checkAndUpdateQuoteExpiration() to complete the test`,
        quote_id: quote.id,
        previous_status: quote.status,
        valid_until_updated: yesterday.toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // ========================================
    // 1. PROCESS QUOTES THAT NEED FOLLOW-UP
    // ========================================
    // Use hardcoded default rules (no database table needed)
    const globalRules = {
      max_stages: 3,
      stage_1_delay: 1,  // 1 day (24 hours) for unviewed quotes
      stage_2_delay: 3,  // 3 days for second follow-up
      stage_3_delay: 5,  // 5 days for third follow-up
      max_attempts_per_stage: 3, // Consistent with database default
      instant_view_followup: true,
      view_followup_template: 'followup_viewed_no_action',
      sent_followup_template: 'followup_not_viewed'
    };

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

    // ========================================
    // 2. PROCESS NEWLY SENT QUOTES (ALL SCENARIOS)
    // ========================================
    await processNewlySentQuotes(admin, globalRules)

    // ========================================
    // 3. PROCESS QUOTE STATUS UPDATES
    // ========================================
    await processQuoteStatusUpdates(admin, globalRules)

    // ========================================
    // 4. CLEAN UP ACCEPTED/REJECTED QUOTES
    // ========================================
    await cleanupAcceptedRejectedQuotes(admin)

    // ========================================
    // 5. PROCESS SCHEDULED FOLLOW-UPS FOR DISPATCH
    // ========================================
    await processScheduledFollowUps(admin);

    // ========================================
    // 6. PROGRESS FOLLOW-UP STAGES
    // ========================================
    await progressFollowUpStages(admin, globalRules)

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})

/**
 * Supabase Edge Function: Follow-ups Scheduler
 * 
 * This function handles:
 * 1. Quote expirations (quotes with valid_until date in the past)
 * 2. Follow-up creation for quotes that need relance
 * 3. Quote status updates (e.g., from 'sent' to 'viewed')
 * 4. Follow-up stage progression
 * 5. Cleanup of accepted/rejected quotes
 * 
 * SHOULD BE CALLED VIA CRON JOB daily at 9 AM to ensure:
 * - Quotes are automatically expired when valid_until date passes
 * - Follow-ups are created and progressed automatically
 * - Quote statuses are kept in sync with backend
 * 
 * Cron schedule: 0 9 * * * (daily at 9 AM)
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
    
    // For 'viewed' status - delayed follow-up if enabled (1 day delay for daily scheduler)
    if (quote.status === 'viewed') {
      // Always schedule follow-up for viewed quotes (1 day delay)
      return true; // Schedule follow-up for viewed quotes
    }
    
    // For 'sent' status - check delay for unopened emails (1 day for daily scheduler)
    if (quote.status === 'sent') {
      if (quote.sent_at) {
        const daysSinceSent = Math.floor((Date.now() - new Date(quote.sent_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceSent >= 1; // Follow-up after 1 day - daily scheduler
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
      .select('id, stage, status')
      .eq('quote_id', quote.id)
      .in('status', ['pending', 'scheduled'])
      .maybeSingle();
    
    if (checkError) {
      console.warn('Error checking existing follow-up:', checkError);
      return;
    }
    
    if (existingFollowUp) {
      // Follow-up already exists for this quote
      return;
    }
    
    // Check for any recent activity (within the last day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // First check quote_access_logs for recent views
    const { data: recentViews, error: viewError } = await admin
      .from('quote_access_logs')
      .select('created_at')
      .eq('quote_id', quote.id)
      .eq('action', 'viewed')
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1)
      .maybeSingle();
    
    // Then check quote_follow_ups for recent updates
    const { data: recentFollowUps, error: recentFollowUpError } = await admin
      .from('quote_follow_ups')
      .select('updated_at, created_at')
      .eq('quote_id', quote.id)
      .or(`updated_at.gte.${oneDayAgo.toISOString()},created_at.gte.${oneDayAgo.toISOString()}`)
      .limit(1)
      .maybeSingle();
    
    // Check quote_events for recent activity
    const { data: recentEvents, error: eventError } = await admin
      .from('quote_events')
      .select('created_at')
      .eq('quote_id', quote.id)
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1)
      .maybeSingle();
      
    // Variable to track if there's been any recent activity
    const hasRecentActivity = (!viewError && recentViews !== null) || 
                            (!recentFollowUpError && recentFollowUps !== null) ||
                            (!eventError && recentEvents !== null);
    
    // Determine follow-up type and stage based on quote status
    let followUpType = 'general';
    let stage = 1;
    let templateType = 'followup_viewed_no_action'; // Default template
    let scheduledAt = new Date().toISOString(); // Default to immediate
    let priority = 'medium'; // Default priority

    if (quote.status === 'viewed') {
      // Client viewed - follow-up after 1 hour
      followUpType = 'viewed_no_action';
      stage = 1; // Stage 1: Client just viewed
      templateType = 'followup_viewed_no_action';
      
      // Calculate scheduled time: 1 hour after viewed
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 1); // 1 hour delay
      scheduledAt = scheduledDate.toISOString();
      
      // Calculate priority based on stage and recent activity
      priority = calculatePriority('viewed', stage, hasRecentActivity);
    } else if (quote.status === 'sent') {
      // Client hasn't opened/viewed the quote
      followUpType = 'email_not_opened';
      stage = 1; // Stage 1: Email not opened
      templateType = 'followup_not_viewed';
      
      // Calculate scheduled time based on stage 1 delay (24 hours)
      if (quote.sent_at) {
        const scheduledDate = new Date(quote.sent_at);
        scheduledDate.setDate(scheduledDate.getDate() + 1); // 1 day delay (hardcoded)
        scheduledAt = scheduledDate.toISOString();
      }
      
      // Calculate priority based on stage and recent activity
      priority = calculatePriority('sent', stage, hasRecentActivity);
    }
    
    // Get template from email_templates
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .maybeSingle();
    
    if (templateError || !template) {
      console.error(`Template ${templateType} not found or error:`, templateError);
      return; // Skip this follow-up if template not found
    }
    
    // Always use database template with variable replacement
    const subject = template.subject
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const text = template.text_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const html = template.html_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
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
        max_attempts: 3, // Hardcoded max attempts
        channel: 'email',
        automated: true,
        meta: {
          follow_up_type: followUpType,
          automated: true,
          created_at: new Date().toISOString(),
          behavior_based: true,
          quote_status: quote.status,
          instant_followup: false, // No more instant follow-ups
          template_type: templateType,
          priority: priority,
          stage_delay: quote.status === 'viewed' ? 1 : 1 // 1 hour for viewed, 1 day for sent (hardcoded)
        }
      });
    
    if (followUpError) {
      console.error('Error creating intelligent follow-up:', followUpError);
    } else {
      // Created intelligent follow-up for quote
    }
  } catch (error) {
    console.error('Error creating intelligent follow-up:', error);
  }
}

/**
 * Process quote status updates (e.g., when client views quote)
 */
async function processQuoteStatusUpdates(admin: any, rules: any) {
  try {
    // Find quotes that have been viewed but status is still 'sent'
    const { data: viewedQuotes, error: viewError } = await admin
      .from('quote_access_logs')
      .select(`
        quote_id,
        quotes!inner(id, status, quote_number, user_id, client_id)
      `)
      .eq('action', 'viewed')
      .eq('quotes.status', 'sent')
      .limit(100);
    
    if (viewError) {
      console.error('Error finding viewed quotes:', viewError);
      return;
    }
    
    for (const log of viewedQuotes || []) {
      const quote = log.quotes;
      
      // Update quote status to 'viewed'
      const { error: updateError } = await admin
        .from('quotes')
        .update({ status: 'viewed' })
        .eq('id', quote.id);
      
      if (updateError) {
        console.error(`Error updating quote ${quote.quote_number} status to viewed:`, updateError);
        continue;
      }
      
      // Updated quote status from 'sent' to 'viewed'
      
      // Create delayed follow-up for viewed quote (1 hour delay)
      await createDelayedViewFollowUp(admin, quote);
    }
  } catch (error) {
    console.error('Error processing quote status updates:', error);
  }
}

/**
 * Create delayed follow-up for viewed quote (1 day delay for daily scheduler)
 */
// In followups-scheduler/index.ts
async function createDelayedViewFollowUp(admin: any, quote: any) {
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
    
    // Find existing follow-up for this quote
    const { data: existingFollowUp, error: checkError } = await admin
      .from('quote_follow_ups')
      .select('*')
      .eq('quote_id', quote.id)
      .in('status', ['pending', 'scheduled'])
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (checkError) {
      console.warn('Error checking existing follow-up:', checkError);
      return;
    }
    
    // Get template for viewed no action follow-up
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_type', 'followup_viewed_no_action')
      .eq('is_active', true)
      .maybeSingle();
    
    if (templateError || !template) {
      console.error(`Template followup_viewed_no_action not found or error:`, templateError);
      return;
    }

    const subject = template.subject
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const text = template.text_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const html = template.html_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // 1 day delay for daily scheduler

    if (existingFollowUp && existingFollowUp.length > 0) {
      // Update existing follow-up with new template and schedule
      const { error: updateError } = await admin
        .from('quote_follow_ups')
        .update({
          status: 'scheduled',
          scheduled_at: scheduledDate.toISOString(),
          template_subject: subject,
          template_text: text,
          template_html: html,
          attempts: 0,
          updated_at: new Date().toISOString(),
          meta: {
            ...existingFollowUp[0].meta,
            follow_up_type: 'viewed_no_action',
            updated_at: new Date().toISOString(),
            quote_status: 'viewed',
            instant_followup: false,
            template_type: 'followup_viewed_no_action',
            priority: calculatePriority('viewed', existingFollowUp[0].stage, true), // Use true for hasRecentActivity since this is a view action
            priority_reason: 'Priority adjusted for viewed quote',
            stage_delay: 1, // 1 day delay for daily scheduler
            previous_status: 'sent',
            status_change_time: new Date().toISOString()
          }
        })
        .eq('id', existingFollowUp[0].id);

      if (updateError) {
        console.error('Error updating existing follow-up:', updateError);
      } else {
        console.log(`Updated existing follow-up for quote ${quote.quote_number}`);
      }
      return;
    }

    // This should never happen since we always create a follow-up when quote is sent
    console.warn(`No existing follow-up found for quote ${quote.quote_number} - this should not happen`);
  } catch (error) {
    console.error('Error in createDelayedViewFollowUp:', error);
  }
}
/**
 * Clean up follow-ups for accepted/rejected quotes
 */
async function cleanupAcceptedRejectedQuotes(admin: any) {
  try {
    // Find quotes that are accepted or rejected
    const { data: finalizedQuotes, error: finalError } = await admin
      .from('quotes')
      .select('id, quote_number, status')
      .in('status', ['accepted', 'rejected'])
      .limit(100);
    
    if (finalError) {
      console.error('Error finding finalized quotes:', finalError);
      return;
    }
    
    for (const quote of finalizedQuotes || []) {
      // Stop all pending/scheduled follow-ups for this quote
      const { error: stopError } = await admin
        .from('quote_follow_ups')
        .update({ 
          status: 'stopped', 
          updated_at: new Date().toISOString() 
        })
        .eq('quote_id', quote.id)
        .in('status', ['pending', 'scheduled']);
      
      if (stopError) {
        console.error(`Error stopping follow-ups for quote ${quote.quote_number}:`, stopError);
      } else {
        console.log(`Stopped follow-ups for ${quote.status} quote ${quote.quote_number}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up accepted/rejected quotes:', error);
  }
}

/**
 * Progress follow-up stages based on timing and attempts
 */
async function progressFollowUpStages(admin: any, rules: any) {
  try {
    // Find follow-ups that need to progress to next stage
    const { data: followUps, error: fuError } = await admin
      .from('quote_follow_ups')
      .select(`
        id, quote_id, stage, attempts, max_attempts, status, scheduled_at,
        quotes!inner(quote_number, status, sent_at, user_id, client_id, valid_until)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(100);
    
    if (fuError) {
      console.error('Error finding follow-ups to progress:', fuError);
      return;
    }
    
    for (const followUp of followUps || []) {
      const quote = followUp.quotes;
      
      // Check if quote is still valid for follow-up
      if (quote.status === 'accepted' || quote.status === 'rejected' || quote.status === 'expired') {
        console.log(`Quote ${quote.quote_number} is ${quote.status}, stopping follow-up ${followUp.id}`);
        await admin
          .from('quote_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'quote_finalized',
              stopped_at: new Date().toISOString(),
              final_status: quote.status
            }
          })
          .eq('id', followUp.id);
        continue;
      }
      
      // Check if quote is expired based on valid_until
      if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
        console.log(`Quote ${quote.quote_number} is expired, stopping follow-up ${followUp.id}`);
        await admin
          .from('quote_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'quote_expired',
              stopped_at: new Date().toISOString(),
              valid_until: quote.valid_until
            }
          })
          .eq('id', followUp.id);
        continue;
      }
      
      // Check if we should progress to next stage
      if (followUp.attempts >= followUp.max_attempts) {
        console.log(`Max attempts reached for follow-up ${followUp.id}: ${followUp.attempts}/${followUp.max_attempts} attempts`);
        // Max attempts reached, move to next stage
        const nextStage = followUp.stage + 1;
        
        if (nextStage <= 3) { // Hardcoded max stages
          // Calculate delay for next stage based on business rules
          let delayDays = 0;
          switch (nextStage) {
            case 2: 
              delayDays = 3; // 3 days for second follow-up (hardcoded)
              break;
            case 3: 
              delayDays = 5; // 5 days for third follow-up (hardcoded)
              break;
            default: 
              delayDays = 5; // fallback
              break;
          }
          
          // Check if the next scheduled date would be after quote expiration
          const nextScheduledAt = new Date();
          nextScheduledAt.setDate(nextScheduledAt.getDate() + delayDays);
          
          if (quote.valid_until && nextScheduledAt > new Date(quote.valid_until)) {
            console.log(`Next follow-up for quote ${quote.quote_number} would be after expiration (${quote.valid_until}), stopping follow-up`);
            await admin
              .from('quote_follow_ups')
              .update({
                status: 'stopped',
                updated_at: new Date().toISOString(),
                meta: {
                  stopped_reason: 'would_expire_before_next_stage',
                  stopped_at: new Date().toISOString(),
                  valid_until: quote.valid_until,
                  next_scheduled: nextScheduledAt.toISOString()
                }
              })
              .eq('id', followUp.id);
            continue;
          }
          
          // Calculate new priority based on next stage
          const priority = nextStage > 1 ? 'high' : 'medium';

          // Update follow-up to next stage and mark current stage as completed
          const { error: updateError } = await admin
            .from('quote_follow_ups')
            .update({
              stage: nextStage,
              status: `stage_${followUp.stage}_completed`,
              attempts: 0,
              scheduled_at: nextScheduledAt.toISOString(),
              updated_at: new Date().toISOString(),
              meta: {
                stage_progressed: true,
                previous_stage: followUp.stage,
                new_stage: nextStage,
                delay_days: delayDays,
                progressed_at: new Date().toISOString(),
                stage_completion: `Completed stage ${followUp.stage} of 3`,
                completion_type: 'stage_completion',
                priority: priority,
                priority_reason: `Priority set to ${priority} due to stage ${nextStage}`
              }
            })
            .eq('id', followUp.id);
          
          if (updateError) {
            console.error(`Error progressing follow-up ${followUp.id} to stage ${nextStage}:`, updateError);
          } else {
            console.log(`Progressed follow-up for quote ${quote.quote_number} to stage ${nextStage}, scheduled for ${nextScheduledAt.toISOString()} (${delayDays} days delay)`);
          }
        } else {
          // Max stages reached, mark as all stages completed
          const { error: completeError } = await admin
            .from('quote_follow_ups')
            .update({
              status: 'all_stages_completed',
              updated_at: new Date().toISOString(),
              meta: {
                completed_reason: 'all_stages_completed',
                completed_at: new Date().toISOString(),
                final_stage: followUp.stage,
                stage_completion: 'Completed all 3 stages',
                completion_type: 'full_completion'
              }
            })
            .eq('id', followUp.id);
          
          if (completeError) {
            console.error(`Error completing follow-up ${followUp.id}:`, completeError);
          } else {
            console.log(`Completed follow-up for quote ${quote.quote_number} - max stages reached`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error progressing follow-up stages:', error);
  }
}

/**
 * Process newly sent quotes from all creation scenarios
 * This handles: normal creation, draft conversion, lead creation, status updates
 */
async function processNewlySentQuotes(admin: any, rules: any) {
  try {
    // Find quotes that were recently sent but don't have follow-ups yet
    const { data: newSentQuotes, error: sentErr } = await admin
      .from('quotes')
      .select(`
        id, user_id, client_id, quote_number, title, sent_at, created_at
      `)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .limit(100);
    
    if (sentErr) {
      console.error('Error finding newly sent quotes:', sentErr);
      return;
    }

    for (const quote of newSentQuotes || []) {
      // Check if follow-up already exists for this quote
      const { data: existingFollowUp, error: checkError } = await admin
        .from('quote_follow_ups')
        .select('id')
        .eq('quote_id', quote.id)
        .limit(1);
      
      if (checkError) {
        console.warn('Error checking existing follow-up for quote:', quote.id, checkError);
        continue;
      }
      
      if (existingFollowUp && existingFollowUp.length > 0) {
        console.log(`Follow-up already exists for quote ${quote.quote_number}`);
        continue;
      }
      
      // Create initial follow-up for newly sent quote
      await createInitialFollowUpForSentQuote(admin, quote, rules);
    }
  } catch (error) {
    console.error('Error processing newly sent quotes:', error);
  }
}

/**
 * Create initial follow-up for a newly sent quote
 */
async function createInitialFollowUpForSentQuote(admin: any, quote: any, rules: any) {
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
    
    // Get template for initial follow-up
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_type', 'followup_not_viewed')
      .eq('is_active', true)
      .maybeSingle();
    
    if (templateError || !template) {
      console.error(`Template followup_not_viewed not found or error:`, templateError);
      return; // Skip this follow-up if template not found
    }
    
    // Always use database template with variable replacement
    const subject = template.subject
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const text = template.text_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    const html = template.html_content
      .replace('{quote_number}', quote.quote_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{quote_title}', quote.title || 'votre projet');
    
    // Calculate scheduled time based on stage 1 delay (24 hours)
    const scheduledAt = new Date();
    if (quote.sent_at) {
      scheduledAt.setDate(scheduledAt.getDate() + 1); // 1 day delay for unviewed quotes (hardcoded)
    }
    
    // Create initial follow-up
    const { error: followUpError } = await admin
      .from('quote_follow_ups')
      .insert({
        quote_id: quote.id,
        user_id: quote.user_id,
        client_id: quote.client_id,
        stage: 1,
        status: 'scheduled',
        scheduled_at: scheduledAt,
        template_subject: subject,
        template_text: text,
        template_html: html,
        attempts: 0,
        max_attempts: 3, // Hardcoded max attempts
        channel: 'email',
        automated: true,
        meta: {
          follow_up_type: 'initial_sent',
          automated: true,
          created_at: new Date().toISOString(),
          behavior_based: true,
          quote_status: 'sent',
          instant_followup: false,
          template_type: 'followup_not_viewed',
          priority: 'high',
          priority_reason: 'Initial follow-up for unopened quote',
          source: 'newly_sent_quote'
        }
      });
    
    if (followUpError) {
      console.error('Error creating initial follow-up for sent quote:', followUpError);
    } else {
      console.log(`Created initial follow-up for newly sent quote ${quote.quote_number}, scheduled for ${scheduledAt.toISOString()}`);
    }
  } catch (error) {
    console.error('Error creating initial follow-up for sent quote:', error);
  }
}

// Quote expiration functions have been moved to quotesService.js

/**
 * Process scheduled follow-ups for email dispatch
 * This function only marks follow-ups as ready for dispatch, doesn't send emails
 */
async function processScheduledFollowUps(admin: any) {
  try {
    console.log('Starting to process scheduled follow-ups for dispatch...');
    
    // Find all scheduled follow-ups that are ready to be dispatched
    const { data: scheduledFollowUps, error: fuError } = await admin
      .from('quote_follow_ups')
      .select(`
        id, quote_id, user_id, client_id, stage, attempts, max_attempts, status, scheduled_at,
        template_subject, template_text, template_html, meta,
        quotes!inner(quote_number, status, title, valid_until),
        clients!inner(name, email)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(100);
    
    if (fuError) {
      console.error('Error finding scheduled follow-ups:', fuError);
      return;
    }
    
    console.log(`Found ${scheduledFollowUps?.length || 0} scheduled follow-ups ready for dispatch`);
    
    for (const followUp of scheduledFollowUps || []) {
      const quote = followUp.quotes;
      const client = followUp.clients;
      
      // Check if quote is still valid for follow-up
      if (quote.status === 'accepted' || quote.status === 'rejected' || quote.status === 'expired') {
        console.log(`Quote ${quote.quote_number} is ${quote.status}, stopping follow-up ${followUp.id}`);
        await admin
          .from('quote_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'quote_finalized',
              stopped_at: new Date().toISOString(),
              final_status: quote.status
            }
          })
          .eq('id', followUp.id);
        continue;
      }
      
      // Check if quote is expired based on valid_until
      if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
        console.log(`Quote ${quote.quote_number} is expired, stopping follow-up ${followUp.id}`);
        await admin
          .from('quote_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString(),
            meta: {
              stopped_reason: 'quote_expired',
              stopped_at: new Date().toISOString(),
              valid_until: quote.valid_until
            }
          })
          .eq('id', followUp.id);
        continue;
      }
      
      // Check if we've reached max attempts for this stage
      if (followUp.attempts >= followUp.max_attempts) {
        console.log(`Follow-up ${followUp.id} for quote ${quote.quote_number} reached max attempts, will progress to next stage`);
        continue; // Let progressFollowUpStages handle this
      }
      
      try {
        // Queue email in email_outbox for dispatcher to process
        const { error: emailError } = await admin
          .from('email_outbox')
          .insert({
            quote_id: quote.id,
            user_id: followUp.user_id,
            follow_up_id: followUp.id,
            to_email: client.email,
            subject: followUp.template_subject || `Devis ${quote.quote_number} - Suivi`,
            html: followUp.template_html,
            text: followUp.template_text,
            status: 'pending',
            email_type: 'follow_up',
            meta: {
              follow_up_id: followUp.id,
              stage: followUp.stage,
              attempt: followUp.attempts + 1,
              quote_number: quote.quote_number,
              client_name: client.name
            }
          });
        
        if (emailError) {
          console.error(`Error queuing email for follow-up ${followUp.id}:`, emailError);
          continue;
        }
        
        // Mark follow-up as ready for dispatch (dispatcher will handle sending)
        const { error: updateError } = await admin
          .from('quote_follow_ups')
          .update({
            status: 'ready_for_dispatch',
            updated_at: new Date().toISOString(),
            meta: {
              ...followUp.meta,
              queued_at: new Date().toISOString(),
              queued_for_dispatch: true,
              attempt_count: followUp.attempts + 1
            }
          })
          .eq('id', followUp.id);
        
        if (updateError) {
          console.error(`Error updating follow-up ${followUp.id} status:`, updateError);
        } else {
          console.log(`Queued follow-up for dispatch: quote ${quote.quote_number}, stage ${followUp.stage}, attempt ${followUp.attempts + 1}`);
        }
        
      } catch (emailError) {
        console.error(`Error processing follow-up ${followUp.id}:`, emailError);
        continue;
      }
    }
  } catch (error) {
    console.error('Error processing scheduled follow-ups for dispatch:', error);
  }
}