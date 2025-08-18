const BASE_URL = import.meta.env.SITE_URL || window.location.origin;

export class EmailService {
  
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
  
  /**
   * Send welcome email to new clients
   */
  static async sendWelcomeEmail(clientData) {
    try {
      const emailData = {
        client_email: clientData.email,
        clientData
      };
      
      const result = await this.sendEmailViaEdgeFunction('welcome_client', emailData);
      
      if (result.success) {
        console.log('Welcome email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send welcome email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send quote notification email (handles both lead-based and manually created quotes)
   */
  static async sendQuoteNotificationEmail(clientData, quoteData, artisanData, customMessage = null, customSubject = null) {
    try {
      const emailData = {
        client_email: clientData.client_email,
        project_description: clientData.project_description,
        message: customMessage, // Pass the custom message
        subject: customSubject, // Pass the custom subject
        clientData,
        quoteData,
        artisanData
      };
      
      const result = await this.sendEmailViaEdgeFunction('quote_notification', emailData);
      
      if (result.success) {
        console.log('Quote notification email sent successfully via edge function');
        return result;
      } else {
        console.error('Failed to send quote notification email:', result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }
}

export default EmailService;
