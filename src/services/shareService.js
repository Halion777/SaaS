import { supabase } from './supabaseClient';

/**
 * Generate a public share link for a quote
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const generatePublicShareLink = async (quoteId, userId) => {
  try {
    if (!quoteId || !userId) {
      return { success: false, error: 'Quote ID and User ID are required' };
    }

    // Generate a unique share token
    const shareToken = generateShareToken();
    
    // Update quotes table directly
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ share_token: shareToken, is_public: true })
      .eq('id', quoteId);

    if (updateError) {
      return { success: false, error: 'Failed to create share link' };
    }

    // Generate the public URL
    const publicUrl = `${window.location.origin}/quote-share/${shareToken}`;
    
    return { 
      success: true, 
      data: publicUrl,
      token: shareToken
    };
  } catch (error) {
    console.error('Error generating share link:', error);
    return { success: false, error: 'Failed to generate share link' };
  }
};

/**
 * Get share link information
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getShareLinkInfo = async (quoteId) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('share_token, is_public')
      .eq('id', quoteId)
      .single();

    if (error) return { success: false, error: 'Failed to get share link info' };
    if (!data?.is_public || !data?.share_token) return { success: true, data: null };
    return { success: true, data: { share_token: data.share_token } };
  } catch (error) {
    console.error('Error getting share link info:', error);
    return { success: false, error: 'Failed to get share link info' };
  }
};

/**
 * Deactivate a share link
 * @param {string} shareId - Share ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deactivateShareLink = async (quoteId) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ is_public: false, share_token: null })
      .eq('id', quoteId);

    if (error) {
      return { success: false, error: 'Failed to deactivate share link' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deactivating share link:', error);
    return { success: false, error: 'Failed to deactivate share link' };
  }
};

/**
 * Get quote by share token (for public access)
 * @param {string} shareToken - Share token (can be regular share_token or view_only_token)
 * @returns {Promise<{success: boolean, data?: Object, isViewOnly?: boolean, error?: string}>}
 */
export const getQuoteByShareToken = async (shareToken) => {
  try {
    // First, try to find by regular share_token
    let { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(id, name, email, phone, address, city, postal_code, country),
        company_profile:company_profiles(
          id, company_name, logo_path, logo_filename, logo_size, logo_mime_type,
          signature_path, signature_filename, signature_size, signature_mime_type,
          address, city, state, postal_code, phone, email, website, vat_number, country
        ),
        quote_tasks(
          id, name, description, quantity, unit, unit_price, total_price,
          duration, duration_unit, pricing_type, hourly_rate, order_index
        ),
        quote_materials(
          id, quote_task_id, name, description, quantity, unit, unit_price, total_price, order_index
        ),
        quote_files(
          id, file_name, file_path, file_size, mime_type, file_category, uploaded_by, created_at
        ),
        quote_financial_configs(
          id, vat_config, advance_config, marketing_banner, payment_terms, discount_config, created_at
        ),
        quote_signatures(
          id, signer_name, signer_email, signature_data, signature_mode, signature_type,
          signature_file_path, signature_filename, signature_size, signature_mime_type,
          customer_comment, signed_at, created_at
        )
      `)
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    let isViewOnly = false;

    // If not found by regular token, try view_only_token
    if (quoteError) {
      const { data: viewOnlyQuote, error: viewOnlyError } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(id, name, email, phone, address, city, postal_code, country),
          company_profile:company_profiles(
            id, company_name, logo_path, logo_filename, logo_size, logo_mime_type,
            signature_path, signature_filename, signature_size, signature_mime_type,
            address, city, state, postal_code, phone, email, website, vat_number, country
          ),
          quote_tasks(
            id, name, description, quantity, unit, unit_price, total_price,
            duration, duration_unit, pricing_type, hourly_rate, order_index
          ),
          quote_materials(
            id, quote_task_id, name, description, quantity, unit, unit_price, total_price, order_index
          ),
          quote_files(
            id, file_name, file_path, file_size, mime_type, file_category, uploaded_by, created_at
          ),
          quote_financial_configs(
            id, vat_config, advance_config, marketing_banner, payment_terms, discount_config, created_at
          ),
          quote_signatures(
            id, signer_name, signer_email, signature_data, signature_mode, signature_type,
            signature_file_path, signature_filename, signature_size, signature_mime_type,
            customer_comment, signed_at, created_at
          )
        `)
        .eq('view_only_token', shareToken)
        .eq('is_public', true)
        .single();

      if (viewOnlyError) {
        return { success: false, error: 'Quote not found' };
      }

      quoteData = viewOnlyQuote;
      isViewOnly = true; // This is a view-only token
    }

    return { success: true, data: quoteData, isViewOnly };
  } catch (error) {
    console.error('Error getting quote by share token:', error);
    return { success: false, error: 'Failed to get quote data' };
  }
};

/**
 * Generate a view-only token for copy emails
 * @param {string} quoteId - Quote ID
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export const generateViewOnlyToken = async (quoteId) => {
  try {
    if (!quoteId) {
      return { success: false, error: 'Quote ID is required' };
    }

    // Generate a unique view-only token
    const viewOnlyToken = generateShareToken();
    
    // Update quotes table with view-only token
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ view_only_token: viewOnlyToken })
      .eq('id', quoteId);

    if (updateError) {
      return { success: false, error: 'Failed to create view-only token' };
    }

    return { 
      success: true, 
      token: viewOnlyToken
    };
  } catch (error) {
    console.error('Error generating view-only token:', error);
    return { success: false, error: 'Failed to generate view-only token' };
  }
};

/**
 * Generate a unique share token
 * @returns {string} Unique share token
 */
const generateShareToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
