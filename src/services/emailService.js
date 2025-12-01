const BASE_URL = import.meta.env.SITE_URL || window.location.origin;

import { supabase } from './supabaseClient';

export class EmailService {
  
  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  /**
   * Get client's language preference from database or client object
   * Priority: database (if clientId provided) > client object properties > 'fr'
   * @param {Object} client - Client object (can have id, value, client.id, language_preference, etc.)
   * @returns {Promise<string>} - Normalized language code ('fr', 'en', or 'nl')
   */
  static async getClientLanguagePreference(client) {
    try {
      // Try to get client ID from various possible locations
      const clientId = client?.id || client?.value || client?.client?.id;
      
      // If we have a client ID, try to fetch from database first
      if (clientId) {
        try {
          const { supabase } = await import('./supabaseClient');
          const { data: clientData } = await supabase
            .from('clients')
            .select('language_preference')
            .eq('id', clientId)
            .maybeSingle();
          
          if (clientData?.language_preference) {
            return (clientData.language_preference.split('-')[0] || 'fr').toLowerCase();
          }
        } catch (error) {
          console.warn('Error fetching client language preference from database, using fallback:', error);
        }
      }
      
      // Fallback to client object properties
      const language = client?.language_preference || client?.languagePreference || client?.client?.language_preference || 'fr';
      return (language.split('-')[0] || 'fr').toLowerCase();
      
    } catch (error) {
      console.warn('Error in getClientLanguagePreference, defaulting to fr:', error);
      return 'fr';
    }
  }
  
