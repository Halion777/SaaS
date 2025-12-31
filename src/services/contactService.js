import { supabase } from './supabaseClient';

/**
 * Contact Service
 * Handles contact form submissions and company details
 */
class ContactService {
  /**
   * Submit contact form
   * @param {object} formData - Contact form data
   * @param {string} language - Optional language code (defaults to 'fr')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async submitContactForm(formData, language = null) {
    try {
      // Get support email from app settings
      const { data: companyData, error: companyError } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'company_details')
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') {
        console.error('Error fetching company details:', companyError);
      }

      const supportEmail = companyData?.setting_value?.email || 'support@haliqo.com';

      // Validate environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration. Please check your environment variables.');
      }

      // Get user language preference (default to 'fr')
      // Use provided language, or try multiple possible keys for language storage
      let userLanguage = language;
      if (!userLanguage && typeof window !== 'undefined') {
        userLanguage = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
      }
      if (!userLanguage) {
        userLanguage = 'fr';
      }
      const finalLanguage = userLanguage.split('-')[0] || 'fr'; // Extract base language (e.g., 'fr' from 'fr-FR')
      
      // Send email via edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          emailType: 'contact_form',
          emailData: {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            email: formData.email,
            phone: formData.phone || '',
            subject: formData.subject,
            message: formData.message,
            support_email: supportEmail,
            language: finalLanguage // Pass language for template selection
          }
        })
      });

      // Parse response
      let result;
      const contentType = response.headers.get('content-type');
      
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        
        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseError) {
          
          result = { error: text || 'Unknown error' };
        }
      }
      
    
      // Check if the response indicates an error
      if (!response.ok) {
        const errorMessage = result.error || result.message || `Server error: ${response.status}`;
        console.error('Contact form error response:', errorMessage);
        throw new Error(errorMessage);
      }

      // Check if result indicates failure
      if (result.success === false) {
        const errorMsg = result.error || 'Failed to send email';
        console.error('Contact form failed:', errorMsg);
        throw new Error(errorMsg);
      }

      return { success: true, data: result };
    } catch (error) {
      
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      });
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Failed to submit contact form';
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Missing Supabase')) {
        errorMessage = 'Configuration error. Please contact support.';
      } else if (error.message.includes('Email service not configured')) {
        errorMessage = 'Email service is not configured. Please contact the administrator.';
      } else if (error.message.includes('Template not found') || error.message.includes('template')) {
        errorMessage = 'Email template not found. Please contact the administrator.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get company details from app settings
   * @param {string} language - Optional language code (defaults to 'fr')
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getCompanyDetails(language = null) {
    try {
      // Get user language preference
      let userLanguage = language;
      if (!userLanguage && typeof window !== 'undefined') {
        userLanguage = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'fr';
      }
      if (!userLanguage) {
        userLanguage = 'fr';
      }
      const finalLanguage = userLanguage.split('-')[0] || 'fr'; // Extract base language (e.g., 'fr' from 'fr-FR')

      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'company_details')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Helper function to get language-specific value
      const getLangValue = (value, defaultValues) => {
        if (typeof value === 'object' && value !== null && (value.fr || value.en || value.nl)) {
          // New format: object with language keys
          return value[finalLanguage] || value.fr || value.en || value.nl || defaultValues[finalLanguage] || defaultValues.fr || '';
        }
        // Old format: string (backward compatibility)
        return value || defaultValues[finalLanguage] || defaultValues.fr || '';
      };

      const rawDetails = data?.setting_value || {};
      
      // Return default values if no settings found
      const defaultDetails = {
        email: 'support@haliqo.com',
        phone: '028846333',
        address: {
          fr: 'Brussels, Belgium',
          en: 'Brussels, Belgium',
          nl: 'Brussel, België'
        },
        addressType: {
          fr: 'Headquarters',
          en: 'Headquarters',
          nl: 'Hoofdkantoor'
        },
        responseTime: {
          fr: 'Response within 24h',
          en: 'Response within 24h',
          nl: 'Reactie binnen 24u'
        },
        hours: {
          fr: 'Mon-Fri, 9am-6pm',
          en: 'Mon-Fri, 9am-6pm',
          nl: 'Ma-Vr, 9u-18u'
        },
        socialLinks: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      };

      // Return language-specific values for display
      return {
        success: true,
        data: {
          email: rawDetails.email || defaultDetails.email,
          phone: rawDetails.phone || defaultDetails.phone,
          address: getLangValue(rawDetails.address, defaultDetails.address),
          addressType: getLangValue(rawDetails.addressType, defaultDetails.addressType),
          responseTime: getLangValue(rawDetails.responseTime, defaultDetails.responseTime),
          hours: getLangValue(rawDetails.hours, defaultDetails.hours),
          socialLinks: rawDetails.socialLinks || defaultDetails.socialLinks
        }
      };
    } catch (error) {
      
      
      const defaultDetails = {
        email: 'support@haliqo.com',
        phone: '028846333',
        address: 'Brussels, Belgium',
        addressType: 'Headquarters',
        responseTime: 'Response within 24h',
        hours: 'Mon-Fri, 9am-6pm',
        socialLinks: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      };
      
      return {
        success: false,
        error: error.message,
        data: defaultDetails
      };
    }
  }
}

export default new ContactService();

