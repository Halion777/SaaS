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
      const { data: companyData } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'company_details')
        .maybeSingle();

      const supportEmail = companyData?.setting_value?.email || 'support@haliqo.com';

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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send contact form: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error submitting contact form:', error);
      return { success: false, error: error.message || 'Failed to submit contact form' };
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