  /**
   * Get current user's company profile
   */
  static async getCurrentUserCompanyProfile(userId) {
    try {
      if (!userId) {
        return { company_name: 'Notre entreprise' };
      }
      
      const { data, error } = await supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No default profile, try any profile
        const { data: anyProfile } = await supabase
          .from('company_profiles')
          .select('company_name')
          .eq('user_id', userId)
          .limit(1)
          .single();
        
        if (anyProfile) {
          return anyProfile;
        }
      } else if (data) {
        return data;
      }
      
      return { company_name: 'Notre entreprise' };
      
    } catch (error) {
      console.error('Error getting company profile:', error);
      return { company_name: 'Notre entreprise' };
    }
  }
  
  // ========================================
  // CORE EMAIL FUNCTIONALITY
  // ========================================
  
  /**
   * Send email via Supabase Edge Function
   */
  static async sendEmailViaEdgeFunction(emailType, emailData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          emailType,
          emailData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result, error: null };
      
    } catch (error) {
      console.error('Edge function error:', error);
      return { success: false, data: null, error: error.message };
    }
  }
  
  /**
   * Send new lead notification email to artisan
   */
  static async sendNewLeadNotificationEmail(leadData, artisanData, language = 'fr') {
    try {
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData,
        language: language || 'fr',
        user_id: artisanData.user_id || null
      };
      
      const result = await this.sendEmailViaEdgeFunction('new_lead_available', emailData);
      
      if (result.success) {
        console.log('New lead notification email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send new lead notification email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send lead assignment confirmation email to artisan
   */
  static async sendLeadAssignmentEmail(leadData, artisanData, language = 'fr') {
    try {
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData,
        language: language || 'fr',
        user_id: artisanData.user_id || null
      };
      
      const result = await this.sendEmailViaEdgeFunction('lead_assigned', emailData);
      
      if (result.success) {
        console.log('Lead assignment email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send lead assignment email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
 

  
 

  // ========================================
  // EMAIL TEMPLATE FUNCTIONALITY
  // ========================================
  
  /**
   * Get email template by type
   */
  static async getEmailTemplate(templateType, userId = null, language = 'fr') {
    try {
      // Ensure language is base code (e.g., 'fr' from 'fr-FR')
      const baseLanguage = (language || 'fr').split('-')[0] || 'fr';
      
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('language', baseLanguage)
        .eq('is_active', true);
      
      if (userId) {
        // Get user-specific template first
        query = query.eq('user_id', userId);
      }
      
      const { data: userTemplate, error: userError } = await query.maybeSingle();
      
      if (userTemplate) {
        return { success: true, data: userTemplate };
      }
      
      // Fallback to default template for the language
      const { data: defaultTemplate, error: defaultError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('language', baseLanguage)
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      
      if (defaultTemplate) {
        return { success: true, data: defaultTemplate };
      }
      
      // If no template found in requested language, try French as fallback
      if (baseLanguage !== 'fr') {
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
      
      // If still no template found, try any active template for the type
      const { data: anyTemplate, error: anyError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .maybeSingle();
      
      if (anyTemplate) {
        return { success: true, data: anyTemplate };
      }
      
      throw new Error(`No email template found for type '${templateType}' and language '${baseLanguage}'`);
      
    } catch (error) {
      console.error('Error getting email template:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Render email template with variables
   */
  static renderEmailTemplate(template, variables) {
    try {
      let html = template.html_content;
      let text = template.text_content;
      let subject = template.subject;
      
      // Replace variables in content
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        const value = variables[key] || '';
        
        html = html.replace(regex, value);
        text = text.replace(regex, value);
        subject = subject.replace(regex, value);
      });
      
      return {
        success: true,
        data: {
          subject,
          html,
          text
        }
      };
      
    } catch (error) {
      console.error('Error rendering email template:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send email using template system
   * Now uses proper template types so edge function can fetch language preference from database
   */
  static async sendTemplatedEmail(templateType, variables, clientEmail, userId = null, language = null, clientId = null) {
    try {
      // Send via edge function with proper template type
      // Edge function will fetch language preference from database if client_id is provided
      const emailData = {
        to: clientEmail,
        client_email: clientEmail,
        client_id: clientId || null, // Pass client_id so edge function can fetch language from database
        user_id: userId,
        userId: userId,
        language: language || null, // Fallback language, but edge function will prioritize database
        variables: variables,
        template_type: templateType
      };
      
      // Map template types to proper edge function email types
      let emailType = templateType;
      if (templateType === 'client_accepted' || templateType === 'client_rejected') {
        emailType = 'quote_status_update';
        emailData.variables = {
          ...variables,
          status: templateType === 'client_accepted' ? 'accepted' : 'rejected',
          quote_status: templateType === 'client_accepted' ? 'accepted' : 'rejected'
        };
      } else if (templateType === 'welcome_client') {
        // welcome_client should use a proper template type if it exists, otherwise use templated_email as fallback
        emailType = 'templated_email';
        // Get template on frontend as fallback for welcome_client
        const templateResult = await this.getEmailTemplate(templateType, userId, language || 'fr');
        if (templateResult.success) {
          const renderResult = this.renderEmailTemplate(templateResult.data, variables);
          emailData.subject = renderResult.data.subject;
          emailData.html = renderResult.data.html;
          emailData.text = renderResult.data.text;
        }
      }
      
      const result = await this.sendEmailViaEdgeFunction(emailType, emailData);
      
      if (result.success) {
        console.log(`Templated email sent successfully: ${templateType}`);
        return result;
      } else {
        console.error(`Failed to send templated email: ${templateType}`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending templated email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send quote sent email using template
   */
  static async sendQuoteSentEmail(quote, client, companyProfile, userId = null, customEmailData = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      // Ensure we have a share token for the quote link
      let shareToken = quote.share_token;
      if (!shareToken) {
        console.warn('No share token found for quote, generating one...');
        // Try to get or generate share token
        try {
          const { generatePublicShareLink } = await import('./shareService');
          const shareResult = await generatePublicShareLink(quote.id, userId);
          if (shareResult?.success) {
            shareToken = shareResult.data?.share_token || shareResult.token;
          }
        } catch (shareError) {
          console.error('Failed to generate share token for quote email:', shareError);
        }
      }
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(client);
      
      // Use custom email data if provided, otherwise use defaults
      const emailSubject = customEmailData?.subject || `Devis ${quote.quote_number} - ${companyProfile?.company_name || 'Notre entreprise'}`;
      const emailMessage = customEmailData?.message || `Bonjour,\n\nVeuillez trouver ci-joint notre devis pour votre projet.\n\nCordialement,\n${companyProfile?.company_name || 'Votre équipe'}`;
      
      const variables = {
        client_name: client.name || client.client?.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_title: quote.title || quote.project_description || 'Votre projet',
        quote_amount: `${quote.final_amount || quote.total_amount || 0}€`,
        quote_link: shareToken ? `${BASE_URL}/quote-share/${shareToken}` : '#',
        valid_until: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '30 jours',
        company_name: companyProfile?.company_name || 'Notre entreprise',
        custom_subject: emailSubject,
        custom_message: emailMessage
      };
      
      // Send email to client - always use custom quote email for better control
      // Use the email from customEmailData if provided (updated in modal), otherwise fall back to client.email
      const recipientEmail = customEmailData?.clientEmail || client.email;
      
      // Get client ID - check quote.client_id first, then client object
      const clientId = quote.client_id || client?.id || client?.value || client?.client?.id || null;
      
      let clientEmailResult;
      if (customEmailData) {
        // Use provided custom email data
        clientEmailResult = await this.sendCustomQuoteEmail(variables, recipientEmail, userId, customEmailData, clientLanguage, clientId);
      } else {
        // Use default custom email format instead of templated email
        const defaultEmailData = {
          subject: emailSubject,
          message: emailMessage
        };
        clientEmailResult = await this.sendCustomQuoteEmail(variables, recipientEmail, userId, defaultEmailData, clientLanguage, clientId);
      }
      
      // If sendCopy is enabled, also send a copy to the current user
      if (customEmailData?.sendCopy && userId) {
        try {
          // Get current user's email from the auth context (passed from the component)
          // We need to get this from the calling component since we don't have access to auth context here
          console.log('sendCopy is enabled, attempting to send copy to user');
          
          // For now, we'll need the user's email to be passed in the customEmailData
          // This is a limitation of the current architecture
          if (customEmailData.userEmail) {
            // Generate a secure view-only token for the copy email
            const { generateViewOnlyToken } = await import('./shareService');
            const viewOnlyTokenResult = await generateViewOnlyToken(quote.id);
            
            if (!viewOnlyTokenResult.success) {
              console.warn('Failed to generate view-only token for copy email:', viewOnlyTokenResult.error);
              // Fallback: use regular token with viewonly parameter (less secure but better than nothing)
              const copyQuoteLink = variables.quote_link.includes('?') 
                ? `${variables.quote_link}&viewonly=true`
                : `${variables.quote_link}?viewonly=true`;
              
              const copySubject = `[COPIE] ${emailSubject}`;
              const copyMessage = `Ceci est une copie du devis envoyé à ${recipientEmail}.\n\n${emailMessage}`;
              
              const copyVariables = {
                ...variables,
                quote_link: copyQuoteLink,
                custom_subject: copySubject,
                custom_message: copyMessage
              };
              
              // Get user's language preference for copy email (default to 'fr')
              // Priority: user's database language_preference > localStorage > 'fr'
              let userLanguage = 'fr';
              if (userId) {
                try {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('language_preference')
                    .eq('id', userId)
                    .maybeSingle();
                  
                  if (userData?.language_preference) {
                    userLanguage = userData.language_preference.split('-')[0] || 'fr';
                  } else if (typeof window !== 'undefined') {
                    const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                    userLanguage = storedLang.split('-')[0] || 'fr';
                  }
                } catch (error) {
                  console.warn('Error fetching user language preference:', error);
                  // Fallback to localStorage
                  if (typeof window !== 'undefined') {
                    const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                    userLanguage = storedLang.split('-')[0] || 'fr';
                  }
                }
              } else if (typeof window !== 'undefined') {
                const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                userLanguage = storedLang.split('-')[0] || 'fr';
              }
              
              const copyEmailResult = await this.sendCustomQuoteEmail(
                copyVariables, 
                customEmailData.userEmail, 
                userId, 
                { subject: copySubject, message: copyMessage },
                userLanguage
              );
              
              if (copyEmailResult.success) {
                console.log('Copy email sent successfully to user (fallback mode):', customEmailData.userEmail);
              } else {
                console.warn('Failed to send copy email to user:', copyEmailResult.error);
              }
            } else {
              // Use secure view-only token (separate from regular share token)
              const viewOnlyToken = viewOnlyTokenResult.token;
              const copyQuoteLink = `${BASE_URL}/quote-share/${viewOnlyToken}`;
              
              const copySubject = `[COPIE] ${emailSubject}`;
              const copyMessage = `Ceci est une copie du devis envoyé à ${recipientEmail}.\n\n${emailMessage}`;
              
              const copyVariables = {
                ...variables,
                quote_link: copyQuoteLink, // Use secure view-only token link
                custom_subject: copySubject,
                custom_message: copyMessage
              };
              
              // Get user's language preference for copy email (default to 'fr')
              // Priority: user's database language_preference > localStorage > 'fr'
              let userLanguage = 'fr';
              if (userId) {
                try {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('language_preference')
                    .eq('id', userId)
                    .maybeSingle();
                  
                  if (userData?.language_preference) {
                    userLanguage = userData.language_preference.split('-')[0] || 'fr';
                  } else if (typeof window !== 'undefined') {
                    const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                    userLanguage = storedLang.split('-')[0] || 'fr';
                  }
                } catch (error) {
                  console.warn('Error fetching user language preference:', error);
                  // Fallback to localStorage
                  if (typeof window !== 'undefined') {
                    const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                    userLanguage = storedLang.split('-')[0] || 'fr';
                  }
                }
              } else if (typeof window !== 'undefined') {
                const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
                userLanguage = storedLang.split('-')[0] || 'fr';
              }
              
              // Send copy to user
              const copyEmailResult = await this.sendCustomQuoteEmail(
                copyVariables, 
                customEmailData.userEmail, 
                userId, 
                { subject: copySubject, message: copyMessage },
                userLanguage
              );
              
              if (copyEmailResult.success) {
                console.log('Copy email sent successfully to user with secure view-only token:', customEmailData.userEmail);
              } else {
                console.warn('Failed to send copy email to user:', copyEmailResult.error);
              }
            }
          } else {
            console.warn('sendCopy is enabled but no userEmail provided in customEmailData');
          }
        } catch (copyError) {
          console.warn('Failed to send copy email to user:', copyError);
          // Don't fail the main email if copy fails
        }
      }
      
      return clientEmailResult;
      
    } catch (error) {
      console.error('Error sending quote sent email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send custom quote email with user-defined subject and message
   */
  static async sendCustomQuoteEmail(variables, clientEmail, userId = null, customEmailData = null, language = 'fr', clientId = null) {
    try {
      const emailData = {
        to: clientEmail,
        client_id: clientId || null, // Pass client_id so edge function can fetch language if needed
        subject: customEmailData?.subject || variables.custom_subject,
        message: customEmailData?.message || variables.custom_message,
        variables: variables,
        userId: userId,
        user_id: userId,
        language: language || 'fr' // Pass language, but edge function will fetch from client_id if not provided
      };
      
      return await this.sendEmailViaEdgeFunction('quote_sent', emailData);
      
    } catch (error) {
      console.error('Error sending custom quote email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send follow-up email using template
   */
  static async sendFollowUpEmail(quote, client, companyProfile, followUpType, userId = null, daysSinceSent = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      // Ensure we have a share token for the quote link
      let shareToken = quote.share_token;
      if (!shareToken) {
        console.warn('No share token found for quote, generating one...');
        // Try to get or generate share token
        try {
          const { generatePublicShareLink } = await import('./shareService');
          const shareResult = await generatePublicShareLink(quote.id, userId);
          if (shareResult?.success) {
            shareToken = shareResult.data?.share_token || shareResult.token;
          }
        } catch (shareError) {
          console.error('Failed to generate share token for follow-up email:', shareError);
        }
      }
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_title: quote.title || quote.project_description || 'Votre projet',
        quote_amount: `${quote.final_amount || quote.total_amount || quote.amount || quote.final_amount || 0}€`,
        quote_link: shareToken ? `${BASE_URL}/quote-share/${shareToken}` : '#',
        days_since_sent: daysSinceSent || 'quelques',
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      // Get client ID - check quote.client_id first, then client object
      const clientId = quote.client_id || client?.id || client?.value || client?.client?.id || null;
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(client);
      
      return await this.sendTemplatedEmail(followUpType, variables, client.email || client.client?.email, userId, clientLanguage, clientId);
      
    } catch (error) {
      console.error('Error sending follow-up email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send client acceptance confirmation email
   */
  static async sendClientAcceptedEmail(quote, client, companyProfile, userId = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      // Ensure we have a share token for the quote link
      let shareToken = quote.share_token;
      if (!shareToken) {
        console.warn('No share token found for quote, generating one...');
        // Try to get or generate share token
        try {
          const { generatePublicShareLink } = await import('./shareService');
          const shareResult = await generatePublicShareLink(quote.id, userId);
          if (shareResult?.success) {
            shareToken = shareResult.data?.share_token || shareResult.token;
          }
        } catch (shareError) {
          console.error('Failed to generate share token for client accepted email:', shareError);
        }
      }
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_amount: `${quote.final_amount || quote.total_amount || 0}€`,
        quote_link: shareToken ? `${BASE_URL}/quote-share/${shareToken}` : '#',
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      // Get client ID - check quote.client_id first, then client object
      const clientId = quote.client_id || client?.id || client?.value || client?.client?.id || null;
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(client);
      
      return await this.sendTemplatedEmail('client_accepted', variables, client.email || client.client?.email, userId, clientLanguage, clientId);
      
    } catch (error) {
      console.error('Error sending client accepted email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send client rejection confirmation email
   */
  static async sendClientRejectedEmail(quote, client, companyProfile, userId = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      // Get client ID - check quote.client_id first, then client object
      const clientId = quote.client_id || client?.id || client?.value || client?.client?.id || null;
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(client);
      
      return await this.sendTemplatedEmail('client_rejected', variables, client.email || client.client?.email, userId, clientLanguage, clientId);
      
    } catch (error) {
      console.error('Error sending client rejected email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send welcome email to new clients using template system
   */
  static async sendWelcomeEmail(clientData, companyProfile = null, userId = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      const variables = {
        client_name: clientData.name || 'Madame, Monsieur',
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      // Get client ID from clientData
      const clientId = clientData?.id || clientData?.value || clientData?.client?.id || null;
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(clientData);
      
      return await this.sendTemplatedEmail('welcome_client', variables, clientData.email, userId, clientLanguage, clientId);
      
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email when draft quote is marked as sent (from quotes management)
   */
  static async sendDraftQuoteMarkedAsSentEmail(quote, client, companyProfile, userId = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      // Ensure we have a share token for the quote link
      let shareToken = quote.share_token;
      if (!shareToken) {
        console.warn('No share token found for quote, generating one...');
        // Try to get or generate share token
        try {
          const { generatePublicShareLink } = await import('./shareService');
          const shareResult = await generatePublicShareLink(quote.id, userId);
          if (shareResult?.success) {
            shareToken = shareResult.token;
            
            // Update the quote object with the new share token for the email
            quote.share_token = shareToken;
            
            // Wait a moment to ensure the database update completes
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Double-check that the share token was saved correctly
            const { data: updatedQuote } = await import('./supabaseClient').then(
              ({ supabase }) => supabase
                .from('quotes')
                .select('share_token, is_public')
                .eq('id', quote.id)
                .single()
            );
            
            if (!updatedQuote?.share_token || !updatedQuote?.is_public) {
              console.warn('Share token or is_public flag not set correctly, attempting to fix...');
              await import('./supabaseClient').then(
                ({ supabase }) => supabase
                  .from('quotes')
                  .update({ 
                    share_token: shareToken,
                    is_public: true 
                  })
                  .eq('id', quote.id)
              );
            }
          }
        } catch (shareError) {
          console.error('Failed to generate share token for draft quote email:', shareError);
        }
      }
      
      // Use default email content for draft quotes marked as sent
      const emailSubject = `Devis ${quote.quote_number} - ${companyProfile?.company_name || 'Notre entreprise'}`;
      const emailMessage = `Bonjour,\n\nVeuillez trouver ci-joint notre devis pour votre projet.\n\nCordialement,\n${companyProfile?.company_name || 'Votre équipe'}`;
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_title: quote.title || quote.description || 'Votre projet',
        quote_amount: `${quote.final_amount || quote.total_amount || 0}€`,
        quote_link: shareToken ? `${BASE_URL}/quote-share/${shareToken}` : '#',
        valid_until: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '30 jours',
        company_name: companyProfile?.company_name || 'Notre entreprise',
        custom_subject: emailSubject,
        custom_message: emailMessage
      };
      
      // Get client's language preference using centralized helper
      const clientLanguage = await this.getClientLanguagePreference(client);
      
      // Send email to client using custom quote email
      return await this.sendCustomQuoteEmail(variables, client.email, userId, {
        subject: emailSubject,
        message: emailMessage
      }, clientLanguage);
      
    } catch (error) {
      console.error('Error sending draft quote marked as sent email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send credit insurance application email to info@haliqo.com
   */
  static async sendCreditInsuranceApplicationEmail(application, language = 'fr') {
    try {
      const emailData = {
        to: 'info@haliqo.com',
        subject: `Nouvelle demande d'assurance crédit - ${application.companyName}`,
        application,
        text: `Nouvelle demande d'assurance crédit reçue de ${application.companyName}`,
        language: language || 'fr'
      };
      
      const result = await this.sendEmailViaEdgeFunction('credit_insurance_application', emailData);
      
      if (result.success) {
        console.log('Credit insurance application email sent successfully to info@haliqo.com');
        return { success: true, data: result.data, error: null };
      } else {
        console.error('Failed to send credit insurance application email:', result.error);
        return { success: false, data: null, error: result.error };
      }
    } catch (error) {
      console.error('Error sending credit insurance application email:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Send credit insurance confirmation email to applicant
   */
  static async sendCreditInsuranceConfirmationEmail(application, language = 'fr') {
    try {
      const emailData = {
        to: application.email,
        subject: 'Confirmation de votre demande d\'assurance crédit',
        application,
        text: `Confirmation de votre demande d'assurance crédit pour ${application.companyName}`,
        language: language || 'fr'
      };
      
      const result = await this.sendEmailViaEdgeFunction('credit_insurance_confirmation', emailData);
      
      if (result.success) {
        console.log('Credit insurance confirmation email sent successfully to applicant');
        return { success: true, data: result.data, error: null };
      } else {
        console.error('Failed to send credit insurance confirmation email:', result.error);
        return { success: false, data: null, error: result.error };
      }
    } catch (error) {
      console.error('Error sending credit insurance confirmation email:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

export default EmailService;
