const BASE_URL = import.meta.env.SITE_URL || window.location.origin;

import { supabase } from './supabaseClient';

export class EmailService {
  
  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
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
  static async sendNewLeadNotificationEmail(leadData, artisanData) {
    try {
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData
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
  static async sendLeadAssignmentEmail(leadData, artisanData) {
    try {
      const emailData = {
        artisan_email: artisanData.email,
        project_description: leadData.project_description,
        leadData,
        artisanData
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
  static async getEmailTemplate(templateType, userId = null) {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true);
      
      if (userId) {
        // Get user-specific template first
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
        .eq('is_default', true)
        .eq('is_active', true)
        .single();
      
      if (defaultError) {
        throw defaultError;
      }
      
      return { success: true, data: defaultTemplate };
      
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
   */
  static async sendTemplatedEmail(templateType, variables, clientEmail, userId = null) {
    try {
      // Get the appropriate template
      const templateResult = await this.getEmailTemplate(templateType, userId);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Render template with variables
      const renderResult = this.renderEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        client_email: clientEmail,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables
      };
      
      const result = await this.sendEmailViaEdgeFunction('templated_email', emailData);
      
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
  static async sendQuoteSentEmail(quote, client, companyProfile, userId = null) {
    try {
      // If no company profile provided, try to get it from the current user
      if (!companyProfile && userId) {
        companyProfile = await this.getCurrentUserCompanyProfile(userId);
      }
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_title: quote.title || quote.project_description || 'Votre projet',
        quote_amount: `${quote.total_with_tax || quote.total_amount || 0}€`,
        quote_link: `${BASE_URL}/quote-share/${quote.share_token}`,
        valid_until: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '30 jours',
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      return await this.sendTemplatedEmail('quote_sent', variables, client.email, userId);
      
    } catch (error) {
      console.error('Error sending quote sent email:', error);
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
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_title: quote.title || quote.project_description || 'Votre projet',
        quote_amount: `${quote.total_with_tax || quote.total_amount || 0}€`,
        quote_link: `${BASE_URL}/quote-share/${quote.share_token}`,
        days_since_sent: daysSinceSent || 'quelques',
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      return await this.sendTemplatedEmail(followUpType, variables, client.email, userId);
      
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
      
      const variables = {
        client_name: client.name || 'Madame, Monsieur',
        quote_number: quote.quote_number,
        quote_amount: `${quote.total_with_tax || quote.total_amount || 0}€`,
        quote_link: `${BASE_URL}/quote-share/${quote.share_token}`,
        company_name: companyProfile?.company_name || 'Notre entreprise'
      };
      
      return await this.sendTemplatedEmail('client_accepted', variables, client.email, userId);
      
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
      
      return await this.sendTemplatedEmail('client_rejected', variables, client.email, userId);
      
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
      
      return await this.sendTemplatedEmail('welcome_client', variables, clientData.email, userId);
      
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
