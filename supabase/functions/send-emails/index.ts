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
      case 'templated_email':
        // New template system for client emails
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
            leads_management_url: emailData.leadData?.site_url ? `${emailData.leadData.site_url}/leads-management` : 'https://app.haliqo.com/leads-management',
            site_url: emailData.leadData?.site_url || 'https://app.haliqo.com',
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
            leads_management_url: emailData.leadData?.site_url ? `${emailData.leadData.site_url}/leads-management` : 'https://app.haliqo.com/leads-management',
            site_url: emailData.leadData?.site_url || 'https://app.haliqo.com',
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
        
      case 'custom_quote_sent':
        // Use database template
        const customQuoteLanguage = emailData.language || 'fr';
        const customQuoteTemplate = await getEmailTemplate('custom_quote_sent', customQuoteLanguage, emailData.user_id || null);
        if (customQuoteTemplate.success) {
          // Build quote link HTML if quote_link exists
          let quoteLinkHtml = '';
          if (emailData.variables?.quote_link && emailData.variables.quote_link !== '#') {
            quoteLinkHtml = `<div style="text-align: center; margin: 30px 0;">
              <a href="${emailData.variables.quote_link}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Voir le devis</a>
            </div>`;
          }
          
          const variables = {
            client_name: emailData.variables?.client_name || 'Madame, Monsieur',
            quote_number: emailData.variables?.quote_number || 'N/A',
            quote_title: emailData.variables?.quote_title || 'Votre projet',
            quote_amount: emailData.variables?.quote_amount || '0€',
            valid_until: emailData.variables?.valid_until || '30 jours',
            custom_message: emailData.message || '',
            quote_link: quoteLinkHtml,
            company_name: emailData.variables?.company_name || 'Notre équipe'
          };
          const rendered = renderTemplate(customQuoteTemplate.data, variables);
          emailResult = await sendEmail({
            from: fromEmail,
            to: [emailData.to],
            subject: emailData.subject || rendered.subject,
            html: rendered.html,
            text: emailData.message || rendered.text
          });
        } else {
          throw new Error(`Email template 'custom_quote_sent' not found in database for language '${customQuoteLanguage}'. Please create the template in the email_templates table.`);
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
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: emailData.subject,
          html: generateQuoteStatusEmail(emailData.html, emailData.variables),
          text: emailData.text
        });
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
        // Handle subscription upgrade notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_downgraded':
        // Handle subscription downgrade notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_cancelled':
        // Handle subscription cancellation notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_trial_ending':
        // Handle trial ending notification emails
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        break;

      case 'subscription_activated':
        // Handle subscription activation notification emails (for new registrations)
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
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
        // Send invoice to accountant with attachment
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to_email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          attachments: emailData.attachments || undefined
        });
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


