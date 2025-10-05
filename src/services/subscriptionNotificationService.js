import { supabase } from './supabaseClient';

export class SubscriptionNotificationService {
  
  /**
   * Send subscription notification email via Edge Function
   */
  static async sendSubscriptionNotificationEmail(emailType, emailData) {
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
      console.error('Subscription notification email error:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get subscription email template by type
   */
  static async getSubscriptionEmailTemplate(templateType, userId = null) {
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
      console.error('Error getting subscription email template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Render subscription email template with variables
   */
  static renderSubscriptionEmailTemplate(template, variables) {
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
      console.error('Error rendering subscription email template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription upgrade notification
   */
  static async sendSubscriptionUpgradeNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_upgraded';
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || userData.email,
        user_email: userData.email,
        old_plan_name: subscriptionData.oldPlanName || 'Plan précédent',
        new_plan_name: subscriptionData.newPlanName || subscriptionData.plan_name,
        old_amount: subscriptionData.oldAmount ? `${subscriptionData.oldAmount}€` : 'N/A',
        new_amount: `${subscriptionData.newAmount || subscriptionData.amount}€`,
        billing_interval: subscriptionData.billing_interval || 'monthly',
        effective_date: subscriptionData.effectiveDate || new Date().toLocaleDateString('fr-FR'),
        support_email: 'support@haliqo.com',
        company_name: 'Haliqo'
      };
      
      // Render template with variables
      const renderResult = this.renderSubscriptionEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        user_email: userData.email,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables,
        subscription_data: subscriptionData
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_upgraded', emailData);
      
      if (result.success) {
        console.log(`Subscription upgrade notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send subscription upgrade notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending subscription upgrade notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription downgrade notification
   */
  static async sendSubscriptionDowngradeNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_downgraded';
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || userData.email,
        user_email: userData.email,
        old_plan_name: subscriptionData.oldPlanName || 'Plan précédent',
        new_plan_name: subscriptionData.newPlanName || subscriptionData.plan_name,
        old_amount: subscriptionData.oldAmount ? `${subscriptionData.oldAmount}€` : 'N/A',
        new_amount: `${subscriptionData.newAmount || subscriptionData.amount}€`,
        billing_interval: subscriptionData.billing_interval || 'monthly',
        effective_date: subscriptionData.effectiveDate || new Date().toLocaleDateString('fr-FR'),
        support_email: 'support@haliqo.com',
        company_name: 'Haliqo'
      };
      
      // Render template with variables
      const renderResult = this.renderSubscriptionEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        user_email: userData.email,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables,
        subscription_data: subscriptionData
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_downgraded', emailData);
      
      if (result.success) {
        console.log(`Subscription downgrade notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send subscription downgrade notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending subscription downgrade notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription cancellation notification
   */
  static async sendSubscriptionCancellationNotification(subscriptionData, userData, cancellationReason = 'User request') {
    try {
      const templateType = 'subscription_cancelled';
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || userData.email,
        user_email: userData.email,
        old_plan_name: subscriptionData.plan_name || 'Plan actuel',
        effective_date: subscriptionData.effectiveDate || new Date().toLocaleDateString('fr-FR'),
        cancellation_reason: cancellationReason,
        support_email: 'support@haliqo.com',
        company_name: 'Haliqo'
      };
      
      // Render template with variables
      const renderResult = this.renderSubscriptionEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        user_email: userData.email,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables,
        subscription_data: subscriptionData,
        cancellation_reason: cancellationReason
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_cancelled', emailData);
      
      if (result.success) {
        console.log(`Subscription cancellation notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send subscription cancellation notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending subscription cancellation notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription activation notification (for new registrations)
   */
  static async sendSubscriptionActivationNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_activated';
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || userData.email,
        user_email: userData.email,
        new_plan_name: subscriptionData.plan_name || subscriptionData.newPlanName,
        new_amount: `${subscriptionData.amount || subscriptionData.newAmount}€`,
        billing_interval: subscriptionData.billing_interval || subscriptionData.interval,
        effective_date: subscriptionData.effectiveDate || new Date().toLocaleDateString('fr-FR'),
        support_email: 'support@haliqo.com',
        company_name: 'Haliqo'
      };
      
      // Render template with variables
      const renderResult = this.renderSubscriptionEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        user_email: userData.email,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables,
        subscription_data: subscriptionData
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_activated', emailData);
      
      if (result.success) {
        console.log(`Subscription activation notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send subscription activation notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending subscription activation notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send trial ending notification
   */
  static async sendTrialEndingNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_trial_ending';
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || userData.email,
        user_email: userData.email,
        new_plan_name: subscriptionData.plan_name || 'Plan d\'essai',
        trial_end_date: subscriptionData.trial_end ? new Date(subscriptionData.trial_end).toLocaleDateString('fr-FR') : 'Bientôt',
        new_amount: `${subscriptionData.amount || 0}€`,
        billing_interval: subscriptionData.billing_interval || 'monthly',
        support_email: 'support@haliqo.com',
        company_name: 'Haliqo'
      };
      
      // Render template with variables
      const renderResult = this.renderSubscriptionEmailTemplate(templateResult.data, variables);
      if (!renderResult.success) {
        throw new Error(`Failed to render template: ${renderResult.error}`);
      }
      
      // Send via edge function
      const emailData = {
        user_email: userData.email,
        subject: renderResult.data.subject,
        html: renderResult.data.html,
        text: renderResult.data.text,
        template_type: templateType,
        variables,
        subscription_data: subscriptionData
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_trial_ending', emailData);
      
      if (result.success) {
        console.log(`Trial ending notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send trial ending notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending trial ending notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user data for notifications
   */
  static async getUserData(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return { success: true, data: user };
      
    } catch (error) {
      console.error('Error getting user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log subscription notification event
   */
  static async logSubscriptionNotificationEvent(userId, notificationType, subscriptionData, emailResult) {
    try {
      const { error } = await supabase
        .from('subscription_notifications')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          subscription_data: subscriptionData,
          email_sent: emailResult.success,
          email_error: emailResult.error,
          sent_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging subscription notification:', error);
      }
      
    } catch (error) {
      console.error('Error logging subscription notification event:', error);
    }
  }
}

export default SubscriptionNotificationService;
