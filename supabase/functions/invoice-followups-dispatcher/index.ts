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
async function sendEmail({ to, subject, html, text, attachments }: { to: string; subject: string; html?: string; text?: string; attachments?: Array<{ filename: string; content: string }> }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
  if (!RESEND_API_KEY) {
    return { id: 'simulated', status: 'sent' }
  }
  
  const payload: any = {
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
    text
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments;
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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
      .select(`
        id, 
        user_id, 
        client_id, 
        invoice_number, 
        title, 
        status, 
        due_date, 
        issue_date,
        final_amount,
        amount,
        net_amount,
        tax_amount,
        discount_amount,
        description,
        notes,
        quote_id,
        quote:quotes(
          id,
          quote_tasks(
            id,
            name,
            description,
            quantity,
            unit,
            unit_price,
            total_price
          )
        )
      `)
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
    
    // Check if this is an automated follow-up (automatic email sending)
    // Manual follow-ups (automated: false) are allowed for all plans
    // Only automated follow-ups (automated: true) require Pro plan
    if (followUp.meta?.automated === true) {
      // Check if user has Pro plan with automatic reminders feature
      const { data: userData, error: userError } = await admin
        .from('users')
        .select('selected_plan, subscription_status')
        .eq('id', followUp.user_id)
        .single();
      
      // Only send automatic emails for Pro plan users with active subscription
      const hasAutomaticReminders = userData && 
        userData.selected_plan === 'pro' && 
        ['trial', 'trialing', 'active'].includes(userData.subscription_status);
      
      if (!hasAutomaticReminders) {
        // Skip automatic email sending for Starter plan users
        console.log(`Skipping automatic email for follow-up ${followUp.id} - Starter plan users must send manually`);
        await admin.from('invoice_follow_ups').update({
          status: 'stopped',
          last_error: 'Automatic reminders require Pro plan',
          meta: {
            ...followUp.meta,
            stopped_reason: 'starter_plan_restriction',
            stopped_at: new Date().toISOString()
          }
        }).eq('id', followUp.id);
        return { success: false, error: 'Automatic reminders require Pro plan' };
      }
    }

    const { data: clientData, error: cErr } = await admin
      .from('clients')
      .select('email, name, language_preference, phone, address, city, postal_code, country')
      .eq('id', invoice.client_id)
      .single()

    if (cErr || !clientData || !clientData.email) {
      console.error('Client not found or no email for invoice:', invoice.invoice_number);
      return { success: false, error: 'Client not found or no email' };
    }
    
    client = clientData;
    
    // Get client's language preference (default to 'fr')
    const clientLanguage = (clientData.language_preference || 'fr').split('-')[0] || 'fr';

    // Get company info for company_name variable
    const { data: companyProfile, error: companyError } = await admin
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', invoice.user_id)
      .eq('is_default', true)
      .maybeSingle();
    
    const companyName = companyProfile?.company_name || 'Votre entreprise';

    // ========================================
    // 2. FETCH TEMPLATE FROM DATABASE USING CLIENT LANGUAGE PREFERENCE
    // ========================================
    // Get template type from follow-up meta or default to invoice_overdue_reminder
    const templateType = followUp.meta?.template_type || followUp.meta?.approaching_template || followUp.meta?.overdue_template || 'invoice_overdue_reminder';
    
    // Fetch template from database using client's current language preference
    let { data: template, error: templateError } = await admin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_type', templateType)
      .eq('language', clientLanguage)
      .eq('is_active', true)
      .maybeSingle();
    
    // If template not found in client language, try French as fallback
    if (templateError || !template) {
      if (clientLanguage !== 'fr') {
        const { data: frenchTemplate, error: frenchError } = await admin
          .from('email_templates')
          .select('subject, html_content, text_content')
          .eq('template_type', templateType)
          .eq('language', 'fr')
          .eq('is_active', true)
          .maybeSingle();
        
        if (!frenchError && frenchTemplate) {
          template = frenchTemplate;
          templateError = null;
        }
      }
    }
    
    // If still no template, try any active template as final fallback
    if (templateError || !template) {
      const { data: fallbackTemplate, error: fallbackError } = await admin
        .from('email_templates')
        .select('subject, html_content, text_content')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (!fallbackError && fallbackTemplate) {
        template = fallbackTemplate;
        templateError = null;
      }
    }
    
    // If no template found, use stored templates from follow-up record as last resort
    if (templateError || !template) {
      console.warn(`Template ${templateType} not found in database for language ${clientLanguage}, using stored template from follow-up record`);
    }

    // ========================================
    // 3. PREPARE EMAIL CONTENT FROM DATABASE TEMPLATE
    // ========================================
    // Use database template if available, otherwise fall back to stored template
    const subject = template?.subject || followUp.template_subject || 'Payment Reminder';
    const html = template?.html_content || followUp.template_html || '';
    const text = template?.text_content || followUp.template_text || '';

    // Replace dynamic variables that need real-time calculation
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : today;
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.haliqo.com';
    const invoiceLink = `${siteUrl}/invoice/${invoice.id}`;

    // Format dates and amounts based on client language
    const dateLocale = clientLanguage === 'fr' ? 'fr-FR' : clientLanguage === 'nl' ? 'nl-NL' : 'en-US';
    const formattedIssueDate = issueDate.toLocaleDateString(dateLocale);
    const formattedDueDate = dueDate.toLocaleDateString(dateLocale);
    const invoiceAmount = parseFloat(invoice.final_amount || invoice.amount || 0);
    const formattedAmount = new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'EUR' }).format(invoiceAmount);

    // Final variable replacement - use database template with all variables
    const finalSubject = subject
      .replace(/{invoice_number}/g, invoice.invoice_number)
      .replace(/{client_name}/g, clientData.name || 'Madame, Monsieur')
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0')
      .replace(/{company_name}/g, companyName);
    
    const finalHtml = html
      .replace(/{invoice_number}/g, invoice.invoice_number)
      .replace(/{client_name}/g, clientData.name || 'Madame, Monsieur')
      .replace(/{invoice_amount}/g, formattedAmount)
      .replace(/{issue_date}/g, formattedIssueDate)
      .replace(/{due_date}/g, formattedDueDate)
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0')
      .replace(/{invoice_link}/g, invoiceLink)
      .replace(/{company_name}/g, companyName);
    
    const finalText = text
      .replace(/{invoice_number}/g, invoice.invoice_number)
      .replace(/{client_name}/g, clientData.name || 'Madame, Monsieur')
      .replace(/{invoice_amount}/g, formattedAmount)
      .replace(/{issue_date}/g, formattedIssueDate)
      .replace(/{due_date}/g, formattedDueDate)
      .replace(/{days_overdue}/g, daysOverdue > 0 ? daysOverdue.toString() : '0')
      .replace(/{days_until_due}/g, daysUntilDue > 0 ? daysUntilDue.toString() : '0')
      .replace(/{invoice_link}/g, invoiceLink)
      .replace(/{company_name}/g, companyName);

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
    // 4. GENERATE PDF ATTACHMENT
    // ========================================
    let pdfAttachment = null;
    try {
      // Get company profile for PDF generation
      const { data: companyProfile, error: companyErr } = await admin
        .from('company_profiles')
        .select('*')
        .eq('user_id', invoice.user_id)
        .eq('is_default', true)
        .maybeSingle();

      // Prepare invoice data for PDF generation (same structure as frontend)
      const invoiceDataForPDF = {
        companyInfo: companyProfile ? {
          name: companyProfile.company_name,
          address: companyProfile.address,
          postalCode: companyProfile.postal_code,
          city: companyProfile.city,
          email: companyProfile.email,
          phone: companyProfile.phone,
          vatNumber: companyProfile.vat_number,
          iban: companyProfile.iban,
          accountName: companyProfile.account_name,
          bankName: companyProfile.bank_name,
          logo: companyProfile.logo_url ? { url: companyProfile.logo_url } : null
        } : {},
        client: clientData,
        invoice: {
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: invoice.amount,
          net_amount: invoice.net_amount,
          tax_amount: invoice.tax_amount,
          discount_amount: invoice.discount_amount,
          final_amount: invoice.final_amount,
          description: invoice.description,
          title: invoice.title,
          notes: invoice.notes
        },
        quote: invoice.quote || null
      };

      // Generate PDF using the same HTML template as frontend
      const pdfBase64 = await generateInvoicePDFServerSide(invoiceDataForPDF, invoice.invoice_number);
      
      if (pdfBase64) {
        pdfAttachment = {
          filename: `facture-${invoice.invoice_number}.pdf`,
          content: pdfBase64
        };
      }
    } catch (pdfError) {
      console.warn('Error generating PDF for follow-up:', pdfError);
      // Continue without PDF attachment if generation fails
    }

    // ========================================
    // 5. SEND EMAIL WITH PDF ATTACHMENT
    // ========================================
    const emailPayload: any = {
      to: client.email,
      subject: finalSubject,
      html: finalHtml,
      text: finalText
    };

    if (pdfAttachment) {
      emailPayload.attachments = [pdfAttachment];
    }

    const resp = await sendEmail(emailPayload)

    // ========================================
    // 6. UPDATE FOLLOW-UP STATUS
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

