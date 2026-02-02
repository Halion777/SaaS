import { supabase } from './supabaseClient';

/**
 * Book Demo Service
 * Saves demo requests to demo_requests and sends notification email via send-emails Edge Function.
 * No book-demo Edge Function required; all logic runs from this service.
 */

async function submitBookDemo(formData, language = null) {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }

    const lang = language
      ? String(language).split('-')[0]
      : (typeof window !== 'undefined' && (localStorage.getItem('language') || localStorage.getItem('i18nextLng')))?.split('-')[0] || 'fr';

    const name = formData.name?.trim() || '';
    const company_name = formData.companyName?.trim() || '';
    const phone = formData.phone?.trim() || '';
    const email = formData.email?.trim() || '';
    const preferred_dates = Array.isArray(formData.preferredDates) ? formData.preferredDates : [];

    if (!name || !company_name || !phone || !email) {
      return { success: false, error: 'Name, company, phone and email are required.' };
    }

    // 1) Get support email from app_settings (same as contact form)
    const { data: companyData, error: companyError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'company_details')
      .maybeSingle();

    if (companyError && companyError.code !== 'PGRST116') {
      console.error('Error fetching company details:', companyError);
    }
    const supportEmail = companyData?.setting_value?.email || 'support@haliqo.com';

    // 2) Insert into demo_requests (requires RLS policy allowing anon insert)
    const { error: insertError } = await supabase.from('demo_requests').insert({
      name,
      company_name,
      phone,
      email: email.toLowerCase(),
      preferred_dates,
      status: 'new',
    });

    if (insertError) {
      console.error('demo_requests insert error:', insertError);
      return { success: false, error: 'Failed to save demo request.' };
    }

    // 3) Send email via send-emails Edge Function (book_demo template)
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        emailType: 'book_demo',
        emailData: {
          name,
          company_name,
          phone,
          email: email.toLowerCase(),
          preferred_dates,
          language: lang,
          support_email: supportEmail,
        },
      }),
    });

    const contentType = response.headers.get('content-type');
    let result = {};
    if (contentType?.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: text || 'Unknown error' };
      }
    }

    // Request saved; email failure is non-blocking (same as previous Edge Function behavior)
    if (!response.ok || result.success === false) {
      console.warn('send-emails book_demo error:', result.error || response.statusText);
      return { success: true, data: { emailSent: false }, error: null };
    }

    return { success: true, data: { emailSent: true } };
  } catch (error) {
    let message = error.message || 'Failed to submit demo request.';
    if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
      message = 'Network error. Please check your internet connection and try again.';
    } else if (error.message?.includes('Missing Supabase')) {
      message = 'Configuration error. Please contact support.';
    }
    return { success: false, error: message };
  }
}

export default { submitBookDemo };
