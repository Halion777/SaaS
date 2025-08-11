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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Link expires in 30 days

    // Save share record to database
    const { data, error } = await supabase
      .from('quote_shares')
      .insert({
        quote_id: quoteId,
        user_id: userId,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        access_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share link:', error);
      return { success: false, error: 'Failed to create share link' };
    }

    // Generate the public URL
    const publicUrl = `${window.location.origin}/quote-share/${shareToken}`;
    
    return { 
      success: true, 
      data: publicUrl,
      shareId: data.id,
      expiresAt: expiresAt.toISOString()
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
      .from('quote_shares')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { success: true, data: null };
      }
      return { success: false, error: 'Failed to get share link info' };
    }

    return { success: true, data };
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
export const deactivateShareLink = async (shareId) => {
  try {
    const { error } = await supabase
      .from('quote_shares')
      .update({ is_active: false })
      .eq('id', shareId);

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
 * @param {string} shareToken - Share token
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuoteByShareToken = async (shareToken) => {
  try {
    // Get share record
    const { data: shareData, error: shareError } = await supabase
      .from('quote_shares')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (shareError || !shareData) {
      return { success: false, error: 'Share link not found or expired' };
    }

    // Check if link has expired
    if (new Date(shareData.expires_at) < new Date()) {
      return { success: false, error: 'Share link has expired' };
    }

    // Update access count
    await supabase
      .from('quote_shares')
      .update({ access_count: shareData.access_count + 1 })
      .eq('id', shareData.id);

    // Get quote data
    const { data: quoteData, error: quoteError } = await supabase
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
          id, name, description, quantity, unit, unit_price, total_price, order_index
        ),
        quote_files(
          id, file_name, file_path, file_size, mime_type, file_category, uploaded_by, created_at
        ),
        quote_financial_configs(
          id, vat_config, advance_config, marketing_banner, payment_terms, discount_config, created_at
        )
      `)
      .eq('id', shareData.quote_id)
      .single();

    if (quoteError) {
      return { success: false, error: 'Quote not found' };
    }

    return { success: true, data: quoteData };
  } catch (error) {
    console.error('Error getting quote by share token:', error);
    return { success: false, error: 'Failed to get quote data' };
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
