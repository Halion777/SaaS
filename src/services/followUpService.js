import { supabase } from './supabaseClient';
import QuoteTrackingService from './quoteTrackingService';

// Enhanced follow-up service with automated relance based on tracking data

export async function getUserFollowUpRules(userId) {
  const { data, error } = await supabase
    .from('quote_follow_up_rules')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return data || null;
}

export async function upsertUserFollowUpRules(userId, rules) {
  const payload = { user_id: userId, ...rules };
  const { data, error } = await supabase
    .from('quote_follow_up_rules')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listScheduledFollowUps({ status = 'pending', limit = 100 } = {}) {
  let query = supabase
    .from('quote_follow_ups')
    .select('*')
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  
  if (status !== 'all') {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return { data, error: null };
}

export async function scheduleFollowUpsForQuote(quoteId) {
  // This function is no longer needed as edge functions handle follow-up creation
  // The followups-scheduler edge function will create follow-ups automatically
  console.log('Follow-ups are now handled by edge functions automatically');
  return { success: true };
}

export async function createFollowUpForQuote(quoteId, stage, userId = null) {
  try {
    // First, ensure the quote has a share token and is marked as public
    // Check if the quote already has a share token
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('share_token, is_public')
      .eq('id', quoteId)
      .single();
      
    if (quoteError) {
      console.error('Error checking quote share token:', quoteError);
      // Try to generate a share token anyway
      const shareToken = generateShareToken();
      
      await supabase
        .from('quotes')
        .update({ 
          share_token: shareToken, 
          is_public: true 
        })
        .eq('id', quoteId);
    } else {
      if (!quoteData.share_token) {
        // Generate a share token if none exists
        const shareToken = generateShareToken();
        
        // Update the quote with the share token and mark it as public
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ 
            share_token: shareToken, 
            is_public: true 
          })
          .eq('id', quoteId);
          
        if (updateError) {
          console.error('Error updating quote with share token:', updateError);
        }
      } else if (!quoteData.is_public) {
        // If share token exists but is_public is false, set it to true
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ is_public: true })
          .eq('id', quoteId);
          
        if (updateError) {
          console.error('Error updating quote is_public flag:', updateError);
        }
      }
    }
  
    // Prevent duplicates: if there is already a pending/scheduled follow-up, return its id
    const { data: existing, error: existingErr } = await supabase
      .from('quote_follow_ups')
      .select('id, status')
      .eq('quote_id', quoteId)
      .in('status', ['pending', 'scheduled'])
      .limit(1)
      .maybeSingle();
    if (!existingErr && existing?.id) {
      return existing.id;
    }

    // Create follow-up directly in the database instead of using RPC function
    const { data, error } = await supabase
      .from('quote_follow_ups')
      .insert({
        quote_id: quoteId,
        user_id: userId, // Required field
        stage: stage,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
        attempts: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return data.id; // follow_up_id
  } catch (error) {
    console.error('Error creating follow-up for quote:', error);
    throw error;
  }
}

