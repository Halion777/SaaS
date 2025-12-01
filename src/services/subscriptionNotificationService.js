import { supabase } from './supabaseClient';
import AppSettingsService from './appSettingsService';

export class SubscriptionNotificationService {
  
  /**
   * Get all pricing data from database for displaying plans
   * Returns both monthly and yearly prices for all plans
   */
  static async getAllPricingData() {
    try {
      const pricingResult = await AppSettingsService.getSetting('pricing_settings');
      
      if (!pricingResult.success || !pricingResult.data) {
        
        // Fallback values for UI when database is unavailable
        return {
          success: true,
          data: {
            starter: {
              name: 'Starter Plan',
              description: 'An intelligent entry-level plan for craftsmen who want clean, compliant quotes and invoices with a tool that is very easy to use.',
              monthly: 39.99,
              yearly: 31.99,
              yearlyTotal: 383.88,
              popular: false
            },
            pro: {
              name: 'Pro Plan',
              description: 'The premium version of your back-office: an intelligent tool focused on AI, automation and growth, still very easy to use for any craftsman.',
              monthly: 69.99,
              yearly: 55.99,
              yearlyTotal: 671.88,
              popular: true
            }
          }
        };
      }
      
      const pricingSettings = pricingResult.data;
      
      // Build response with calculated yearly totals
      const pricing = {};
      for (const [planType, plan] of Object.entries(pricingSettings)) {
        // Get current language from localStorage or default to 'fr'
        const currentLang = typeof window !== 'undefined' 
          ? (localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr').split('-')[0] || 'fr'
          : 'fr';
        
        // Get description, features, and limitations for current language
        const description = typeof plan.description === 'object' 
          ? (plan.description[currentLang] || plan.description['fr'] || '')
          : (plan.description || '');
        
        const features = plan.features && typeof plan.features === 'object'
          ? (plan.features[currentLang] || plan.features['fr'] || [])
          : [];
        
        const limitations = plan.limitations && typeof plan.limitations === 'object'
          ? (plan.limitations[currentLang] || plan.limitations['fr'] || [])
          : [];
        
        pricing[planType] = {
          name: plan.name || `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
          description: description,
          features: features,
          limitations: limitations,
          monthly: parseFloat(plan.monthly) || 0,
          yearly: parseFloat(plan.yearly) || 0, // Monthly equivalent when billed yearly
          yearlyTotal: parseFloat((parseFloat(plan.yearly) * 12).toFixed(2)) || 0, // Total for year
          popular: plan.popular || false
        };
      }
      
      return { success: true, data: pricing };
      
    } catch (error) {
      console.error('Error getting all pricing data:', error);
      // Fallback values for UI when there's a network/database error
      return {
        success: true,
        data: {
          starter: {
            name: 'Starter Plan',
            description: 'An intelligent entry-level plan for craftsmen who want clean, compliant quotes and invoices with a tool that is very easy to use.',
            monthly: 39.99,
            yearly: 31.99,
            yearlyTotal: 383.88,
            popular: false
          },
          pro: {
            name: 'Pro Plan',
            description: 'The premium version of your back-office: an intelligent tool focused on AI, automation and growth, still very easy to use for any craftsman.',
            monthly: 69.99,
            yearly: 55.99,
            yearlyTotal: 671.88,
            popular: true
          }
        }
      };
    }
  }
  
  /**
   * Get pricing information from database based on plan type and billing interval
   */
  static async getPricingInfo(planType, billingInterval = 'monthly') {
    try {
      // Get pricing settings from database
      const pricingResult = await AppSettingsService.getSetting('pricing_settings');
      
      if (!pricingResult.success || !pricingResult.data) {
        
        // Fallback values for UI when database is unavailable
        const defaultPricing = {
          starter: { name: 'Starter Plan', monthly: 39.99, yearly: 31.99 },
          pro: { name: 'Pro Plan', monthly: 69.99, yearly: 55.99 }
        };
        const plan = defaultPricing[planType] || defaultPricing.starter;
        return {
          success: true,
          data: {
            plan_name: plan.name,
            amount: billingInterval === 'yearly' ? plan.yearly : plan.monthly
          }
        };
      }
      
      const pricingSettings = pricingResult.data;
      const plan = pricingSettings[planType] || pricingSettings.starter;
      
      if (!plan) {
        throw new Error(`Plan type ${planType} not found in pricing settings`);
      }
      
      // Get the correct price based on billing interval
      const amount = billingInterval === 'yearly' ? plan.yearly : plan.monthly;
      const planName = plan.name || `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`;
      
      return {
        success: true,
        data: {
          plan_name: planName,
          amount: amount,
          description: plan.description || ''
        }
      };
      
    } catch (error) {
      console.error('Error getting pricing info:', error);
      // Fallback values for UI when there's a network/database error
      const defaultPricing = {
        starter: { name: 'Starter Plan', monthly: 39.99, yearly: 31.99 },
        pro: { name: 'Pro Plan', monthly: 69.99, yearly: 55.99 }
      };
      const plan = defaultPricing[planType] || defaultPricing.starter;
      return {
        success: true,
        data: {
          plan_name: plan.name,
          amount: billingInterval === 'yearly' ? plan.yearly : plan.monthly
        }
      };
    }
  }
  
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
  static async getSubscriptionEmailTemplate(templateType, userId = null, language = null) {
    try {
      // Get user's language preference if userId provided
      let userLanguage = language || 'fr';
      if (userId && !language) {
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
      } else if (!language && typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
        userLanguage = storedLang.split('-')[0] || 'fr';
      }
      
      // Ensure language is base code (e.g., 'fr' from 'fr-FR')
      const baseLanguage = userLanguage.split('-')[0] || 'fr';
      
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
   * Get user's language preference
   */
  static async getUserLanguagePreference(userId) {
    try {
      if (userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('language_preference')
          .eq('id', userId)
          .maybeSingle();
        
        if (userData?.language_preference) {
          return userData.language_preference.split('-')[0] || 'fr';
        }
      }
      
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
        return storedLang.split('-')[0] || 'fr';
      }
      
      return 'fr';
    } catch (error) {
      console.warn('Error fetching user language preference:', error);
      if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
        return storedLang.split('-')[0] || 'fr';
      }
      return 'fr';
    }
  }

  /**
   * Send subscription upgrade notification
   */
  static async sendSubscriptionUpgradeNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_upgraded';
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database for old and new plans
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      
      // Get old plan pricing (if available)
      let oldPlanName = subscriptionData.oldPlanName || 'Plan précédent';
      let oldAmount = subscriptionData.oldAmount;
      if (subscriptionData.oldPlanType) {
        const oldPricing = await this.getPricingInfo(subscriptionData.oldPlanType, subscriptionData.oldBillingInterval || billingInterval);
        if (oldPricing.success) {
          oldPlanName = oldPricing.data.plan_name;
          oldAmount = oldPricing.data.amount;
        }
      }
      
      // Get new plan pricing from database
      const planType = subscriptionData.plan_type || subscriptionData.newPlanType || 'starter';
      const newPricing = await this.getPricingInfo(planType, billingInterval);
      const newPlanName = newPricing.success ? newPricing.data.plan_name : (subscriptionData.newPlanName || subscriptionData.plan_name);
      const newAmount = newPricing.success ? newPricing.data.amount : (subscriptionData.newAmount || subscriptionData.amount);
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        old_plan_name: oldPlanName,
        new_plan_name: newPlanName,
        old_amount: oldAmount ? `${oldAmount}€` : 'N/A',
        new_amount: `${newAmount}€`,
        billing_interval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
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
      // Pass variables and let edge function fetch template from database
      // Keep pre-rendered HTML as fallback only
      const emailData = {
        user_email: userData.email,
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        language: userLanguage
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
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database for old and new plans
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      
      // Get old plan pricing (if available)
      let oldPlanName = subscriptionData.oldPlanName || 'Plan précédent';
      let oldAmount = subscriptionData.oldAmount;
      if (subscriptionData.oldPlanType) {
        const oldPricing = await this.getPricingInfo(subscriptionData.oldPlanType, subscriptionData.oldBillingInterval || billingInterval);
        if (oldPricing.success) {
          oldPlanName = oldPricing.data.plan_name;
          oldAmount = oldPricing.data.amount;
        }
      }
      
      // Get new plan pricing from database
      const planType = subscriptionData.plan_type || subscriptionData.newPlanType || 'starter';
      const newPricing = await this.getPricingInfo(planType, billingInterval);
      const newPlanName = newPricing.success ? newPricing.data.plan_name : (subscriptionData.newPlanName || subscriptionData.plan_name);
      const newAmount = newPricing.success ? newPricing.data.amount : (subscriptionData.newAmount || subscriptionData.amount);
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        old_plan_name: oldPlanName,
        new_plan_name: newPlanName,
        old_amount: oldAmount ? `${oldAmount}€` : 'N/A',
        new_amount: `${newAmount}€`,
        billing_interval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
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
      // Pass variables and let edge function fetch template from database
      const emailData = {
        user_email: userData.email,
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        language: userLanguage
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
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database for cancelled plan
      const planType = subscriptionData.plan_type || 'starter';
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      const planPricing = await this.getPricingInfo(planType, billingInterval);
      const planName = planPricing.success ? planPricing.data.plan_name : (subscriptionData.plan_name || 'Plan actuel');
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        old_plan_name: planName,
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
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        cancellation_reason: cancellationReason,
        language: userLanguage
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
   * Send subscription reactivation notification
   */
  static async sendSubscriptionReactivationNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_reactivated';
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database
      const planType = subscriptionData.plan_type || 'starter';
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      const planPricing = await this.getPricingInfo(planType, billingInterval);
      const planName = planPricing.success ? planPricing.data.plan_name : (subscriptionData.plan_name || 'Plan actuel');
      const planAmount = planPricing.success ? planPricing.data.amount : (subscriptionData.amount || 0);
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        plan_name: planName,
        amount: `${planAmount}€`,
        billing_interval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
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
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        language: userLanguage
      };
      
      const result = await this.sendSubscriptionNotificationEmail('subscription_reactivated', emailData);
      
      if (result.success) {
        console.log(`Subscription reactivation notification sent successfully to ${userData.email}`);
        return result;
      } else {
        console.error(`Failed to send subscription reactivation notification:`, result.error);
        return result;
      }
      
    } catch (error) {
      console.error('Error sending subscription reactivation notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription activation notification (for new registrations)
   */
  static async sendSubscriptionActivationNotification(subscriptionData, userData) {
    try {
      const templateType = 'subscription_activated';
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database
      const planType = subscriptionData.plan_type || 'starter';
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      const planPricing = await this.getPricingInfo(planType, billingInterval);
      const planName = planPricing.success ? planPricing.data.plan_name : (subscriptionData.plan_name || subscriptionData.newPlanName);
      const planAmount = planPricing.success ? planPricing.data.amount : (subscriptionData.amount || subscriptionData.newAmount);
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        new_plan_name: planName,
        new_amount: `${planAmount}€`,
        billing_interval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
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
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        language: userLanguage
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
      
      // Get user's language preference
      const userLanguage = await this.getUserLanguagePreference(userData.id);
      
      // Get the appropriate template
      const templateResult = await this.getSubscriptionEmailTemplate(templateType, userData.id, userLanguage);
      if (!templateResult.success) {
        throw new Error(`Failed to get template: ${templateResult.error}`);
      }
      
      // Get pricing info from database
      const planType = subscriptionData.plan_type || 'starter';
      const billingInterval = subscriptionData.billing_interval || subscriptionData.interval || 'monthly';
      const planPricing = await this.getPricingInfo(planType, billingInterval);
      const planName = planPricing.success ? planPricing.data.plan_name : (subscriptionData.plan_name || 'Plan d\'essai');
      const planAmount = planPricing.success ? planPricing.data.amount : (subscriptionData.amount || 0);
      
      // Prepare variables
      const variables = {
        user_name: userData.full_name || (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) || userData.email,
        user_email: userData.email,
        new_plan_name: planName,
        trial_end_date: subscriptionData.trial_end ? new Date(subscriptionData.trial_end).toLocaleDateString('fr-FR') : 'Bientôt',
        new_amount: `${planAmount}€`,
        billing_interval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
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
        user_id: userData.id, // Pass user_id so edge function can fetch user-specific templates
        subject: renderResult.data.subject, // Fallback subject
        html: renderResult.data.html, // Fallback HTML
        text: renderResult.data.text, // Fallback text
        template_type: templateType,
        variables, // Pass variables so edge function can render template
        subscription_data: subscriptionData,
        language: userLanguage
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
        .select('id, email, first_name, last_name, phone')
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
