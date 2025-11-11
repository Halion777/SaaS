import { supabase } from './supabaseClient';

/**
 * Contact Service
 * Handles contact form submissions and company details
 */
class ContactService {
  /**
   * Submit contact form
   * @param {object} formData - Contact form data
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async submitContactForm(formData) {
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
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || '',
            subject: formData.subject,
            message: formData.message,
            support_email: supportEmail
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
        result = text ? JSON.parse(text) : {};
      }

      // Check if the response indicates an error
      if (!response.ok) {
        const errorMessage = result.error || result.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Check if result indicates failure
      if (result.success === false) {
        throw new Error(result.error || 'Failed to send email');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error submitting contact form:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Failed to submit contact form';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Missing Supabase')) {
        errorMessage = 'Configuration error. Please contact support.';
      } else if (error.message.includes('Email service not configured')) {
        errorMessage = 'Email service is not configured. Please contact the administrator.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get company details from app settings
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getCompanyDetails() {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'company_details')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Return default values if no settings found
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
        success: true,
        data: data?.setting_value || defaultDetails
      };
    } catch (error) {
      console.error('Error loading company details:', error);
      return {
        success: false,
        error: error.message,
        data: {
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
        }
      };
    }
  }
}

export default new ContactService();

