// @ts-ignore
declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { emailType, emailData } = await req.json();
    
    // Check if required environment variables are set
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    
    if (!resendApiKey || !fromEmail) {
      throw new Error('Email service not configured: Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
    }

    // Create Supabase client for any database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper function to get and render email template from database
    const getEmailTemplate = async (templateType: string, language: string = 'fr', userId: string | null = null) => {
      try {
        let query = supabase
          .from('email_templates')
          .select('*')
          .eq('template_type', templateType)
          .eq('language', language)
          .eq('is_active', true);
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data: userTemplate, error: userError } = await query.maybeSingle();
        
        if (userTemplate) {
          return { success: true, data: userTemplate };
        }
        
        // Fallback to default template
        const { data: defaultTemplate, error: defaultError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_type', templateType)
          .eq('language', language)
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (defaultTemplate) {
          return { success: true, data: defaultTemplate };
        }
        
        // If no template found in requested language, try French as fallback
        if (language !== 'fr') {
          const { data: frenchTemplate, error: frenchError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_type', templateType)
            .eq('language', 'fr')
            .eq('is_default', true)
            .eq('is_active', true)
            .maybeSingle();
          
          if (frenchTemplate) {
            return { success: true, data: frenchTemplate };
          }
        }
        
        return { success: false, error: 'Template not found' };
      } catch (error: any) {
        console.error('Error getting email template:', error);
        return { success: false, error: error.message };
      }
    };

    // Helper function to render template with variables
    const renderTemplate = (template: any, variables: any) => {
      let html = template.html_content || '';
      let text = template.text_content || '';
      let subject = template.subject || '';
      
      // Replace variables in content
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        const value = variables[key] || '';
        html = html.replace(regex, value);
        text = text.replace(regex, value);
        subject = subject.replace(regex, value);
      });
      
      return { subject, html, text };
    };

    let emailResult;
    
    // Send email using Resend API directly (since npm:resend doesn't work in Deno)
    const sendEmail = async (emailPayload: any) => {
      // Prepare attachments if provided
      // Resend API expects: { content: base64String, filename: string }
      const attachments = emailPayload.attachments ? emailPayload.attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content // Base64 encoded content (without data URL prefix)
      })) : undefined;

      const payload: any = {
        from: emailPayload.from,
        to: emailPayload.to,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text
      };

      // Add reply-to if provided
      if (emailPayload.replyTo) {
        payload.reply_to = emailPayload.replyTo;
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    };
    
    switch (emailType) {
      case 'invoice_sent':
        // Use database template for invoice sent emails
        const invoiceLanguage = emailData.language || 'fr';
        const invoiceTemplate = await getEmailTemplate('invoice_sent', invoiceLanguage, emailData.user_id || null);
        if (invoiceTemplate.success) {
          const invoiceDate = emailData.issue_date || new Date().toLocaleDateString(invoiceLanguage === 'fr' ? 'fr-FR' : invoiceLanguage === 'nl' ? 'nl-NL' : 'en-US');
          const dueDate = emailData.due_date || '';
          const invoiceAmount = emailData.invoice_amount || '0.00€';
          const variables = {
            invoice_number: emailData.invoice_number || '',
            invoice_title: emailData.invoice_title || emailData.invoice_number || '',
            client_name: emailData.client_name || 'Madame, Monsieur',
            invoice_amount: invoiceAmount,
            issue_date: invoiceDate,
            due_date: dueDate,
            company_name: emailData.company_name || 'Haliqo',
            custom_message: emailData.custom_message || (invoiceLanguage === 'fr' ? 'Veuillez trouver ci-joint notre facture.' : invoiceLanguage === 'nl' ? 'Gelieve onze factuur bijgevoegd te vinden.' : 'Please find attached our invoice.')
          };
          const rendered = renderTemplate(invoiceTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.client_email],
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            attachments: emailData.attachments || undefined
          });
        } else {
          // Fallback to templated_email if template not found
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.client_email],
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            attachments: emailData.attachments || undefined
          });
        }
        break;
        
      case 'templated_email':
        // New template system for client emails (fallback for other types)
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.client_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          attachments: emailData.attachments || undefined
        });
        break;
        
      case 'new_lead_available':
        // Use database template
        const leadLanguage = emailData.language || 'fr';
        const leadTemplate = await getEmailTemplate('new_lead_available', leadLanguage, emailData.user_id || null);
        if (leadTemplate.success) {
          const location = emailData.leadData?.city && emailData.leadData?.zip_code 
            ? `${emailData.leadData.city}, ${emailData.leadData.zip_code}`
            : emailData.leadData?.city || emailData.leadData?.zip_code || 'N/A';
          const variables = {
            artisan_name: emailData.artisanData?.name || '',
            artisan_company_name: emailData.artisanData?.company_name || emailData.artisanData?.name || 'Artisan',
            project_description: emailData.project_description || emailData.leadData?.project_description || 'Projet',
            city: emailData.leadData?.city || '',
            zip_code: emailData.leadData?.zip_code || '',
            location: location,
            leads_management_url: emailData.leadData?.site_url ? `${emailData.leadData.site_url}/leads-management` : 'https://haliqo.com/leads-management',
            site_url: emailData.leadData?.site_url || 'https://haliqo.com',
            company_name: 'Haliqo'
          };
          const rendered = renderTemplate(leadTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.artisan_email],
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });
        } else {
          throw new Error(`Email template 'new_lead_available' not found in database for language '${leadLanguage}'. Please create the template in the email_templates table.`);
        }
        break;
        
      case 'lead_assigned':
        // Use database template
        const assignedLanguage = emailData.language || 'fr';
        const assignedTemplate = await getEmailTemplate('lead_assigned', assignedLanguage, emailData.user_id || null);
        if (assignedTemplate.success) {
          const location = emailData.leadData?.city && emailData.leadData?.zip_code 
            ? `${emailData.leadData.city}, ${emailData.leadData.zip_code}`
            : emailData.leadData?.city || emailData.leadData?.zip_code || 'N/A';
          const variables = {
            artisan_name: emailData.artisanData?.name || '',
            artisan_company_name: emailData.artisanData?.company_name || emailData.artisanData?.name || 'Artisan',
            project_description: emailData.project_description || emailData.leadData?.project_description || 'Projet',
            client_name: emailData.leadData?.client_name || 'Client',
            city: emailData.leadData?.city || '',
            zip_code: emailData.leadData?.zip_code || '',
            location: location,
            leads_management_url: emailData.leadData?.site_url ? `${emailData.leadData.site_url}/leads-management` : 'https://haliqo.com/leads-management',
            site_url: emailData.leadData?.site_url || 'https://haliqo.com',
            company_name: 'Haliqo'
          };
          const rendered = renderTemplate(assignedTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.artisan_email],
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });
        } else {
          throw new Error(`Email template 'lead_assigned' not found in database for language '${assignedLanguage}'. Please create the template in the email_templates table.`);
        }
        break;
        
      case 'quote_sent':
      case 'custom_quote_sent': // Support both for backward compatibility
        // Use database template
        const quoteLanguage = emailData.language || 'fr';
        const quoteTemplate = await getEmailTemplate('quote_sent', quoteLanguage, emailData.user_id || null);
        if (quoteTemplate.success) {
          const variables = {
            client_name: emailData.variables?.client_name || 'Madame, Monsieur',
            quote_number: emailData.variables?.quote_number || 'N/A',
            quote_title: emailData.variables?.quote_title || 'Votre projet',
            quote_amount: emailData.variables?.quote_amount || '0€',
            valid_until: emailData.variables?.valid_until || '30 jours',
            custom_message: emailData.message || emailData.variables?.custom_message || '',
            quote_link: emailData.variables?.quote_link || '#',
            company_name: emailData.variables?.company_name || 'Notre équipe'
          };
          const rendered = renderTemplate(quoteTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.message || rendered.text
          });
        } else {
          throw new Error(`Email template 'quote_sent' not found in database for language '${quoteLanguage}'. Please create the template in the email_templates table.`);
        }
        break;

      case 'quote_followup':
        // Handle follow-up emails for quotes
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateFollowUpEmail(emailData.html, emailData.variables),
          text: emailData.text
        });
        break;

      case 'quote_status_update':
        // Handle quote status update emails (accepted/rejected)
        // Determine template type based on status (accepted or rejected)
        const statusTemplateType = emailData.variables?.status === 'accepted' || emailData.variables?.quote_status === 'accepted' 
          ? 'client_accepted' 
          : 'client_rejected';
        
        // Get client language preference or default to 'fr'
        const statusLanguage = emailData.language || 'fr';
        
        // Fetch template from database
        const statusTemplate = await getEmailTemplate(statusTemplateType, statusLanguage, emailData.user_id || null);
        
        if (statusTemplate.success) {
          const variables = {
            client_name: emailData.variables?.client_name || 'Madame, Monsieur',
            quote_number: emailData.variables?.quote_number || 'N/A',
            quote_amount: emailData.variables?.quote_amount || '0€',
            quote_link: emailData.variables?.quote_link || '#',
            company_name: emailData.variables?.company_name || 'Notre équipe'
          };
          
          const rendered = renderTemplate(statusTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject,
            html: generateQuoteStatusEmail(emailData.html, emailData.variables),
            text: emailData.text
          });
        }
        break;
        
      case 'credit_insurance_application':
        // Use database template
        const applicationLanguage = emailData.language || 'fr';
        const applicationTemplate = await getEmailTemplate('credit_insurance_application', applicationLanguage, null);
        if (applicationTemplate.success) {
          const submissionDate = new Date().toLocaleString(applicationLanguage === 'fr' ? 'fr-FR' : applicationLanguage === 'nl' ? 'nl-NL' : 'en-US');
          const variables = {
            application_id: emailData.application?.id || 'N/A',
            submission_date: submissionDate,
            company_name: emailData.application?.companyName || '',
            contact_person: emailData.application?.contactPerson || '',
            email: emailData.application?.email || '',
            telephone: emailData.application?.telephone || '',
            address: emailData.application?.address || '',
            sector: emailData.application?.sector || '',
            activity_description: emailData.application?.activityDescription || '',
            annual_turnover: emailData.application?.annualTurnover || '0',
            top_customers: emailData.application?.topCustomers || ''
          };
          const rendered = renderTemplate(applicationTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          throw new Error(`Email template 'credit_insurance_application' not found in database for language '${applicationLanguage}'. Please create the template in the email_templates table.`);
        }
        break;
        
      case 'credit_insurance_confirmation':
        // Use database template
        const confirmationLanguage = emailData.language || 'fr';
        const confirmationTemplate = await getEmailTemplate('credit_insurance_confirmation', confirmationLanguage, null);
        if (confirmationTemplate.success) {
          const submissionDate = new Date().toLocaleString(confirmationLanguage === 'fr' ? 'fr-FR' : confirmationLanguage === 'nl' ? 'nl-NL' : 'en-US');
          const variables = {
            application_id: emailData.application?.id || 'N/A',
            submission_date: submissionDate,
            company_name: emailData.application?.companyName || '',
            contact_person: emailData.application?.contactPerson || '',
            sector: emailData.application?.sector || '',
            annual_turnover: emailData.application?.annualTurnover || '0',
            haliqo_company_name: 'Haliqo'
          };
          const rendered = renderTemplate(confirmationTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          throw new Error(`Email template 'credit_insurance_confirmation' not found in database for language '${confirmationLanguage}'. Please create the template in the email_templates table.`);
        }
        break;

      case 'subscription_upgraded':
        // Use database template for subscription upgrade emails
        const upgradedLanguage = emailData.language || 'fr';
        const upgradedTemplate = await getEmailTemplate('subscription_upgraded', upgradedLanguage, emailData.user_id || null);
        if (upgradedTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            old_plan_name: emailData.variables?.old_plan_name || emailData.old_plan_name || '',
            new_plan_name: emailData.variables?.new_plan_name || emailData.new_plan_name || '',
            new_amount: emailData.variables?.new_amount || emailData.new_amount || '',
            old_amount: emailData.variables?.old_amount || emailData.old_amount || '',
            billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
            effective_date: emailData.variables?.effective_date || emailData.effective_date || new Date().toLocaleDateString('fr-FR'),
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(upgradedTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_upgraded' not found for language '${upgradedLanguage}'`);
          }
        }
        break;

      case 'subscription_downgraded':
        // Use database template for subscription downgrade emails
        const downgradedLanguage = emailData.language || 'fr';
        const downgradedTemplate = await getEmailTemplate('subscription_downgraded', downgradedLanguage, emailData.user_id || null);
        if (downgradedTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            old_plan_name: emailData.variables?.old_plan_name || emailData.old_plan_name || '',
            new_plan_name: emailData.variables?.new_plan_name || emailData.new_plan_name || '',
            new_amount: emailData.variables?.new_amount || emailData.new_amount || '',
            old_amount: emailData.variables?.old_amount || emailData.old_amount || '',
            billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
            effective_date: emailData.variables?.effective_date || emailData.effective_date || new Date().toLocaleDateString('fr-FR'),
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(downgradedTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_downgraded' not found for language '${downgradedLanguage}'`);
          }
        }
        break;

      case 'subscription_cancelled':
        // Use database template for subscription cancellation emails
        const cancelledLanguage = emailData.language || 'fr';
        const cancelledTemplate = await getEmailTemplate('subscription_cancelled', cancelledLanguage, emailData.user_id || null);
        if (cancelledTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            plan_name: emailData.variables?.plan_name || emailData.plan_name || '',
            cancellation_date: emailData.variables?.cancellation_date || emailData.cancellation_date || new Date().toLocaleDateString('fr-FR'),
            cancellation_reason: emailData.variables?.cancellation_reason || emailData.cancellation_reason || 'User request',
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(cancelledTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_cancelled' not found for language '${cancelledLanguage}'`);
          }
        }
        break;

      case 'subscription_trial_ending':
        // Use database template for trial ending emails
        const trialLanguage = emailData.language || 'fr';
        const trialTemplate = await getEmailTemplate('subscription_trial_ending', trialLanguage, emailData.user_id || null);
        if (trialTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            plan_name: emailData.variables?.plan_name || emailData.plan_name || '',
            trial_end_date: emailData.variables?.trial_end_date || emailData.trial_end_date || new Date().toLocaleDateString('fr-FR'),
            amount: emailData.variables?.amount || emailData.amount || emailData.new_amount || '',
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(trialTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_trial_ending' not found for language '${trialLanguage}'`);
          }
        }
        break;

      case 'subscription_activated':
        // Use database template for subscription activation emails
        const activatedLanguage = emailData.language || 'fr';
        const activatedTemplate = await getEmailTemplate('subscription_activated', activatedLanguage, emailData.user_id || null);
        if (activatedTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            plan_name: emailData.variables?.plan_name || emailData.plan_name || emailData.new_plan_name || '',
            amount: emailData.variables?.amount || emailData.amount || emailData.new_amount || '',
            billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
            effective_date: emailData.variables?.effective_date || emailData.effective_date || new Date().toLocaleDateString('fr-FR'),
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(activatedTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_activated' not found for language '${activatedLanguage}'`);
          }
        }
        break;

      case 'subscription_reactivated':
        // Use database template for subscription reactivation emails
        const reactivatedLanguage = emailData.language || 'fr';
        const reactivatedTemplate = await getEmailTemplate('subscription_reactivated', reactivatedLanguage, emailData.user_id || null);
        if (reactivatedTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            plan_name: emailData.variables?.plan_name || emailData.plan_name || '',
            amount: emailData.variables?.amount || emailData.amount || '',
            billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
            effective_date: emailData.variables?.effective_date || emailData.effective_date || new Date().toLocaleDateString('fr-FR'),
            support_email: emailData.variables?.support_email || 'support@haliqo.com',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(reactivatedTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          if (emailData.html && emailData.subject) {
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.user_email],
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          } else {
            throw new Error(`Template 'subscription_reactivated' not found for language '${reactivatedLanguage}'`);
          }
        }
        break;

      case 'welcome_registration':
        // Use database template for welcome registration emails
        const welcomeLanguage = emailData.language || 'fr';
        const welcomeTemplate = await getEmailTemplate('welcome_registration', welcomeLanguage, emailData.user_id || null);
        if (welcomeTemplate.success) {
          const variables = {
            user_name: emailData.variables?.user_name || emailData.user_name || 'User',
            user_email: emailData.variables?.user_email || emailData.user_email || '',
            plan_name: emailData.variables?.plan_name || emailData.plan_name || '',
            amount: emailData.variables?.amount || emailData.amount || '',
            billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
            account_settings_url: emailData.variables?.account_settings_url || emailData.account_settings_url || 'https://haliqo.com/settings',
            company_name: emailData.variables?.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(welcomeTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.user_email],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.text || rendered.text
          });
        } else {
          throw new Error(`Template 'welcome_registration' not found for language '${welcomeLanguage}'`);
        }
        break;

      case 'contact_form':
        // Use database template
        const contactLanguage = emailData.language || 'fr';
        const contactTemplate = await getEmailTemplate('contact_form', contactLanguage, null);
        if (contactTemplate.success) {
          // Map subject values to readable labels
          const subjectMap: { [key: string]: { fr: string, en: string, nl: string } } = {
            'demo': { fr: 'Demande de démo', en: 'Demo Request', nl: 'Demo aanvraag' },
            'question': { fr: 'Question produit', en: 'Product Question', nl: 'Productvraag' },
            'support': { fr: 'Support technique', en: 'Technical Support', nl: 'Technische ondersteuning' },
            'partnership': { fr: 'Proposition de partenariat', en: 'Partnership Proposal', nl: 'Partnerschapsvoorstel' },
            'other': { fr: 'Autre', en: 'Other', nl: 'Anders' }
          };
          
          const subjectValue = emailData.subject || '';
          const subjectLabels = subjectMap[subjectValue] || { fr: subjectValue, en: subjectValue, nl: subjectValue };
          const subjectLabel = subjectLabels[contactLanguage] || subjectLabels['fr'] || subjectValue || 'Nouvelle soumission';
          
          const fullName = `${emailData.firstName || ''} ${emailData.lastName || ''}`.trim() || emailData.email || 'Client';
          const submissionDate = new Date().toLocaleDateString(contactLanguage === 'fr' ? 'fr-FR' : contactLanguage === 'nl' ? 'nl-NL' : 'en-US');
          
          const variables = {
            first_name: emailData.firstName || '',
            last_name: emailData.lastName || '',
            full_name: fullName,
            email: emailData.email || '',
            phone: emailData.phone || 'Non fourni',
            subject: subjectValue,
            subject_label: subjectLabel,
            message: emailData.message || '',
            company_name: 'Haliqo',
            submission_date: submissionDate
          };
          const rendered = renderTemplate(contactTemplate.data, variables);
          const supportEmail = emailData.support_email || fromEmail;
          emailResult = await sendEmail({
            from: fromEmail,
            to: [supportEmail],
            replyTo: emailData.email || fromEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });
        } else {
          throw new Error(`Email template 'contact_form' not found in database for language '${contactLanguage}'. Please create the template in the email_templates table.`);
        }
        break;
        
      case 'invoice_to_accountant':
      case 'expense_invoice_to_accountant':
        // Use database template for invoice to accountant emails
        const accountantLanguage = emailData.language || 'fr';
        const accountantTemplateType = emailType === 'expense_invoice_to_accountant' ? 'expense_invoice_to_accountant' : 'invoice_to_accountant';
        const accountantTemplate = await getEmailTemplate(accountantTemplateType, accountantLanguage, emailData.user_id || null);
        if (accountantTemplate.success) {
          const variables = {
            invoice_count: emailData.invoice_count?.toString() || emailData.meta?.invoice_count?.toString() || '0',
            total_amount: emailData.total_amount || emailData.meta?.total_amount || '0.00€',
            date: emailData.date || new Date().toLocaleDateString(accountantLanguage === 'fr' ? 'fr-FR' : accountantLanguage === 'nl' ? 'nl-NL' : 'en-US'),
            company_name: emailData.company_name || 'Haliqo'
          };
          const rendered = renderTemplate(accountantTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to_email],
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            attachments: emailData.attachments || undefined
          });
        } else {
          // Fallback to pre-rendered HTML if template not found
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to_email],
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            attachments: emailData.attachments || undefined
          });
        }
        break;
        
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResult?.data || emailResult }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Email function error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Helper functions for variable replacement in existing HTML templates

function generateFollowUpEmail(html: string, variables: any) {
  // Replace variables in HTML content
  let processedHtml = html;
  if (variables) {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedHtml = processedHtml.replace(regex, variables[key] || '');
    });
  }
  return processedHtml;
}

function generateQuoteStatusEmail(html: string, variables: any) {
  // Replace variables in HTML content for status emails
  let processedHtml = html;
  if (variables) {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedHtml = processedHtml.replace(regex, variables[key] || '');
    });
  }
  return processedHtml;
}


