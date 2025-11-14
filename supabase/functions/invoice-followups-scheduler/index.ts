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

    // Check if this is a frontend-triggered request
    const body = await req.json().catch(() => ({}));
    const { action, invoice_id, status } = body;
    
    if (action === 'create_followup_for_invoice' && invoice_id) {
      // Frontend request to create follow-up for specific invoice
      const { data: invoice, error: invoiceError } = await admin
        .from('invoices')
        .select(`
          id, user_id, client_id, invoice_number, title, status, due_date, issue_date, final_amount
        `)
        .eq('id', invoice_id)
        .in('status', ['unpaid', 'overdue'])
        .single();
      
      if (invoiceError || !invoice) {
        console.error('Invoice not found or not in valid status:', invoiceError);
        return new Response(JSON.stringify({ error: 'Invoice not found or not in valid status' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Use hardcoded default rules
      const globalRules = {
        max_stages: 3,
        approaching_deadline_days: 3,      // Send reminder 3 days before due date
        stage_1_delay: 1,                   // 1 day after due date
        stage_2_delay: 3,                   // 3 days after due date
        stage_3_delay: 7,                   // 7 days after due date
        max_attempts_per_stage: 3,
        approaching_template: 'invoice_payment_reminder',
        overdue_template: 'invoice_overdue_reminder'
      };
      
      // Create initial follow-up based on due date
      await createInitialFollowUpForInvoice(admin, invoice, globalRules);
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Follow-up created for invoice ${invoice.invoice_number}`,
        invoice_id: invoice.id
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (action === 'cleanup_finalized_invoice' && invoice_id) {
      // Frontend request to cleanup follow-ups when invoice is paid/cancelled
      const { data: invoice, error: invoiceError } = await admin
        .from('invoices')
        .select(`id, status, invoice_number, user_id, client_id`)
        .eq('id', invoice_id)
        .in('status', ['paid', 'cancelled'])
        .single();
      
      if (invoiceError || !invoice) {
        console.error('Invoice not found or not finalized:', invoiceError);
        return new Response(JSON.stringify({ error: 'Invoice not found or not finalized' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // IMMEDIATELY STOP ALL PENDING FOLLOW-UPS FOR THIS INVOICE
      const { error: cleanupError } = await admin
        .from('invoice_follow_ups')
        .update({ 
          status: 'stopped', 
          updated_at: new Date().toISOString(),
          meta: {
            stopped_reason: 'invoice_finalized',
            stopped_at: new Date().toISOString(),
            final_status: invoice.status,
            cleanup_triggered_by: 'frontend_request'
          }
        })
        .eq('invoice_id', invoice_id)
        .in('status', ['pending', 'scheduled']);
      
      if (cleanupError) {
        console.error(`Error cleaning up follow-ups for invoice ${invoice.invoice_number}:`, cleanupError);
        return new Response(JSON.stringify({ error: 'Failed to cleanup follow-ups' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Log the cleanup event
      await admin
        .from('invoice_events')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          type: 'followups_stopped',
          meta: {
            reason: 'invoice_finalized',
            final_status: invoice.status,
            automated: false,
            triggered_by: 'frontend_request',
            timestamp: new Date().toISOString()
          }
        });
      
      return new Response(JSON.stringify({ 
        ok: true, 
        message: `Follow-ups cleaned up for ${invoice.status} invoice`,
        invoice_id: invoice.id,
        status: invoice.status,
        cleanup_completed: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // ========================================
    // 1. PROCESS INVOICES APPROACHING DEADLINE
    // ========================================
    const globalRules = {
      max_stages: 3,
      approaching_deadline_days: 3,      // Send reminder 3 days before due date
      stage_1_delay: 1,                   // 1 day after due date
      stage_2_delay: 3,                   // 3 days after due date
      stage_3_delay: 7,                   // 7 days after due date
      max_attempts_per_stage: 3,
      approaching_template: 'invoice_payment_reminder',
      overdue_template: 'invoice_overdue_reminder'
    };

    // Find invoices approaching deadline (3 days before due date)
    const approachingDate = new Date();
    approachingDate.setDate(approachingDate.getDate() + globalRules.approaching_deadline_days);
    const approachingDateStr = approachingDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: approachingInvoices, error: approachingErr } = await admin
      .from('invoices')
      .select(`
        id, user_id, client_id, invoice_number, title, status, due_date, issue_date, final_amount
      `)
      .eq('status', 'unpaid')
      .eq('due_date', approachingDateStr)
      .limit(1000);
    
    if (approachingErr) {
      console.error('Error finding approaching invoices:', approachingErr);
    } else {
      for (const invoice of approachingInvoices || []) {
        await createApproachingDeadlineFollowUp(admin, invoice, globalRules);
      }
    }

    // ========================================
    // 2. PROCESS OVERDUE INVOICES
    // ========================================
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: overdueInvoices, error: overdueErr } = await admin
      .from('invoices')
      .select(`
        id, user_id, client_id, invoice_number, title, status, due_date, issue_date, final_amount
      `)
      .in('status', ['unpaid', 'overdue'])
      .lt('due_date', today)
      .limit(1000);
    
    if (overdueErr) {
      console.error('Error finding overdue invoices:', overdueErr);
    } else {
      for (const invoice of overdueInvoices || []) {
        await createOverdueFollowUp(admin, invoice, globalRules);
      }
    }

    // ========================================
    // 3. CLEAN UP PAID/CANCELLED INVOICES
    // ========================================
    await cleanupPaidCancelledInvoices(admin);

    // ========================================
    // 4. PROGRESS FOLLOW-UP STAGES
    // ========================================
    await progressFollowUpStages(admin, globalRules);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})

/**
 * Create initial follow-up for invoice
 */
async function createInitialFollowUpForInvoice(admin: any, invoice: any, rules: any) {
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue > rules.approaching_deadline_days) {
    // Too early, schedule for approaching deadline
    const scheduledDate = new Date(dueDate);
    scheduledDate.setDate(scheduledDate.getDate() - rules.approaching_deadline_days);
    await createApproachingDeadlineFollowUp(admin, invoice, rules, scheduledDate);
  } else if (daysUntilDue > 0) {
    // Approaching deadline, create now
    await createApproachingDeadlineFollowUp(admin, invoice, rules);
  } else {
    // Overdue, create overdue follow-up
    await createOverdueFollowUp(admin, invoice, rules);
  }
}

/**
 * Create follow-up for approaching deadline
 */
async function createApproachingDeadlineFollowUp(admin: any, invoice: any, rules: any, scheduledDate?: Date) {
  try {
    // Get client details
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('name, email')
      .eq('id', invoice.client_id)
      .single();
    
    if (clientError || !client) {
      console.warn('Could not get client details for invoice', invoice.id);
      return;
    }
    
    // Check if follow-up already exists for this invoice
    const { data: existingFollowUp, error: checkError } = await admin
      .from('invoice_follow_ups')
      .select('id, stage, status')
      .eq('invoice_id', invoice.id)
      .eq('meta->>follow_up_type', 'approaching_deadline')
      .in('status', ['pending', 'scheduled'])
      .maybeSingle();
    
    if (checkError) {
      console.warn('Error checking existing follow-up:', checkError);
      return;
    }
    
    if (existingFollowUp) {
      // Follow-up already exists
      return;
    }
    
    // Calculate scheduled date
    if (!scheduledDate) {
      const dueDate = new Date(invoice.due_date);
      scheduledDate = new Date(dueDate);
      scheduledDate.setDate(scheduledDate.getDate() - rules.approaching_deadline_days);
    }
    
    // Get template
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('id, subject, html_content, text_content')
      .eq('template_type', rules.approaching_template)
      .eq('is_active', true)
      .maybeSingle();
    
    if (templateError || !template) {
      console.error(`Template ${rules.approaching_template} not found:`, templateError);
      return;
    }
    
    // Calculate days until due
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Replace template variables
    const subject = template.subject
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{days_until_due}', daysUntilDue.toString())
      .replace('{due_date}', dueDate.toLocaleDateString('fr-FR'));
    
    const text = template.text_content
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{invoice_amount}', invoice.final_amount?.toString() || '0')
      .replace('{days_until_due}', daysUntilDue.toString())
      .replace('{due_date}', dueDate.toLocaleDateString('fr-FR'))
      .replace('{invoice_link}', `${Deno.env.get('SITE_URL') || 'https://www.haliqo.com'}/invoice/${invoice.id}`);
    
    const html = template.html_content
      .replace(/{invoice_number}/g, invoice.invoice_number)
      .replace(/{client_name}/g, client.name || 'Madame, Monsieur')
      .replace(/{invoice_amount}/g, invoice.final_amount?.toString() || '0')
      .replace(/{days_until_due}/g, daysUntilDue.toString())
      .replace(/{due_date}/g, dueDate.toLocaleDateString('fr-FR'))
      .replace(/{invoice_link}/g, `${Deno.env.get('SITE_URL') || 'https://www.haliqo.com'}/invoice/${invoice.id}`);
    
    // Create follow-up
    const { error: followUpError } = await admin
      .from('invoice_follow_ups')
      .insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        client_id: invoice.client_id,
        stage: 1,
        status: 'scheduled',
        scheduled_at: scheduledDate.toISOString(),
        template_subject: subject,
        template_text: text,
        template_html: html,
        template_id: template.id,
        attempts: 0,
        max_attempts: rules.max_attempts_per_stage,
        channel: 'email',
        automated: true,
        meta: {
          follow_up_type: 'approaching_deadline',
          automated: true,
          priority: 'medium',
          template_type: rules.approaching_template,
          days_until_due: daysUntilDue
        }
      });
    
    if (followUpError) {
      console.error('Error creating approaching deadline follow-up:', followUpError);
    }
  } catch (error) {
    console.error('Error creating approaching deadline follow-up:', error);
  }
}

/**
 * Create follow-up for overdue invoice
 */
async function createOverdueFollowUp(admin: any, invoice: any, rules: any) {
  try {
    // Get client details
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('name, email')
      .eq('id', invoice.client_id)
      .single();
    
    if (clientError || !client) {
      console.warn('Could not get client details for invoice', invoice.id);
      return;
    }
    
    // Check for existing overdue follow-up
    const { data: existingFollowUp, error: checkError } = await admin
      .from('invoice_follow_ups')
      .select('id, stage, status, attempts, max_attempts')
      .eq('invoice_id', invoice.id)
      .eq('meta->>follow_up_type', 'overdue')
      .in('status', ['pending', 'scheduled', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (checkError) {
      console.warn('Error checking existing follow-up:', checkError);
      return;
    }
    
    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine stage based on days overdue
    let stage = 1;
    let scheduledDate = new Date();
    
    if (existingFollowUp) {
      // Check if we should progress to next stage
      if (existingFollowUp.attempts >= existingFollowUp.max_attempts) {
        stage = Math.min(existingFollowUp.stage + 1, rules.max_stages);
        if (stage === 2) {
          scheduledDate.setDate(scheduledDate.getDate() + rules.stage_2_delay);
        } else if (stage === 3) {
          scheduledDate.setDate(scheduledDate.getDate() + rules.stage_3_delay);
        }
      } else {
        // Same stage, reschedule for next attempt (1 day delay)
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        stage = existingFollowUp.stage;
      }
    } else {
      // New overdue follow-up, stage 1 (1 day after due date)
      scheduledDate.setDate(scheduledDate.getDate() + rules.stage_1_delay);
      stage = 1;
    }
    
    // Get template
    const { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('id, subject, html_content, text_content')
      .eq('template_type', rules.overdue_template)
      .eq('is_active', true)
      .maybeSingle();
    
    if (templateError || !template) {
      console.error(`Template ${rules.overdue_template} not found:`, templateError);
      return;
    }
    
    // Replace template variables
    const subject = template.subject
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{days_overdue}', daysOverdue.toString());
    
    const text = template.text_content
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{client_name}', client.name || 'Madame, Monsieur')
      .replace('{invoice_amount}', invoice.final_amount?.toString() || '0')
      .replace('{days_overdue}', daysOverdue.toString())
      .replace('{due_date}', dueDate.toLocaleDateString('fr-FR'))
      .replace('{invoice_link}', `${Deno.env.get('SITE_URL') || 'https://www.haliqo.com'}/invoice/${invoice.id}`);
    
    const html = template.html_content
      .replace(/{invoice_number}/g, invoice.invoice_number)
      .replace(/{client_name}/g, client.name || 'Madame, Monsieur')
      .replace(/{invoice_amount}/g, invoice.final_amount?.toString() || '0')
      .replace(/{days_overdue}/g, daysOverdue.toString())
      .replace(/{due_date}/g, dueDate.toLocaleDateString('fr-FR'))
      .replace(/{invoice_link}/g, `${Deno.env.get('SITE_URL') || 'https://www.haliqo.com'}/invoice/${invoice.id}`);
    
    if (existingFollowUp) {
      // Update existing follow-up
      const { error: updateError } = await admin
        .from('invoice_follow_ups')
        .update({
          stage: stage,
          status: 'scheduled',
          scheduled_at: scheduledDate.toISOString(),
          template_subject: subject,
          template_text: text,
          template_html: html,
          template_id: template.id,
          updated_at: new Date().toISOString(),
          meta: {
            ...existingFollowUp.meta,
            follow_up_type: 'overdue',
            days_overdue: daysOverdue,
            priority: stage > 1 ? 'high' : 'medium'
          }
        })
        .eq('id', existingFollowUp.id);
      
      if (updateError) {
        console.error('Error updating overdue follow-up:', updateError);
      }
    } else {
      // Create new follow-up
      const { error: followUpError } = await admin
        .from('invoice_follow_ups')
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          client_id: invoice.client_id,
          stage: stage,
          status: 'scheduled',
          scheduled_at: scheduledDate.toISOString(),
          template_subject: subject,
          template_text: text,
          template_html: html,
          template_id: template.id,
          attempts: 0,
          max_attempts: rules.max_attempts_per_stage,
          channel: 'email',
          automated: true,
          meta: {
            follow_up_type: 'overdue',
            automated: true,
            priority: 'high',
            template_type: rules.overdue_template,
            days_overdue: daysOverdue
          }
        });
      
      if (followUpError) {
        console.error('Error creating overdue follow-up:', followUpError);
      }
    }
  } catch (error) {
    console.error('Error creating overdue follow-up:', error);
  }
}

/**
 * Clean up follow-ups for paid/cancelled invoices
 */
async function cleanupPaidCancelledInvoices(admin: any) {
  try {
    const { data: finalizedInvoices, error: finalError } = await admin
      .from('invoices')
      .select('id, invoice_number, status')
      .in('status', ['paid', 'cancelled'])
      .limit(100);
    
    if (finalError) {
      console.error('Error finding finalized invoices:', finalError);
      return;
    }
    
    for (const invoice of finalizedInvoices || []) {
      const { error: stopError } = await admin
        .from('invoice_follow_ups')
        .update({ 
          status: 'stopped', 
          updated_at: new Date().toISOString() 
        })
        .eq('invoice_id', invoice.id)
        .in('status', ['pending', 'scheduled']);
      
      if (stopError) {
        console.error(`Error stopping follow-ups for invoice ${invoice.invoice_number}:`, stopError);
      }
    }
  } catch (error) {
    console.error('Error cleaning up paid/cancelled invoices:', error);
  }
}

/**
 * Progress follow-up stages
 */
async function progressFollowUpStages(admin: any, rules: any) {
  try {
    const { data: followUps, error: fuError } = await admin
      .from('invoice_follow_ups')
      .select(`
        id, invoice_id, stage, attempts, max_attempts, status, scheduled_at,
        invoices!inner(invoice_number, status, due_date, user_id, client_id, final_amount)
      `)
      .eq('status', 'sent')
      .limit(100);
    
    if (fuError) {
      console.error('Error finding follow-ups to progress:', fuError);
      return;
    }
    
    for (const followUp of followUps || []) {
      const invoice = followUp.invoices;
      
      // Check if invoice is still valid for follow-up
      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        await admin
          .from('invoice_follow_ups')
          .update({
            status: 'stopped',
            updated_at: new Date().toISOString()
          })
          .eq('id', followUp.id);
        continue;
      }
      
      // Check if we should progress to next stage
      if (followUp.attempts >= followUp.max_attempts) {
        const nextStage = followUp.stage + 1;
        
        if (nextStage <= rules.max_stages) {
          let delayDays = 0;
          switch (nextStage) {
            case 2: delayDays = rules.stage_2_delay; break;
            case 3: delayDays = rules.stage_3_delay; break;
            default: delayDays = rules.stage_3_delay; break;
          }
          
          const nextScheduledAt = new Date();
          nextScheduledAt.setDate(nextScheduledAt.getDate() + delayDays);
          
          const { error: updateError } = await admin
            .from('invoice_follow_ups')
            .update({
              stage: nextStage,
              status: `stage_${followUp.stage}_completed`,
              attempts: 0,
              scheduled_at: nextScheduledAt.toISOString(),
              updated_at: new Date().toISOString(),
              meta: {
                ...followUp.meta,
                priority: 'high',
                stage_progressed: true
              }
            })
            .eq('id', followUp.id);
          
          if (updateError) {
            console.error('Error progressing follow-up stage:', updateError);
          }
        } else {
          // All stages completed
          await admin
            .from('invoice_follow_ups')
            .update({
              status: 'all_stages_completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', followUp.id);
        }
      }
    }
  } catch (error) {
    console.error('Error progressing follow-up stages:', error);
  }
}