/**
 * Generate invoice PDF server-side using the same HTML template as frontend
 * Returns base64 encoded PDF string
 */
async function generateInvoicePDFServerSide(invoiceData: any, invoiceNumber: string): Promise<string | null> {
  try {
    // Generate HTML using the same template as frontend
    const html = generateInvoiceHTMLServerSide(invoiceData, invoiceNumber);
    
    // Use Gotenberg or similar HTML-to-PDF service
    // Gotenberg is a Docker service that converts HTML to PDF using Chromium
    const gotenbergUrl = Deno.env.get('GOTENBERG_URL') || Deno.env.get('PDF_GENERATION_SERVICE_URL');
    
    if (gotenbergUrl) {
      try {
        // Call Gotenberg API to convert HTML to PDF
        const formData = new FormData();
        formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
        
        const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          return base64;
        }
      } catch (serviceError) {
        console.warn('PDF service error:', serviceError);
      }
    }
    
    // Alternative: Use html-pdf-api or similar service
    const htmlPdfApiKey = Deno.env.get('HTML_PDF_API_KEY');
    if (htmlPdfApiKey) {
      try {
        const response = await fetch('https://api.htmlpdfapi.com/v1/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': htmlPdfApiKey
          },
          body: JSON.stringify({ html })
        });
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          return base64;
        }
      } catch (apiError) {
        console.warn('HTML PDF API error:', apiError);
      }
    }
    
    // Fallback: If no service is configured, return null
    // In production, you should configure one of the above services
    console.warn('PDF generation service not configured. Set GOTENBERG_URL or HTML_PDF_API_KEY environment variable.');
    return null;
    
  } catch (error) {
    console.error('Error in generateInvoicePDFServerSide:', error);
    return null;
  }
}

