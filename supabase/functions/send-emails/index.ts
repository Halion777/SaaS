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

    // Helper function to normalize language code
    const normalizeLanguage = (lang: string | null | undefined): string => {
      if (!lang) return 'fr';
      // Normalize language code: take first part before '-' and convert to lowercase
      const normalized = lang.split('-')[0].toLowerCase().trim();
      // Handle common variations
      if (normalized === 'br' || normalized === 'be') return 'fr'; // 'br' might be typo for 'fr' or 'be' for Belgium French
      if (normalized === 'en' || normalized === 'eng') return 'en';
      if (normalized === 'nl' || normalized === 'nld' || normalized === 'dut') return 'nl';
      if (normalized === 'fr' || normalized === 'fra') return 'fr';
      // Return normalized value (should be 'en', 'fr', or 'nl')
      return normalized;
    };

    // Helper function to get user's language preference from database
    const getUserLanguagePreference = async (userId: string | null): Promise<string | null> => {
      if (!userId) return null;
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('language_preference')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.warn('Error fetching user language preference:', error);
          return null;
        }
        
        if (userData?.language_preference) {
          return normalizeLanguage(userData.language_preference);
        }
      } catch (error) {
        console.warn('Exception fetching user language preference:', error);
      }
      return null;
    };

    // Helper function to get client's language preference from database
    const getClientLanguagePreference = async (clientId: string | null): Promise<string | null> => {
      if (!clientId) return null;
      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('language_preference')
          .eq('id', clientId)
          .maybeSingle();
        
        if (error) {
          console.warn('Error fetching client language preference:', error);
          return null;
        }
        
        if (clientData?.language_preference) {
          return normalizeLanguage(clientData.language_preference);
        }
      } catch (error) {
        console.warn('Exception fetching client language preference:', error);
      }
      return null;
    };

    // Helper function to get and render email template from database
    const getEmailTemplate = async (templateType: string, language: string = 'fr', userId: string | null = null) => {
      try {
        // If language is not provided but userId is, fetch user's language preference
        let finalLanguage = language;
        if (!finalLanguage || finalLanguage === 'fr' && userId) {
          const userLang = await getUserLanguagePreference(userId);
          if (userLang && userLang !== 'fr' || !finalLanguage) {
            finalLanguage = userLang;
          }
        }
        
        // Normalize language code
        const normalizedLanguage = normalizeLanguage(finalLanguage);
        
        let query = supabase
          .from('email_templates')
          .select('*')
          .eq('template_type', templateType)
          .eq('language', normalizedLanguage)
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
          .eq('language', normalizedLanguage)
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
      case 'invoice_sent': {
        // Use database template for invoice sent emails
        // Get language: client's database language_preference only
        let invoiceLanguage: string | null = null;
        if (emailData.client_id) {
          invoiceLanguage = await getClientLanguagePreference(emailData.client_id);
        }
        invoiceLanguage = invoiceLanguage || 'fr';
        const invoiceTemplate = await getEmailTemplate('invoice_sent', invoiceLanguage, emailData.user_id || null);
        if (!invoiceTemplate.success) {
          throw new Error(`Email template 'invoice_sent' not found in database for language '${invoiceLanguage}'. Please create the template in the email_templates table.`);
        }
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
          custom_message: emailData.custom_message || ''
        };
        const rendered = renderTemplate(invoiceTemplate.data, variables);
        // Use custom_subject if provided, otherwise use template subject
        const emailSubject = emailData.custom_subject || rendered.subject;
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.client_email],
          subject: emailSubject,
          html: rendered.html,
          text: rendered.text,
          attachments: emailData.attachments || undefined
        });
        break;
      }
        
      case 'templated_email':
        // DEPRECATED: This case should not be used. All emails should use specific template types.
        // Only kept for backward compatibility with welcome_client emails
        // If client_id is provided, fetch template from database with correct language
        let templatedLanguage: string | null = null;
        if (emailData.client_id && emailData.template_type) {
          templatedLanguage = await getClientLanguagePreference(emailData.client_id);
        } else if (emailData.user_id && emailData.template_type) {
          templatedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        templatedLanguage = templatedLanguage || 'fr';
        if (emailData.template_type) {
          const dbTemplate = await getEmailTemplate(emailData.template_type, templatedLanguage, emailData.user_id || null);
          if (dbTemplate.success) {
            const rendered = renderTemplate(dbTemplate.data, emailData.variables || {});
            emailResult = await sendEmail({
              from: fromEmail,
              to: [emailData.client_email || emailData.to],
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              attachments: emailData.attachments || undefined
            });
            break;
          }
        }
        // If template not found, throw error instead of using fallback
        throw new Error(`Email template '${emailData.template_type || 'unknown'}' not found in database for language '${templatedLanguage}'. Please create the template in the email_templates table.`);
        break;
        
      case 'new_lead_available':
        // Use database template
        // Get language: user's database language_preference only
        let leadLanguage: string | null = null;
        if (emailData.user_id) {
          leadLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        leadLanguage = leadLanguage || 'fr';
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
        // Get language: user's database language_preference only
        let assignedLanguage: string | null = null;
        if (emailData.user_id) {
          assignedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        assignedLanguage = assignedLanguage || 'fr';
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
        // Get language: client's database language_preference only
        let quoteLanguage: string | null = null;
        if (emailData.client_id) {
          quoteLanguage = await getClientLanguagePreference(emailData.client_id);
        }
        quoteLanguage = quoteLanguage || 'fr';
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
            company_name: emailData.variables?.company_name || 'Notre équipe',
            // Financial breakdown variables
            total_before_vat: emailData.variables?.total_before_vat || '0€',
            vat_enabled: emailData.variables?.vat_enabled || 'false',
            vat_rate: emailData.variables?.vat_rate || '0',
            vat_percentage: emailData.variables?.vat_percentage || '0%',
            vat_amount: emailData.variables?.vat_amount || '0€',
            total_with_vat: emailData.variables?.total_with_vat || '0€',
            deposit_enabled: emailData.variables?.deposit_enabled || 'false',
            deposit_amount: emailData.variables?.deposit_amount || '0€',
            balance_amount: emailData.variables?.balance_amount || emailData.variables?.quote_amount || '0€'
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
        // DEPRECATED: Follow-up emails should use specific template types (followup_not_viewed, followup_viewed_no_action, general_followup)
        // This case is kept for backward compatibility but should be migrated to use database templates
        throw new Error('quote_followup email type is deprecated. Please use specific follow-up template types (followup_not_viewed, followup_viewed_no_action, general_followup) with database templates.');
        break;

      case 'quote_status_update': {
        // Handle quote status update emails (accepted/rejected)
        // Determine template type based on status (accepted or rejected)
        const statusTemplateType = emailData.variables?.status === 'accepted' || emailData.variables?.quote_status === 'accepted' 
          ? 'client_accepted' 
          : 'client_rejected';
        
        // Get language priority:
        // 1. Client's database language_preference (if client_id exists)
        // 2. Language parameter from dropdown selection (for non-logged in users on quote share page)
        // 3. Default to 'fr'
        let statusLanguage: string | null = null;
        if (emailData.client_id) {
          statusLanguage = await getClientLanguagePreference(emailData.client_id);
        }
        // If no client_id or no database preference found, use language parameter from dropdown
        if (!statusLanguage && emailData.language) {
          statusLanguage = emailData.language.split('-')[0] || 'fr';
        }
        statusLanguage = statusLanguage || 'fr';
        
        // Fetch template from database
        const statusTemplate = await getEmailTemplate(statusTemplateType, statusLanguage, emailData.user_id || null);
        
        if (!statusTemplate.success) {
          throw new Error(`Email template '${statusTemplateType}' not found in database for language '${statusLanguage}'. Please create the template in the email_templates table.`);
        }
        
        const variables = {
          client_name: emailData.variables?.client_name || 'Madame, Monsieur',
          quote_number: emailData.variables?.quote_number || 'N/A',
          quote_amount: emailData.variables?.quote_amount || '0€',
          quote_link: emailData.variables?.quote_link || '#',
          company_name: emailData.variables?.company_name || 'Notre équipe',
          // Financial breakdown variables
          total_before_vat: emailData.variables?.total_before_vat || '0€',
          vat_enabled: emailData.variables?.vat_enabled || 'false',
          vat_rate: emailData.variables?.vat_rate || '0',
          vat_percentage: emailData.variables?.vat_percentage || '0%',
          vat_amount: emailData.variables?.vat_amount || '0€',
          total_with_vat: emailData.variables?.total_with_vat || '0€',
          deposit_enabled: emailData.variables?.deposit_enabled || 'false',
          deposit_amount: emailData.variables?.deposit_amount || '0€',
          balance_amount: emailData.variables?.balance_amount || emailData.variables?.quote_amount || '0€'
        };
        
        const rendered = renderTemplate(statusTemplate.data, variables);
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.to],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }
        
      case 'credit_insurance_application':
        // Use database template
        // Get language: user's database language_preference only (if user_id provided)
        let applicationLanguage: string | null = null;
        if (emailData.user_id) {
          applicationLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        applicationLanguage = applicationLanguage || 'fr';
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
        // Get language: user's database language_preference only
        let confirmationLanguage: string | null = null;
        if (emailData.user_id) {
          confirmationLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        confirmationLanguage = confirmationLanguage || 'fr';
        const confirmationTemplate = await getEmailTemplate('credit_insurance_confirmation', confirmationLanguage, emailData.user_id || null);
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

      case 'subscription_upgraded': {
        // Use database template for subscription upgrade emails
        // Get language: user's database language_preference only
        let upgradedLanguage: string | null = null;
        if (emailData.user_id) {
          upgradedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        upgradedLanguage = upgradedLanguage || 'fr';
        const upgradedTemplate = await getEmailTemplate('subscription_upgraded', upgradedLanguage, emailData.user_id || null);
        if (!upgradedTemplate.success) {
          throw new Error(`Email template 'subscription_upgraded' not found in database for language '${upgradedLanguage}'. Please create the template in the email_templates table.`);
        }
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
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'subscription_downgraded': {
        // Use database template for subscription downgrade emails
        // Get language: user's database language_preference only
        let downgradedLanguage: string | null = null;
        if (emailData.user_id) {
          downgradedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        downgradedLanguage = downgradedLanguage || 'fr';
        const downgradedTemplate = await getEmailTemplate('subscription_downgraded', downgradedLanguage, emailData.user_id || null);
        if (!downgradedTemplate.success) {
          throw new Error(`Email template 'subscription_downgraded' not found in database for language '${downgradedLanguage}'. Please create the template in the email_templates table.`);
        }
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
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'subscription_cancelled': {
        // Use database template for subscription cancellation emails
        // Get language: user's database language_preference only
        let cancelledLanguage: string | null = null;
        if (emailData.user_id) {
          cancelledLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        cancelledLanguage = cancelledLanguage || 'fr';
        const cancelledTemplate = await getEmailTemplate('subscription_cancelled', cancelledLanguage, emailData.user_id || null);
        if (!cancelledTemplate.success) {
          throw new Error(`Email template 'subscription_cancelled' not found in database for language '${cancelledLanguage}'. Please create the template in the email_templates table.`);
        }
        const variables = {
          user_name: emailData.variables?.user_name || emailData.user_name || 'User',
          old_plan_name: emailData.variables?.plan_name || emailData.variables?.old_plan_name || emailData.plan_name || '',
          effective_date: emailData.variables?.cancellation_date || emailData.variables?.effective_date || emailData.cancellation_date || new Date().toLocaleDateString('fr-FR'),
          cancellation_reason: emailData.variables?.cancellation_reason || emailData.cancellation_reason || 'User request',
          support_email: emailData.variables?.support_email || 'support@haliqo.com',
          company_name: emailData.variables?.company_name || 'Haliqo'
        };
        const rendered = renderTemplate(cancelledTemplate.data, variables);
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'subscription_trial_ending': {
        // Use database template for trial ending emails
        // Get language: user's database language_preference only
        let trialLanguage: string | null = null;
        if (emailData.user_id) {
          trialLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        trialLanguage = trialLanguage || 'fr';
        const trialTemplate = await getEmailTemplate('subscription_trial_ending', trialLanguage, emailData.user_id || null);
        if (!trialTemplate.success) {
          throw new Error(`Email template 'subscription_trial_ending' not found in database for language '${trialLanguage}'. Please create the template in the email_templates table.`);
        }
        const variables = {
          user_name: emailData.variables?.user_name || emailData.user_name || 'User',
          new_plan_name: emailData.variables?.new_plan_name || emailData.variables?.plan_name || emailData.plan_name || '',
          trial_end_date: emailData.variables?.trial_end_date || emailData.trial_end_date || new Date().toLocaleDateString('fr-FR'),
          new_amount: emailData.variables?.new_amount || emailData.variables?.amount || emailData.amount || emailData.new_amount || '',
          billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
          support_email: emailData.variables?.support_email || 'support@haliqo.com',
          company_name: emailData.variables?.company_name || 'Haliqo'
        };
        const rendered = renderTemplate(trialTemplate.data, variables);
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'subscription_activated': {
        // Use database template for subscription activation emails
        // Get language: user's database language_preference only
        let activatedLanguage: string | null = null;
        if (emailData.user_id) {
          activatedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        activatedLanguage = activatedLanguage || 'fr';
        const activatedTemplate = await getEmailTemplate('subscription_activated', activatedLanguage, emailData.user_id || null);
        if (!activatedTemplate.success) {
          throw new Error(`Email template 'subscription_activated' not found in database for language '${activatedLanguage}'. Please create the template in the email_templates table.`);
        }
        const variables = {
          user_name: emailData.variables?.user_name || emailData.user_name || 'User',
          new_plan_name: emailData.variables?.new_plan_name || emailData.variables?.plan_name || emailData.plan_name || emailData.new_plan_name || '',
          new_amount: emailData.variables?.new_amount || emailData.variables?.amount || emailData.amount || emailData.new_amount || '',
          billing_interval: emailData.variables?.billing_interval || emailData.billing_interval || 'monthly',
          effective_date: emailData.variables?.effective_date || emailData.effective_date || new Date().toLocaleDateString('fr-FR'),
          support_email: emailData.variables?.support_email || 'support@haliqo.com',
          company_name: emailData.variables?.company_name || 'Haliqo'
        };
        const rendered = renderTemplate(activatedTemplate.data, variables);
        emailResult = await sendEmail({
          from: fromEmail,
          to: [emailData.user_email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'subscription_reactivated': {
        // Use database template for subscription reactivation emails
        // Get language: user's database language_preference only
        let reactivatedLanguage: string | null = null;
        if (emailData.user_id) {
          reactivatedLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        reactivatedLanguage = reactivatedLanguage || 'fr';
        const reactivatedTemplate = await getEmailTemplate('subscription_reactivated', reactivatedLanguage, emailData.user_id || null);
        if (!reactivatedTemplate.success) {
          throw new Error(`Email template 'subscription_reactivated' not found in database for language '${reactivatedLanguage}'. Please create the template in the email_templates table.`);
        }
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
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'welcome_registration': {
        // Use database template for welcome registration emails
        // Get language: user's database language_preference only
        let welcomeLanguage: string | null = null;
        if (emailData.user_id) {
          welcomeLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        welcomeLanguage = welcomeLanguage || 'fr';
        const welcomeTemplate = await getEmailTemplate('welcome_registration', welcomeLanguage, emailData.user_id || null);
        if (!welcomeTemplate.success) {
          throw new Error(`Email template 'welcome_registration' not found in database for language '${welcomeLanguage}'. Please create the template in the email_templates table.`);
        }
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
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text
        });
        break;
      }

      case 'contact_form':
        // Use database template
        // For contact form, use provided language (from browser/i18n) or default to 'fr'
        // Note: Contact form doesn't have user_id or client_id, so we use provided language
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
        // Get language: user's database language_preference only
        let accountantLanguage: string | null = null;
        if (emailData.user_id) {
          accountantLanguage = await getUserLanguagePreference(emailData.user_id);
        }
        accountantLanguage = accountantLanguage || 'fr';
        const accountantTemplateType = emailType === 'expense_invoice_to_accountant' ? 'expense_invoice_to_accountant' : 'invoice_to_accountant';
        const accountantTemplate = await getEmailTemplate(accountantTemplateType, accountantLanguage, emailData.user_id || null);
        if (!accountantTemplate.success) {
          throw new Error(`Email template '${accountantTemplateType}' not found in database for language '${accountantLanguage}'. Please create the template in the email_templates table.`);
        }
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


