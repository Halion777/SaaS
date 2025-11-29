/**
 * useFeatureAccess Hook
 * 
 * React hook for checking feature access in components.
 * Combines subscription-based and profile-based access control.
 * 
 * Usage:
 * const { canAccess, checkModule, isPro, quotas } = useFeatureAccess();
 * 
 * if (canAccess('leadGeneration')) { ... }
 * if (checkModule('leadsManagement')) { ... }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMultiUser } from '../context/MultiUserContext';
import featureAccessService from '../services/featureAccessService';
import {
  FEATURES,
  PLANS,
  QUOTAS,
  MODULE_FEATURE_MAP,
  isActiveSubscription,
  getFeatureAccess,
  isFeatureAvailable,
  hasFullAccess,
  getQuota
} from '../config/subscriptionFeatures';

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const { currentProfile, userProfile, isPremium, subscriptionLimits } = useMultiUser();
  
  const [quotas, setQuotas] = useState({
    quotes: { usage: 0, limit: 15, unlimited: false },
    invoices: { usage: 0, limit: 15, unlimited: false }
  });
  const [loading, setLoading] = useState(true);
  
  // Derived state
  const plan = userProfile?.selected_plan || PLANS.STARTER;
  const subscriptionStatus = userProfile?.subscription_status || 'cancelled';
  const isActive = isActiveSubscription(subscriptionStatus);
  const isPro = plan === PLANS.PRO && isActive;
  const isStarter = plan === PLANS.STARTER;
  const businessSize = userProfile?.business_size;
  
  // Load quotas on mount
  useEffect(() => {
    if (user?.id) {
      loadQuotas();
    }
  }, [user?.id]);
  
  const loadQuotas = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [quotesResult, invoicesResult] = await Promise.all([
        featureAccessService.canCreateQuote(user.id),
        featureAccessService.canCreateInvoice(user.id)
      ]);
      
      setQuotas({
        quotes: quotesResult,
        invoices: invoicesResult
      });
    } catch (error) {
      console.error('Error loading quotas:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  /**
   * Check if a subscription feature is available
   * @param feature - Feature key from FEATURES constant
   * @returns boolean
   */
  const canAccess = useCallback((feature) => {
    if (!isActive) return false;
    return isFeatureAvailable(plan, feature);
  }, [plan, isActive]);
  
  /**
   * Check if a subscription feature has full access
   * @param feature - Feature key from FEATURES constant
   * @returns boolean
   */
  const hasFullFeatureAccess = useCallback((feature) => {
    if (!isActive) return false;
    return hasFullAccess(plan, feature);
  }, [plan, isActive]);
  
  /**
   * Check if user can access a module (combines subscription + profile)
   * @param module - Module key (e.g., 'quotesManagement')
   * @param requiredPermission - 'view_only' or 'full_access'
   * @returns boolean
   */
  const checkModule = useCallback((module, requiredPermission = 'view_only') => {
    // Step 1: Check subscription status
    if (!isActive) return false;
    
    // Step 2: Check if module maps to a subscription feature
    const feature = MODULE_FEATURE_MAP[module];
    if (feature) {
      const featureAccess = getFeatureAccess(plan, feature);
      if (featureAccess === 'none') return false;
    }
    
    // Step 3: Special check for PEPPOL (business users only)
    if (module === 'peppolAccessPoint') {
      const businessSizes = ['small', 'medium', 'large'];
      if (!businessSizes.includes(businessSize)) return false;
    }
    
    // Step 4: Check profile permissions
    if (!currentProfile) return false;
    
    // Admin bypasses permission checks
    if (currentProfile.role === 'admin') return true;
    
    // Check profile permissions
    const permissions = currentProfile.permissions || {};
    const modulePermission = permissions[module];
    
    if (!modulePermission || modulePermission === 'no_access') return false;
    
    // Check if permission level is sufficient
    if (requiredPermission === 'full_access' && modulePermission !== 'full_access') {
      return false;
    }
    
    return true;
  }, [plan, isActive, businessSize, currentProfile]);
  
  /**
   * Check if user can perform an action on a module
   * @param module - Module key
   * @param action - 'view', 'create', 'edit', 'delete'
   * @returns boolean
   */
  const canPerformAction = useCallback((module, action) => {
    const requiredPermission = action === 'view' ? 'view_only' : 'full_access';
    return checkModule(module, requiredPermission);
  }, [checkModule]);
  
  /**
   * Check if upgrade is needed for a feature
   * @param feature - Feature key
   * @returns { needed: boolean, currentPlan: string, requiredPlan: string }
   */
  const needsUpgrade = useCallback((feature) => {
    const currentAccess = getFeatureAccess(plan, feature);
    const proAccess = getFeatureAccess(PLANS.PRO, feature);
    
    return {
      needed: currentAccess === 'none' && proAccess !== 'none',
      currentPlan: plan,
      requiredPlan: PLANS.PRO
    };
  }, [plan]);
  
  /**
   * Get all features that would unlock with upgrade
   */
  const upgradeFeatures = useMemo(() => {
    if (isPro) return [];
    
    return Object.values(FEATURES).filter(feature => {
      const currentAccess = getFeatureAccess(plan, feature);
      const proAccess = getFeatureAccess(PLANS.PRO, feature);
      return currentAccess === 'none' && proAccess !== 'none';
    });
  }, [plan, isPro]);
  
  /**
   * Check if user can create a quote (within quota)
   */
  const canCreateQuote = useCallback(() => {
    if (!checkModule('quoteCreation', 'full_access')) return false;
    if (quotas.quotes.unlimited) return true;
    return quotas.quotes.withinLimit;
  }, [checkModule, quotas.quotes]);
  
  /**
   * Check if user can create an invoice (within quota)
   */
  const canCreateInvoice = useCallback(() => {
    if (!checkModule('clientInvoices', 'full_access')) return false;
    if (quotas.invoices.unlimited) return true;
    return quotas.invoices.withinLimit;
  }, [checkModule, quotas.invoices]);
  
  /**
   * Get remaining quota
   */
  const getRemainingQuota = useCallback((quotaKey) => {
    if (quotaKey === 'quotes') {
      return quotas.quotes.unlimited ? -1 : quotas.quotes.remaining;
    }
    if (quotaKey === 'invoices') {
      return quotas.invoices.unlimited ? -1 : quotas.invoices.remaining;
    }
    return 0;
  }, [quotas]);
  
  return {
    // State
    plan,
    subscriptionStatus,
    isActive,
    isPro,
    isStarter,
    isPremium, // From MultiUserContext (Pro + active)
    businessSize,
    loading,
    quotas,
    subscriptionLimits,
    upgradeFeatures,
    
    // Feature checks
    canAccess,
    hasFullFeatureAccess,
    needsUpgrade,
    
    // Module checks (combined subscription + profile)
    checkModule,
    canPerformAction,
    
    // Quota checks
    canCreateQuote,
    canCreateInvoice,
    getRemainingQuota,
    refreshQuotas: loadQuotas,
    
    // Constants for reference
    FEATURES,
    PLANS
  };
};

export default useFeatureAccess;