/**
 * Generate invoice HTML server-side (same as frontend generateInvoiceHTML)
 */
function generateInvoiceHTMLServerSide(invoiceData: any, invoiceNumber: string): string {
  const { companyInfo, client, invoice, quote } = invoiceData;
  
  // Color scheme matching quote preview
  const primaryColor = '#374151'; // Dark gray
  const secondaryColor = '#1f2937'; // Darker gray
  const primaryColorLight = `${primaryColor}20`; // 20% opacity for backgrounds
  
  const currentDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '';
  
  // Get invoice lines from quote tasks if available, otherwise create a single line
  let invoiceLines: any[] = [];
  if (quote && quote.quote_tasks && quote.quote_tasks.length > 0) {
    invoiceLines = quote.quote_tasks.map((task: any, index: number) => ({
      number: index + 1,
      description: task.description || task.name || '',
      quantity: task.quantity || 1,
      unit: task.unit || '',
      unitPrice: parseFloat(task.unit_price || 0),
      totalPrice: parseFloat(task.total_price || 0)
    }));
  } else {
    // Single line from invoice summary
    invoiceLines = [{
      number: 1,
      description: invoice.description || invoice.title || 'Facture',
      quantity: 1,
      unit: '',
      unitPrice: parseFloat(invoice.amount || 0),
      totalPrice: parseFloat(invoice.amount || 0)
    }];
  }
  
  const subtotal = parseFloat(invoice.net_amount || invoice.amount || 0);
  const taxAmount = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.final_amount || invoice.amount || 0);
  
  // Helper to escape HTML
  const escapeHtml = (text: any) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  // Get logo URL if available
  let logoHtml = '';
  if (companyInfo?.logo) {
    if (companyInfo.logo.url) {
      logoHtml = `<img src="${companyInfo.logo.url}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    }
  }
  
  return `
    <div style="max-width: 900px; margin: 0 auto; font-family: 'Arial', 'Helvetica', sans-serif; background: #ffffff; padding: 40px;">
      <!-- Header with Logo and Invoice Info -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; padding-bottom: 30px; border-bottom: 2px solid ${primaryColor};">
        <div style="flex: 1; display: flex; align-items: center; gap: 20px;">
          ${logoHtml ? `<div style="flex-shrink: 0;">${logoHtml}</div>` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; font-weight: bold;">LOGO</div>'}
          <div>
            <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: bold; line-height: 1.2;">${escapeHtml(companyInfo?.name || 'VOTRE ENTREPRISE')}</h1>
            <p style="margin: 5px 0 0 0; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">Artisan professionnel</p>
          </div>
        </div>
        <div style="text-align: right; flex: 1;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px; color: ${primaryColor}; font-weight: bold; letter-spacing: 1px;">FACTURE</h2>
          <p style="margin: 8px 0; font-size: 20px; color: ${primaryColor}; font-weight: bold;">${escapeHtml(invoiceNumber || 'N/A')}</p>
          <p style="margin: 5px 0; color: ${secondaryColor}; font-size: 14px;">Date: ${currentDate}</p>
          ${dueDate ? `<p style="margin: 5px 0; color: ${secondaryColor}; font-size: 14px;">Échéance: ${dueDate}</p>` : ''}
        </div>
      </div>
      
      <!-- Company and Client Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 50px;">
        <div>
          <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">CLIENT</h3>
          <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">${escapeHtml(client?.name || 'Client')}</p>
            ${client?.email ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.email)}</p>` : ''}
            ${client?.phone ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.phone)}</p>` : ''}
            ${client?.address ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.address)}</p>` : ''}
            ${client?.postal_code && client?.city ? `<p style="margin: 0;">${escapeHtml(client.postal_code)} ${escapeHtml(client.city)}</p>` : ''}
            ${client?.country ? `<p style="margin: 5px 0 0 0;">${escapeHtml(client.country)}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">ENTREPRISE</h3>
          <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo?.address || '')}</p>
            <p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo?.postalCode || '')} ${escapeHtml(companyInfo?.city || '')}</p>
            ${companyInfo?.email ? `<p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo.email)}</p>` : ''}
            ${companyInfo?.phone ? `<p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo.phone)}</p>` : ''}
            ${companyInfo?.vatNumber ? `<p style="margin: 5px 0 0 0; font-weight: 500;">TVA: ${escapeHtml(companyInfo.vatNumber)}</p>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Payment Information -->
      ${(companyInfo?.iban || companyInfo?.accountName || companyInfo?.bankName) ? `
      <div style="margin-bottom: 50px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">INFORMATIONS DE PAIEMENT</h3>
        <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
          ${companyInfo?.iban ? `<p style="margin: 0 0 8px 0;"><strong>IBAN:</strong> ${escapeHtml(companyInfo.iban)}</p>` : ''}
          ${companyInfo?.accountName ? `<p style="margin: 0 0 8px 0;"><strong>Nom du compte:</strong> ${escapeHtml(companyInfo.accountName)}</p>` : ''}
          ${companyInfo?.bankName ? `<p style="margin: 0 0 8px 0;"><strong>Banque:</strong> ${escapeHtml(companyInfo.bankName)}</p>` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Invoice Lines Table -->
      <div style="margin-bottom: 50px;">
        <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">DÉTAIL DES PRESTATIONS</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
          <thead>
            <tr style="background-color: ${primaryColorLight};">
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">N°</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: left; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Désignation</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Qté</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Prix U.</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceLines.map((line: any, index: number) => `
              <tr style="${index % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'}">
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: ${secondaryColor}; font-size: 14px;">${line.number}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; color: ${secondaryColor}; font-size: 14px;">${escapeHtml(line.description)}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: ${secondaryColor}; font-size: 14px;">${line.quantity} ${escapeHtml(line.unit)}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">${line.unitPrice.toFixed(2)} €</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">${line.totalPrice.toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; font-weight: bold; color: ${primaryColor}; font-size: 14px;" colspan="4">SOUS-TOTAL HT:</td>
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${subtotal.toFixed(2)} €</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; font-weight: bold; color: ${primaryColor}; font-size: 14px;" colspan="4">TVA:</td>
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${taxAmount.toFixed(2)} €</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 16px 12px; font-weight: bold; color: ${primaryColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;" colspan="4">TOTAL TTC:</td>
              <td style="border: 1px solid #d1d5db; padding: 16px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 18px;">${total.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
    </div>
  `;
}

