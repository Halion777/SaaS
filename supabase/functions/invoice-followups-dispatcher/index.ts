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

// Minimal email sender using Resend
async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
  if (!RESEND_API_KEY) {
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

    // ========================================
    // 1. FIND DUE FOLLOW-UPS
    // ========================================
    const nowIso = new Date().toISOString()
    const { data: dueFollowUps, error: dueErr } = await admin
      .from('invoice_follow_ups')
      .select(`
        id, invoice_id, user_id, client_id, stage, 
        template_subject, template_html, template_text,
        meta, created_at, attempts, max_attempts, status
      `)
      .in('status', ['pending', 'scheduled', 'ready_for_dispatch'])
      .lte('scheduled_at', nowIso)
      .order('meta->priority', { ascending: false })
      .limit(100)
    if (dueErr) throw dueErr

    // ========================================
    // 2. PROCESS FOLLOW-UPS BY PRIORITY
    // ========================================
    const processedInvoices = new Set<string>();
    const results = {
      high_priority: 0,
      medium_priority: 0,
      low_priority: 0,
      failed: 0,
      total: dueFollowUps?.length || 0
    };

    for (const fu of dueFollowUps || []) {
      if (processedInvoices.has(String(fu.invoice_id))) {
        continue;
      }
      
      try {
        const result = await processFollowUp(admin, fu);
        if (result.success) {
          const priority = fu.meta?.priority || 'medium';
          switch (priority) {
            case 'high': results.high_priority++; break;
            case 'medium': results.medium_priority++; break;
            case 'low': results.low_priority++; break;
          }
          processedInvoices.add(String(fu.invoice_id));
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
      processed: processedInvoices.size,
      results,
      timestamp: nowIso
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})

/**
 * Process a single follow-up
 */
async function processFollowUp(admin: any, followUp: any) {
  let invoice: any = null;
  let client: any = null;
  
  try {
    // ========================================
    // 1. GET INVOICE AND CLIENT DETAILS
    // ========================================
    const { data: invoiceData, error: iErr } = await admin
      .from('invoices')
      .select('id, user_id, client_id, invoice_number, title, status, due_date, final_amount')
      .eq('id', followUp.invoice_id)
      .single()
    if (iErr || !invoiceData) { 
      console.error('Invoice not found for follow-up:', followUp.id);
      return { success: false, error: 'Invoice not found' };
    }
    
    invoice = invoiceData;

    // Check if invoice is still valid for follow-up
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      console.log(`Invoice ${invoice.invoice_number} is ${invoice.status}, stopping follow-ups`);
      await stopFollowUpsForInvoice(admin, invoice.id);
      return { success: false, error: 'Invoice finalized' };
    }

    const { data: clientData, error: cErr } = await admin
      .from('clients')
      .select('email, name')
      .eq('id', invoice.client_id)
      .single()

    if (cErr || !clientData || !clientData.email) {
      console.error('Client not found or no email for invoice:', invoice.invoice_number);
      return { success: false, error: 'Client not found or no email' };
    }
    
    client = clientData;

    // ========================================
    // 2. PREPARE EMAIL CONTENT
    // ========================================
    const subject = followUp.template_subject || 'Payment Reminder';
    const html = followUp.template_html || '';
    const text = followUp.template_text || '';

    // Replace dynamic variables that need real-time calculation
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.haliqo.com';
    const invoiceLink = `${siteUrl}/invoice/${invoice.id}`;

    // Final variable replacement
    const finalSubject = subject
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0');
    
    const finalHtml = html
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0')
      .replace(/{invoice_link}/g, invoiceLink);
    
    const finalText = text
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0')
      .replace(/{invoice_link}/g, invoiceLink);

    // ========================================
    // 3. CREATE EMAIL OUTBOX RECORD
    // ========================================
    // Note: email_outbox table structure - we use follow_up_id to track the follow-up
    // If invoice_id column exists, it will be added via migration
    const { data: outbox, error: outboxError } = await admin
      .from('email_outbox')
      .insert({
        user_id: followUp.user_id,
        follow_up_id: followUp.id,
        to_email: client.email,
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        status: 'sending',
        email_type: followUp.meta?.template_type || 'invoice_followup'
      })
      .select()
      .single()

    if (outboxError) {
      console.error('Error creating email outbox:', outboxError);
      return { success: false, error: 'Failed to create email outbox' };
    }

    // ========================================
    // 4. SEND EMAIL
    // ========================================
    const resp = await sendEmail({ to: client.email, subject: finalSubject, html: finalHtml, text: finalText })

    // ========================================
    // 5. UPDATE FOLLOW-UP STATUS
    // ========================================
    await admin.from('email_outbox').update({ 
      status: 'sent', 
      provider_message_id: resp.id, 
      sent_at: new Date().toISOString() 
    }).eq('id', outbox.id)

    // Update follow-up status and increment attempts
    const newAttempts = (followUp.attempts || 0) + 1;
    const maxAttempts = followUp.max_attempts || 3;
    console.log(`Incrementing attempts for follow-up ${followUp.id}: ${followUp.attempts || 0} → ${newAttempts}/${maxAttempts}`);
    
    // Check if we need to reschedule for next attempt within same stage
    if (newAttempts < maxAttempts) {
      // Reschedule for next attempt (1 day delay between attempts)
      const nextScheduledAt = new Date();
      nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
      
      const { error: updateError } = await admin
        .from('invoice_follow_ups')
        .update({ 
          status: 'scheduled',
          attempts: newAttempts,
          scheduled_at: nextScheduledAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', followUp.id);
      
      if (updateError) {
        console.error('Error updating follow-up status:', updateError);
      } else {
        console.log(`✅ Rescheduled follow-up ${followUp.id} for next attempt (${newAttempts + 1}/${maxAttempts})`);
      }
    } else {
      // Max attempts reached, mark as sent - scheduler will handle stage progression
      const { error: updateError } = await admin
        .from('invoice_follow_ups')
        .update({ 
          status: 'sent',
          attempts: newAttempts,
          updated_at: new Date().toISOString()
        })
        .eq('id', followUp.id);
      
      if (updateError) {
        console.error('Error updating follow-up status:', updateError);
      } else {
        console.log(`✅ Follow-up ${followUp.id} reached max attempts (${newAttempts}/${maxAttempts})`);
      }
    }

    // ========================================
    // 6. LOG EVENTS
    // ========================================
    const eventMeta = {
      stage: followUp.stage,
      follow_up_id: followUp.id,
      follow_up_type: followUp.meta?.follow_up_type || 'general',
      automated: followUp.meta?.automated || false,
      template_subject: followUp.template_subject,
      client_email: client.email,
      attempts: newAttempts,
      priority: followUp.meta?.priority || 'medium'
    }
    
    await admin.from('invoice_events').insert({ 
      invoice_id: followUp.invoice_id, 
      user_id: followUp.user_id, 
      type: 'followup_sent', 
      meta: eventMeta,
      timestamp: new Date().toISOString()
    })
    
    return { success: true, data: { invoice_number: invoice.invoice_number, client_email: client.email } };
    
  } catch (err: any) {
    const errorMessage = err?.message || 'send failed'
    
    // ========================================
    // 7. HANDLE FAILURES
    // ========================================
    await admin.from('email_outbox').insert({ 
      follow_up_id: followUp.id, 
      user_id: followUp.user_id, 
      to_email: (client && client.email) || followUp.meta?.client_email || 'unknown', 
      subject: followUp.template_subject || 'Payment Reminder', 
      html: followUp.template_html || '', 
      text: followUp.template_text || '', 
      status: 'failed', 
      error: errorMessage 
    })
    
    // Update follow-up status
    const newAttempts = (followUp.attempts || 0) + 1;
    console.log(`Incrementing failed attempts for follow-up ${followUp.id}: ${followUp.attempts || 0} → ${newAttempts}/${followUp.max_attempts || 3}`);
    
    await admin.from('invoice_follow_ups').update({ 
      status: 'failed', 
      last_error: errorMessage,
      last_attempt: new Date().toISOString(),
      attempts: newAttempts
    }).eq('id', followUp.id)
    
    // Log failure event
    await admin.from('invoice_events').insert({
      invoice_id: followUp.invoice_id,
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
    })
    
    console.error(`Failed to send follow-up for invoice: ${errorMessage}`)
    return { success: false, error: errorMessage };
  }
}

/**
 * Stop all follow-ups for an invoice
 */
async function stopFollowUpsForInvoice(admin: any, invoiceId: string) {
  try {
    const { error } = await admin
      .from('invoice_follow_ups')
      .update({ 
        status: 'stopped', 
        updated_at: new Date().toISOString() 
      })
      .eq('invoice_id', invoiceId)
      .in('status', ['pending', 'scheduled']);
    
    if (error) {
      console.error('Error stopping follow-ups for invoice:', error);
    } else {
      console.log(`Stopped all follow-ups for invoice ${invoiceId}`);
    }
  } catch (error) {
    console.error('Error stopping follow-ups:', error);
  }
}