// Helper function to generate a share token
function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function enqueueEmail({ follow_up_id, user_id, to_email, subject, html, text, provider = 'resend' }) {
  const { data, error } = await supabase
    .from('email_outbox')
    .insert({ follow_up_id, user_id, to_email, subject, html, text, provider, status: 'queued' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markFollowUpSent(followUpId) {
  const { data, error } = await supabase
    .from('quote_follow_ups')
    .update({ status: 'sent' })
    .eq('id', followUpId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementFollowUpAttempts(followUpId) {
  // Fetch current attempts then update
  const { data: current, error: readErr } = await supabase
    .from('quote_follow_ups')
    .select('attempts')
    .eq('id', followUpId)
    .single();
  if (readErr) throw readErr;

  const nextAttempts = (current?.attempts || 0) + 1;
  const { data, error } = await supabase
    .from('quote_follow_ups')
    .update({ attempts: nextAttempts, next_attempt_at: new Date().toISOString() })
    .eq('id', followUpId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function stopFollowUpsForQuote(quoteId) {
  const { error } = await supabase
    .from('quote_follow_ups')
    .update({ status: 'stopped' })
    .eq('quote_id', quoteId)
    .in('status', ['pending', 'scheduled']);
  if (error) throw error;
  return { success: true };
}

export async function logQuoteEvent({ quote_id, user_id, type, meta = {}, share_token = null }) {
  try {
    // Use the provided share_token if available, otherwise get it from the quotes table
    let shareToken = share_token;
    
    if (!shareToken) {
      // Get the quote's share token from the quotes table
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('share_token, is_public')
        .eq('id', quote_id)
        .single();
        
      // If the quote doesn't have a share token, generate one
      shareToken = quoteData?.share_token;
      if (quoteError || !shareToken) {
        // Generate a new share token
        shareToken = generateShareToken();
        
        // Update the quote with the share token and mark it as public
        await supabase
          .from('quotes')
          .update({ 
            share_token: shareToken, 
            is_public: true 
          })
          .eq('id', quote_id);
      } else if (!quoteData.is_public) {
        // If share token exists but is_public is false, set it to true
        await supabase
          .from('quotes')
          .update({ is_public: true })
          .eq('id', quote_id);
      }
    } else {
      // Even if share token is provided, ensure is_public is set to true
      await supabase
        .from('quotes')
        .update({ is_public: true })
        .eq('id', quote_id);
    }
    
    // Now insert the event with the share token
    const { data, error } = await supabase
      .from('quote_events')
      .insert({
        quote_id,
        user_id,
        type,
        meta,
        timestamp: new Date().toISOString(),
        share_token: shareToken
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging quote event:', error);
    throw error;
  }
}

/**
 * Check and trigger automated relances based on tracking data
 */
export async function checkAndTriggerAutomatedRelances(userId) {
  try {
    console.log('🔍 Checking for quotes needing automated relance...');
    
    // Get quotes that need relance attention
    const relanceResult = await QuoteTrackingService.getQuotesNeedingRelance(userId);
    if (!relanceResult.success) {
      console.error('Failed to get quotes needing relance:', relanceResult.error);
      return { success: false, error: relanceResult.error };
    }

    const quotesNeedingRelance = relanceResult.data || [];
    console.log(`📊 Found ${quotesNeedingRelance.length} quotes needing relance attention`);

    const triggeredRelances = [];
    const errors = [];

    for (const quote of quotesNeedingRelance) {
      try {
        const relanceResult = await triggerAutomatedRelanceForQuote(quote);
        if (relanceResult.success) {
          triggeredRelances.push(relanceResult.data);
          console.log(`✅ Automated relance triggered for quote ${quote.quote_number}`);
        } else {
          errors.push({ quoteId: quote.id, error: relanceResult.error });
          console.warn(`⚠️ Failed to trigger relance for quote ${quote.quote_number}:`, relanceResult.error);
        }
      } catch (error) {
        errors.push({ quoteId: quote.id, error: error.message });
        console.error(`❌ Error processing relance for quote ${quote.quote_number}:`, error);
      }
    }

    return {
      success: true,
      data: {
        triggeredRelances,
        totalQuotes: quotesNeedingRelance.length,
        successCount: triggeredRelances.length,
        errorCount: errors.length,
        errors
      }
    };
  } catch (error) {
    console.error('Error in automated relance check:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger automated relance for a specific quote based on tracking data
 */
export async function triggerAutomatedRelanceForQuote(quote) {
  try {
    const { trackingData } = quote;
    
    if (!trackingData.relanceAllowed) {
      return { success: false, error: 'Relance not allowed for this quote' };
    }

    // Determine relance type and timing based on tracking status
    const relanceConfig = getRelanceConfig(trackingData);
    
    // Check if we should actually send the relance now
    if (!shouldSendRelanceNow(relanceConfig)) {
      return { success: false, error: 'Relance not due yet' };
    }

    // Create or update follow-up record
    const followUpResult = await createOrUpdateAutomatedFollowUp(quote, relanceConfig);
    if (!followUpResult.success) {
      return followUpResult;
    }

    // Log the automated relance action
    await QuoteTrackingService.logRelanceAction(
      quote.id,
      'automated',
      'system_trigger',
      `Automated relance triggered: ${relanceConfig.reason}`
    );

    return {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        relanceType: relanceConfig.type,
        reason: relanceConfig.reason,
        followUpId: followUpResult.data.id,
        scheduledFor: relanceConfig.scheduledFor
      }
    };
  } catch (error) {
    console.error('Error triggering relance for quote:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get relance configuration based on tracking data
 */
function getRelanceConfig(trackingData) {
  const now = new Date();
  
  // Check if there was a recent follow-up (within 1 day)
  const hasRecentFollowUp = trackingData.lastFollowUpDate && 
    (new Date().getTime() - new Date(trackingData.lastFollowUpDate).getTime() < 24 * 60 * 60 * 1000);
  
  switch (trackingData.relanceStatus) {
    case 'not_viewed':
      return {
        type: 'email_not_opened',
        reason: 'Client has not opened the quote email',
        priority: hasRecentFollowUp ? 'low' : 'high',
        scheduledFor: now, // Send immediately
        template: 'not_viewed'
      };
      
    case 'viewed_no_action':
      return {
        type: 'viewed_no_action',
        reason: 'Client viewed quote but took no action',
        priority: hasRecentFollowUp ? 'low' : 'medium',
        scheduledFor: now, // Send immediately
        template: 'viewed_no_action'
      };
      
    default:
      return {
        type: 'general_followup',
        reason: 'General follow-up reminder',
        priority: 'low',
        scheduledFor: now,
        template: 'general'
      };
  }
}

/**
 * Check if relance should be sent now
 */
function shouldSendRelanceNow(relanceConfig) {
  const now = new Date();
  return relanceConfig.scheduledFor <= now;
}

/**
 * Create or update automated follow-up record
 */
async function createOrUpdateAutomatedFollowUp(quote, relanceConfig) {
  try {
    // Check if follow-up already exists
    const { data: existingFollowUp, error: checkError } = await supabase
      .from('quote_follow_ups')
      .select('id, status')
      .eq('quote_id', quote.id)
      .in('status', ['pending', 'scheduled'])
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing follow-up:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingFollowUp) {
      // Update existing follow-up
      const { error: updateError } = await supabase
        .from('quote_follow_ups')
        .update({
          status: 'scheduled',
          scheduled_at: relanceConfig.scheduledFor.toISOString(),
          template_subject: getRelanceSubject(quote, relanceConfig),
          template_text: getRelanceText(quote, relanceConfig),
          template_html: getRelanceHtml(quote, relanceConfig),
          meta: {
            ...relanceConfig,
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', existingFollowUp.id);

      if (updateError) {
        console.error('Error updating follow-up:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, data: { id: existingFollowUp.id, updated: true } };
    } else {
      // Create new follow-up
      const { data: newFollowUp, error: createError } = await supabase
        .from('quote_follow_ups')
        .insert({
          quote_id: quote.id,
          user_id: quote.user_id,
          client_id: quote.client_id,
          stage: 1,
          status: 'scheduled',
          scheduled_at: relanceConfig.scheduledFor.toISOString(),
          template_subject: getRelanceSubject(quote, relanceConfig),
          template_text: getRelanceText(quote, relanceConfig),
          template_html: getRelanceHtml(quote, relanceConfig),
          automated: true,
          meta: {
            ...relanceConfig,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating follow-up:', createError);
        return { success: false, error: createError.message };
      }

      return { success: true, data: newFollowUp };
    }
  } catch (error) {
    console.error('Error creating/updating follow-up:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get relance email subject
 */
function getRelanceSubject(quote, relanceConfig) {
  switch (relanceConfig.template) {
    case 'not_viewed':
      return `Devis ${quote.quote_number} - Avez-vous reçu notre proposition ?`;
    case 'viewed_no_action':
      return `Devis ${quote.quote_number} - Des questions sur notre proposition ?`;
    default:
      return `Devis ${quote.quote_number} - Relance`;
  }
}

/**
 * Get relance email text
 */
function getRelanceText(quote, relanceConfig) {
  const clientName = quote.client?.name || 'Madame, Monsieur';
  
  switch (relanceConfig.template) {
    case 'not_viewed':
      return `Bonjour ${clientName},

Nous avons envoyé notre devis ${quote.quote_number} pour votre projet "${quote.title}" il y a quelques jours.

Avez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.

Nous restons à votre disposition pour toute question.

Cordialement,
Votre équipe`;
      
    case 'viewed_no_action':
      return `Bonjour ${clientName},

Nous avons remarqué que vous avez consulté notre devis ${quote.quote_number} pour votre projet "${quote.title}".

Avez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?

Nous sommes là pour vous accompagner dans votre décision.

Cordialement,
Votre équipe`;
      
    default:
      return `Bonjour ${clientName},

Nous vous rappelons notre devis ${quote.quote_number} pour votre projet "${quote.title}".

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
Votre équipe`;
  }
}

/**
 * Get relance email HTML
 */
function getRelanceHtml(quote, relanceConfig) {
  const clientName = quote.client?.name || 'Madame, Monsieur';
  
  switch (relanceConfig.template) {
    case 'not_viewed':
      return `<p>Bonjour ${clientName},</p>

<p>Nous avons envoyé notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong> il y a quelques jours.</p>

<p>Avez-vous bien reçu notre proposition ? Si vous rencontrez des difficultés pour l'ouvrir, n'hésitez pas à nous le faire savoir.</p>

<p>Nous restons à votre disposition pour toute question.</p>

<p>Cordialement,<br>
<strong>Votre équipe</strong></p>`;
      
    case 'viewed_no_action':
      return `<p>Bonjour ${clientName},</p>

<p>Nous avons remarqué que vous avez consulté notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p>

<p>Avez-vous des questions sur notre proposition ? Souhaitez-vous que nous clarifions certains points ?</p>

<p>Nous sommes là pour vous accompagner dans votre décision.</p>

<p>Cordialement,<br>
<strong>Votre équipe</strong></p>`;
      
    default:
      return `<p>Bonjour ${clientName},</p>

<p>Nous vous rappelons notre <strong>devis ${quote.quote_number}</strong> pour votre projet <strong>"${quote.title}"</strong>.</p>

<p>N'hésitez pas à nous contacter si vous avez des questions.</p>

<p>Cordialement,<br>
<strong>Votre équipe</strong></p>`;
  }
}

/**
 * Manually trigger follow-up dispatching via edge function
 * This ensures immediate email sending when needed
 */
export async function triggerFollowUpDispatching() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-dispatcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Follow-up dispatching triggered:', result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      throw new Error(`Edge function error: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Error triggering follow-up dispatching:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually trigger follow-up scheduling via edge function
 * This ensures immediate follow-up creation and processing when needed
 */
export async function triggerFollowUpScheduling() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/followups-scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Follow-up scheduling triggered:', result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      throw new Error(`Edge function error: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Error triggering follow-up scheduling:', error);
    return { success: false, error: error.message };
  }
}


