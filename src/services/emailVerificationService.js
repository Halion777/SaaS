import { supabase } from './supabaseClient';

/**
 * Email Verification Service
 * Handles all email verification related operations
 */
class EmailVerificationService {
  /**
   * Send verification email to user
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendVerificationEmail(email) {
    try {
      // Supabase automatically sends verification email on signup
      // This method triggers a re-send
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Error sending verification email:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to send verification email' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception sending verification email:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Check if user's email is verified from auth.users
   * @returns {Promise<{verified: boolean, user?: object, confirmedAt?: string}>}
   */
  async checkEmailVerification() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { verified: false };
      }

      // Check if email_confirmed_at exists in auth.users
      const verified = !!user.email_confirmed_at;

      return { 
        verified, 
        user,
        confirmedAt: user.email_confirmed_at 
      };
    } catch (error) {
      console.error('Error checking email verification:', error);
      return { verified: false };
    }
  }

  /**
   * Get email verification status for current user
   * @param {string} userId - User ID
   * @returns {Promise<{verified: boolean, verifiedAt?: string}>}
   */
  async getVerificationStatus(userId) {
    try {
      // Check in public.users table
      const { data, error } = await supabase
        .from('users')
        .select('email_verified, email_verified_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback to auth.users check
        return await this.checkEmailVerification();
      }

      return {
        verified: data.email_verified || false,
        verifiedAt: data.email_verified_at
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { verified: false };
    }
  }

  /**
   * Update email verification status in public.users
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>}
   */
  async updateVerificationStatus(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating verification status:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating verification status:', error);
      return { success: false };
    }
  }
}

export default new EmailVerificationService();

