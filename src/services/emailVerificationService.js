import { supabase } from './supabaseClient';

/**
 * Email Verification Service
 * Handles all email verification related operations using OTP via Resend
 */
class EmailVerificationService {
  /**
   * Send OTP verification email to user
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async sendVerificationEmail(email) {
    try {
      const { data, error } = await supabase.functions.invoke('email-verification-otp', {
        body: {
          action: 'generate',
          email: email.toLowerCase().trim()
        }
      });

      if (error) {
        console.error('Error sending verification email:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to send verification email' 
        };
      }

      if (data?.error) {
        // Extract error message - handle both string and object formats
        let errorMessage = data.error;
        if (typeof data.error === 'object' && data.error.message) {
          errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
        
        return {
          success: false,
          error: errorMessage || 'Failed to send verification email'
        };
      }

      return { 
        success: true,
        message: data?.message || 'Verification code sent to your email'
      };
    } catch (error) {
      console.error('Exception sending verification email:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - User's email address
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async verifyOTP(email, otp) {
    try {
      const { data, error } = await supabase.functions.invoke('email-verification-otp', {
        body: {
          action: 'verify',
          email: email.toLowerCase().trim(),
          otp: otp
        }
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to verify code' 
        };
      }

      if (data?.error) {
        return {
          success: false,
          error: data.error
        };
      }

      return { 
        success: true,
        message: data?.message || 'Email verified successfully'
      };
    } catch (error) {
      console.error('Exception verifying OTP:', error);
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
   * Only updates if user exists in public.users - does NOT create user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>}
   */
  async updateVerificationStatus(userId) {
    try {
      // First check if user exists in public.users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking user existence:', checkError);
        return { success: false };
      }

      // Only update if user exists - don't create new user
      if (!existingUser) {
        console.log('User does not exist in public.users yet - skipping verification update. User will be created during registration.');
        return { success: true }; // Return success since email is verified in auth.users
      }

      // Update verification status for existing user
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

