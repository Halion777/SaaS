import { supabase } from './supabaseClient';
import { SUPPORT_EMAIL, SUPER_ADMIN_EMAIL } from '../config/appConfig';

/**
 * Admin User Service
 * Handles admin operations for user management
 */
class AdminUserService {
  /**
   * Create a new user with lifetime access
   * Uses edge function for secure user creation
   */
  async createUserWithLifetimeAccess(userData) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone || null,
          company_name: userData.company_name || null,
          has_lifetime_access: userData.has_lifetime_access !== false // Default to true
        }
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating user:', error);
      return { data: null, error };
    }
  }

  /**
   * Grant lifetime access to a user by email
   */
  async grantLifetimeAccessByEmail(email) {
    try {
      // Find user by email
      const { data: userData, error: findError } = await supabase
        .from('users')
        .select('id, email, has_lifetime_access')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (findError || !userData) {
        return { error: new Error('User not found with this email address') };
      }

      if (userData.has_lifetime_access) {
        return { error: new Error('User already has lifetime access') };
      }

      // Update user to grant lifetime access
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          has_lifetime_access: true,
          selected_plan: 'pro', // Upgrade to pro plan
          subscription_status: 'active'
        })
        .eq('id', userData.id);

      if (updateError) {
        throw updateError;
      }

      return { data: { success: true, userId: userData.id }, error: null };
    } catch (error) {
      console.error('Error granting lifetime access:', error);
      return { data: null, error };
    }
  }

  /**
   * Revoke lifetime access from a user by email
   */
  async revokeLifetimeAccessByEmail(email) {
    try {
      // Find user by email
      const { data: userData, error: findError } = await supabase
        .from('users')
        .select('id, email, has_lifetime_access, role')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (findError || !userData) {
        return { error: new Error('User not found with this email address') };
      }

      // Prevent revoking from superadmin or special emails
      const emailLower = userData.email.toLowerCase().trim();
      if (userData.role === 'superadmin' || 
          emailLower === SUPER_ADMIN_EMAIL.toLowerCase() ||
          emailLower === SUPPORT_EMAIL.toLowerCase()) {
        return { error: new Error('Cannot revoke lifetime access from superadmin or special accounts') };
      }

      if (!userData.has_lifetime_access) {
        return { error: new Error('User does not have lifetime access') };
      }

      // Update user to revoke lifetime access
      // Reset to starter plan and inactive status
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          has_lifetime_access: false,
          selected_plan: 'starter',
          subscription_status: 'inactive'
        })
        .eq('id', userData.id);

      if (updateError) {
        throw updateError;
      }

      return { data: { success: true, userId: userData.id }, error: null };
    } catch (error) {
      console.error('Error revoking lifetime access:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has lifetime access
   */
  async checkLifetimeAccess(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('has_lifetime_access, email')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error };
      }

      // Special case: Super admin email - always has lifetime access and superadmin role
      const emailLower = data.email.toLowerCase().trim();
      if (emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) {
        // Ensure superadmin has lifetime access and superadmin role
        await supabase
          .from('users')
          .update({ 
            has_lifetime_access: true,
            role: 'superadmin'
          })
          .eq('id', userId);
        return { data: { has_lifetime_access: true }, error: null };
      }
      
      // Special case: Support email - always has lifetime access
      if (emailLower === SUPPORT_EMAIL.toLowerCase() && !data.has_lifetime_access) {
        // Grant lifetime access
        await supabase
          .from('users')
          .update({ has_lifetime_access: true })
          .eq('id', userId);
        return { data: { has_lifetime_access: true }, error: null };
      }
      
      // Super admin role always has lifetime access
      const { data: userRoleData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (userRoleData?.role === 'superadmin' && !data.has_lifetime_access) {
        // Grant lifetime access to superadmin
        await supabase
          .from('users')
          .update({ has_lifetime_access: true })
          .eq('id', userId);
        return { data: { has_lifetime_access: true }, error: null };
      }

      return { data: { has_lifetime_access: data.has_lifetime_access === true }, error: null };
    } catch (error) {
      console.error('Error checking lifetime access:', error);
      return { data: null, error };
    }
  }
}

export default new AdminUserService();

