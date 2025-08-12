import { supabase } from './supabaseClient';

// Backend-only follow-up service. No frontend changes required to existing pages.

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
  const { error } = await supabase.rpc('schedule_all_followups_for_quote', { p_quote_id: quoteId });
  if (error) throw error;
  return { success: true };
}

export async function createFollowUpForQuote(quoteId, stage) {
  const { data, error } = await supabase.rpc('create_follow_up_for_quote', {
    p_quote_id: quoteId,
    p_stage: stage,
  });
  if (error) throw error;
  return data; // follow_up_id
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

export async function logQuoteEvent({ quote_id, user_id, type, meta = {} }) {
  const { data, error } = await supabase
    .from('quote_events')
    .insert({
      quote_id,
      user_id,
      type,
      meta,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}


