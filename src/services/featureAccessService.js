/**
 * Feature Access Service
 * 
 * This service provides unified access control combining:
 * 1. Subscription-based feature access (what plan allows)
 * 2. Profile-based permission access (what profile role allows)
 * 
 * Use this service to check if a user can access any feature in the app.
 */

import { supabase } from './supabaseClient';
import {
  PLANS,
  FEATURES,
  QUOTAS,
  MODULE_FEATURE_MAP,
  isActiveSubscription,
  getFeatureAccess,
  isFeatureAvailable,
  hasFullAccess,
  getQuota,
  isUnlimited,
  getAvailableFeatures,
  getUnavailableFeatures
} from '../config/subscriptionFeatures';

class FeatureAccessService {
  
  // ============================================
  // USER DATA FETCHING
  // ============================================
  
  /**
   * Get user subscription data
   */
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('selected_plan, subscription_status, business_size, role, has_lifetime_access')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return { selected_plan: 'starter', subscription_status: 'cancelled', business_size: null, role: 'admin', has_lifetime_access: false };
    }
  }
  
  /**
   * Get current active profile for user
   */
  async getCurrentProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }
  
  // ============================================
  // SUBSCRIPTION CHECKS
  // ============================================
  
  /**
   * Check if user has active subscription
   * Super admin and users with lifetime access always have active subscription
   */
  async hasActiveSubscription(userId) {
    const subscription = await this.getUserSubscription(userId);
    // Super admin and lifetime access users always have active subscription
    if (subscription.role === 'superadmin' || subscription.has_lifetime_access === true) {
      return true;
    }
    return isActiveSubscription(subscription.subscription_status);
  }
  
  /**
   * Get user's current plan
   */
  async getUserPlan(userId) {
    const subscription = await this.getUserSubscription(userId);
    return subscription.selected_plan || PLANS.STARTER;
  }
  
  /**
   * Check if user is on Pro plan with active subscription
   */
  async isPro(userId) {
    const subscription = await this.getUserSubscription(userId);
    return subscription.selected_plan === PLANS.PRO && 
           isActiveSubscription(subscription.subscription_status);
  }
  
  /**
   * Check if user is on Starter plan
   */
  async isStarter(userId) {
    const plan = await this.getUserPlan(userId);
    return plan === PLANS.STARTER;
  }
  
  // ============================================
  // FEATURE ACCESS CHECKS
  // ============================================
  
  /**
   * Check if user can access a feature based on subscription
   * Returns: { allowed: boolean, accessLevel: string, reason?: string }
   * Super admin and users with lifetime access always have full access
   */
  async checkFeatureAccess(userId, feature) {
    const subscription = await this.getUserSubscription(userId);
    const { selected_plan, subscription_status, role, has_lifetime_access } = subscription;
    
    // Super admin and lifetime access users always have full access
    if (role === 'superadmin' || has_lifetime_access === true) {
      return {
        allowed: true,
        accessLevel: 'full',
        plan: 'pro',
        reason: null
      };
    }
    
    // Check if subscription is active
    if (!isActiveSubscription(subscription_status)) {
      return {
        allowed: false,
        accessLevel: 'none',
        reason: 'subscription_inactive'
      };
    }
    
    // Get feature access level for plan
    const accessLevel = getFeatureAccess(selected_plan, feature);
    
    return {
      allowed: accessLevel !== 'none',
      accessLevel,
      plan: selected_plan,
      reason: accessLevel === 'none' ? 'feature_not_in_plan' : null
    };
  }
  
  /**
   * Check if feature is available (any access level)
   */
  async canAccessFeature(userId, feature) {
    const result = await this.checkFeatureAccess(userId, feature);
    return result.allowed;
  }
  
  /**
   * Check if feature has full access
   */
  async hasFullFeatureAccess(userId, feature) {
    const result = await this.checkFeatureAccess(userId, feature);
    return result.accessLevel === 'full';
  }
  
  // ============================================
  // MODULE ACCESS (Combined Check)
  // ============================================
  
  /**
   * Check if user can access a module (combines subscription + profile permissions)
   * This is the main method to use for access control
   * 
   * @param userId - User ID
   * @param module - Module key (e.g., 'quotesManagement', 'leadsManagement')
   * @param requiredPermission - Required permission level ('view_only' or 'full_access')
   * @returns { allowed: boolean, reason?: string, upgradeRequired?: boolean }
   */
  async canAccessModule(userId, module, requiredPermission = 'view_only') {
    try {
      // Step 1: Check subscription status
      const subscription = await this.getUserSubscription(userId);
      
      // Super admin and lifetime access users always have access
      if (subscription.role === 'superadmin' || subscription.has_lifetime_access === true) {
        // Still need to check profile permissions for non-superadmin users
        if (subscription.role === 'superadmin') {
          return { allowed: true };
        }
        // For lifetime access users, continue to profile permission check below
      } else if (!isActiveSubscription(subscription.subscription_status)) {
        return {
          allowed: false,
          reason: 'subscription_inactive',
          upgradeRequired: true
        };
      }
      
      // Step 2: Check if module maps to a subscription feature
      const feature = MODULE_FEATURE_MAP[module];
      if (feature) {
        const featureAccess = getFeatureAccess(subscription.selected_plan, feature);
        if (featureAccess === 'none') {
          return {
            allowed: false,
            reason: 'feature_not_in_plan',
            upgradeRequired: true,
            requiredPlan: PLANS.PRO
          };
        }
      }
      
      // Step 3: Special check for PEPPOL (business users only)
      if (module === 'peppolAccessPoint') {
        const businessSizes = ['small', 'medium', 'large'];
        if (!businessSizes.includes(subscription.business_size)) {
          return {
            allowed: false,
            reason: 'business_users_only',
            upgradeRequired: false
          };
        }
      }
      
      // Step 4: Check profile permissions
      const profile = await this.getCurrentProfile(userId);
      if (!profile) {
        return {
          allowed: false,
          reason: 'no_active_profile',
          upgradeRequired: false
        };
      }
      
      // Admin bypasses permission checks
      if (profile.role === 'admin') {
        return { allowed: true };
      }
      
      // Check profile permissions
      const permissions = profile.permissions || {};
      const modulePermission = permissions[module];
      
      if (!modulePermission || modulePermission === 'no_access') {
        return {
          allowed: false,
          reason: 'profile_no_access',
          upgradeRequired: false
        };
      }
      
      // Check if permission level is sufficient
      if (requiredPermission === 'full_access' && modulePermission !== 'full_access') {
        return {
          allowed: false,
          reason: 'insufficient_permission',
          upgradeRequired: false
        };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking module access:', error);
      return {
        allowed: false,
        reason: 'error',
        upgradeRequired: false
      };
    }
  }
  
  // ============================================
  // QUOTA CHECKS
  // ============================================
  
  /**
   * Get quota limit for user's plan
   */
  async getQuotaLimit(userId, quotaKey) {
    const plan = await this.getUserPlan(userId);
    return getQuota(plan, quotaKey);
  }
  
  /**
   * Check if quota is unlimited for user
   */
  async isQuotaUnlimited(userId, quotaKey) {
    const plan = await this.getUserPlan(userId);
    return isUnlimited(plan, quotaKey);
  }
  
  /**
   * Check if user is within quota
   * Super admin and users with lifetime access have unlimited quotas
   */
  async checkQuota(userId, quotaKey, currentUsage) {
    const subscription = await this.getUserSubscription(userId);
    
    // Super admin and lifetime access users have unlimited quotas
    if (subscription.role === 'superadmin' || subscription.has_lifetime_access === true) {
      return { withinLimit: true, limit: -1, usage: currentUsage, unlimited: true };
    }
    
    const limit = await this.getQuotaLimit(userId, quotaKey);
    
    // -1 means unlimited
    if (limit === -1) {
      return { withinLimit: true, limit: -1, usage: currentUsage, unlimited: true };
    }
    
    return {
      withinLimit: currentUsage < limit,
      limit,
      usage: currentUsage,
      remaining: Math.max(0, limit - currentUsage),
      unlimited: false
    };
  }
  
  /**
   * Get monthly quotes usage (example quota check)
   */
  async getMonthlyQuotesUsage(userId) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting quotes usage:', error);
      return 0;
    }
  }
  
  /**
   * Get monthly invoices usage
   */
  async getMonthlyInvoicesUsage(userId) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting invoices usage:', error);
      return 0;
    }
  }
  
  /**
   * Check if user can create more quotes this month
   */
  async canCreateQuote(userId) {
    const usage = await this.getMonthlyQuotesUsage(userId);
    return this.checkQuota(userId, 'quotesPerMonth', usage);
  }
  
  /**
   * Check if user can create more invoices this month
   */
  async canCreateInvoice(userId) {
    const usage = await this.getMonthlyInvoicesUsage(userId);
    return this.checkQuota(userId, 'invoicesPerMonth', usage);
  }
  
  /**
   * Get active clients count for user (total)
   */
  async getActiveClientsCount(userId) {
    try {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting active clients count:', error);
      return 0;
    }
  }

  /**
   * Get monthly clients added count (clients created this month)
   */
  async getMonthlyClientsUsage(userId) {
    try {
      // Get billing cycle start date (subscription-based or calendar month)
      const billingCycleStart = await this.getBillingCycleStart(userId);
      
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', billingCycleStart.toISOString());
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting monthly clients usage:', error);
      return 0;
    }
  }
  
  /**
   * Check if user can create more clients (monthly limit)
   */
  async canCreateClient(userId) {
    const monthlyUsage = await this.getMonthlyClientsUsage(userId);
    return this.checkQuota(userId, 'clientsPerMonth', monthlyUsage);
  }
  
  /**
   * Get billing cycle start date for a user based on their subscription
   * Returns the start of the current billing period, or calendar month start if no subscription
   */
  async getBillingCycleStart(userId) {
    try {
      // Get user's subscription to find billing cycle start
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('current_period_start, current_period_end, interval')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (subError || !subscription || !subscription.current_period_start) {
        // No active subscription found, fallback to calendar month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
      }
      
      // Use subscription's current_period_start as billing cycle start
      const periodStart = new Date(subscription.current_period_start);
      periodStart.setHours(0, 0, 0, 0);
      
      // If current_period_start is in the future (shouldn't happen), use today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (periodStart > today) {
        return today;
      }
      
      return periodStart;
    } catch (error) {
      console.error('Error getting billing cycle start:', error);
      // Fallback to calendar month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return startOfMonth;
    }
  }

  /**
   * Get monthly Peppol invoices usage (sent + received)
   * Uses subscription billing cycle if available, otherwise uses calendar month
   */
  async getMonthlyPeppolInvoicesUsage(userId) {
    try {
      // Get billing cycle start date (subscription-based or calendar month)
      const billingCycleStart = await this.getBillingCycleStart(userId);
      
      // Count Peppol invoices sent (from invoices table)
      // Use peppol_sent_at if available for accurate monthly count
      const { count: sentCount, error: sentError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('peppol_enabled', true)
        .not('peppol_sent_at', 'is', null)
        .gte('peppol_sent_at', billingCycleStart.toISOString());
      
      if (sentError) throw sentError;
      
      // Count Peppol invoices received (from expense_invoices table)
      // Use peppol_received_at for accurate monthly count
      // Note: peppol_received_at is timestamp without timezone, but Supabase handles ISO format correctly
      const { count: receivedCount, error: receivedError } = await supabase
        .from('expense_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('peppol_enabled', true)
        .eq('source', 'peppol')
        .not('peppol_received_at', 'is', null)
        .gte('peppol_received_at', billingCycleStart.toISOString());
      
      if (receivedError) throw receivedError;
      
      return (sentCount || 0) + (receivedCount || 0);
    } catch (error) {
      console.error('Error getting Peppol invoices usage:', error);
      return 0;
    }
  }
  
  /**
   * Check if user can send/receive more Peppol invoices this month
   */
  async canSendPeppolInvoice(userId) {
    const usage = await this.getMonthlyPeppolInvoicesUsage(userId);
    return this.checkQuota(userId, 'peppolInvoicesPerMonth', usage);
  }
  
  // ============================================
  // PROFILE LIMIT CHECKS
  // ============================================
  
  /**
   * Get max profiles for user's plan
   */
  async getMaxProfiles(userId) {
    return this.getQuotaLimit(userId, 'maxProfiles');
  }
  
  /**
   * Check if user can create more profiles
   */
  async canCreateProfile(userId) {
    try {
      const maxProfiles = await this.getMaxProfiles(userId);
      
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const currentCount = count || 0;
      return {
        canCreate: currentCount < maxProfiles,
        current: currentCount,
        max: maxProfiles,
        remaining: Math.max(0, maxProfiles - currentCount)
      };
    } catch (error) {
      console.error('Error checking profile limit:', error);
      return { canCreate: false, current: 0, max: 1, remaining: 0 };
    }
  }
  
  // ============================================
  // FEATURE LISTS
  // ============================================
  
  /**
   * Get all features available for user's plan
   */
  async getAvailableFeatures(userId) {
    const plan = await this.getUserPlan(userId);
    return getAvailableFeatures(plan);
  }
  
  /**
   * Get all features NOT available for user's plan
   */
  async getUnavailableFeatures(userId) {
    const plan = await this.getUserPlan(userId);
    return getUnavailableFeatures(plan);
  }
  
  /**
   * Get features that would be unlocked by upgrading
   */
  async getUpgradeFeatures(userId) {
    const currentPlan = await this.getUserPlan(userId);
    if (currentPlan === PLANS.PRO) {
      return []; // Already on highest plan
    }
    
    const currentFeatures = getAvailableFeatures(currentPlan);
    const proFeatures = getAvailableFeatures(PLANS.PRO);
    
    return proFeatures.filter(f => !currentFeatures.includes(f));
  }
  
  // ============================================
  // QUICK ACCESS METHODS
  // ============================================
  
  /**
   * Quick check methods for common features
   */
  async canAccessLeads(userId) {
    return this.canAccessFeature(userId, FEATURES.LEAD_GENERATION);
  }
  
  async canAccessReminders(userId) {
    return this.canAccessFeature(userId, FEATURES.AUTOMATIC_REMINDERS);
  }
  
  async canAccessMultiUser(userId) {
    return this.canAccessFeature(userId, FEATURES.MULTI_USER);
  }
  
  async canAccessAdvancedAnalytics(userId) {
    return this.canAccessFeature(userId, FEATURES.ADVANCED_ANALYTICS);
  }
  
  async canAccessAI(userId) {
    return this.canAccessFeature(userId, FEATURES.AI_FEATURES);
  }
  
  async canAccessSignaturePredictions(userId) {
    return this.canAccessFeature(userId, FEATURES.SIGNATURE_PREDICTIONS);
  }
  
  async canAccessPriceOptimization(userId) {
    return this.canAccessFeature(userId, FEATURES.PRICE_OPTIMIZATION);
  }
  
  async canAccessPrioritySupport(userId) {
    return this.canAccessFeature(userId, FEATURES.PRIORITY_SUPPORT);
  }
}

// Export singleton instance
const featureAccessService = new FeatureAccessService();
export default featureAccessService;

// Export class for testing
export { FeatureAccessService };

