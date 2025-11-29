/**
 * Subscription Features Configuration
 * 
 * This file defines all subscription-based feature access.
 * Edit this file to update feature access for different subscription plans.
 * 
 * Access Levels:
 * - 'full': Full access to feature
 * - 'limited': Limited access (with quotas/restrictions)
 * - 'none': No access to feature
 * 
 * Plan Types: 'starter', 'pro'
 * Subscription Status: 'trial', 'active', 'past_due', 'cancelled'
 */

// ============================================
// PLAN DEFINITIONS
// ============================================

export const PLANS = {
  STARTER: 'starter',
  PRO: 'pro'
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled'
};

// ============================================
// FEATURE KEYS (for easy reference)
// ============================================

export const FEATURES = {
  // Core Features
  QUOTES: 'quotes',
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  TEMPLATES: 'templates',
  
  // Advanced Features
  LEAD_GENERATION: 'leadGeneration',
  AUTOMATIC_REMINDERS: 'automaticReminders',
  MULTI_USER: 'multiUser',
  ADVANCED_ANALYTICS: 'advancedAnalytics',
  AI_FEATURES: 'aiFeatures',
  SIGNATURE_PREDICTIONS: 'signaturePredictions',
  PRICE_OPTIMIZATION: 'priceOptimization',
  PEPPOL: 'peppol',
  CREDIT_INSURANCE: 'creditInsurance',
  RECOVERY: 'recovery',
  
  // Support
  EMAIL_SUPPORT: 'emailSupport',
  PRIORITY_SUPPORT: 'prioritySupport'
};

// ============================================
// QUOTA LIMITS
// ============================================

export const QUOTAS = {
  starter: {
    quotesPerMonth: 15,
    invoicesPerMonth: 15,
    maxProfiles: 1,
    maxStorage: '10GB'
  },
  pro: {
    quotesPerMonth: -1, // -1 = unlimited
    invoicesPerMonth: -1,
    maxProfiles: 10,
    maxStorage: '100GB'
  }
};

// ============================================
// FEATURE ACCESS BY PLAN
// ============================================

export const PLAN_FEATURES = {
  // Starter Plan Features
  starter: {
    // Core Features - Limited
    [FEATURES.QUOTES]: 'limited',        // 15/month
    [FEATURES.INVOICES]: 'limited',      // 15/month
    [FEATURES.CLIENTS]: 'full',
    [FEATURES.TEMPLATES]: 'full',
    
    // Advanced Features - None
    [FEATURES.LEAD_GENERATION]: 'none',
    [FEATURES.AUTOMATIC_REMINDERS]: 'none',
    [FEATURES.MULTI_USER]: 'none',
    [FEATURES.ADVANCED_ANALYTICS]: 'none',
    [FEATURES.AI_FEATURES]: 'limited',
    [FEATURES.SIGNATURE_PREDICTIONS]: 'none',
    [FEATURES.PRICE_OPTIMIZATION]: 'none',
    [FEATURES.PEPPOL]: 'full',           // Available for business users
    [FEATURES.CREDIT_INSURANCE]: 'full',
    [FEATURES.RECOVERY]: 'full',
    
    // Support
    [FEATURES.EMAIL_SUPPORT]: 'full',
    [FEATURES.PRIORITY_SUPPORT]: 'none'
  },
  
  // Pro Plan Features
  pro: {
    // Core Features - Full
    [FEATURES.QUOTES]: 'full',           // Unlimited
    [FEATURES.INVOICES]: 'full',         // Unlimited
    [FEATURES.CLIENTS]: 'full',
    [FEATURES.TEMPLATES]: 'full',
    
    // Advanced Features - Full
    [FEATURES.LEAD_GENERATION]: 'full',
    [FEATURES.AUTOMATIC_REMINDERS]: 'full',
    [FEATURES.MULTI_USER]: 'full',
    [FEATURES.ADVANCED_ANALYTICS]: 'full',
    [FEATURES.AI_FEATURES]: 'full',
    [FEATURES.SIGNATURE_PREDICTIONS]: 'full',
    [FEATURES.PRICE_OPTIMIZATION]: 'full',
    [FEATURES.PEPPOL]: 'full',
    [FEATURES.CREDIT_INSURANCE]: 'full',
    [FEATURES.RECOVERY]: 'full',
    
    // Support
    [FEATURES.EMAIL_SUPPORT]: 'full',
    [FEATURES.PRIORITY_SUPPORT]: 'full'
  }
};

// ============================================
// MODULE TO FEATURE MAPPING
// Module permissions from profile system map to subscription features
// ============================================

export const MODULE_FEATURE_MAP = {
  dashboard: null,                        // Always accessible
  analytics: FEATURES.ADVANCED_ANALYTICS,
  peppolAccessPoint: FEATURES.PEPPOL,
  leadsManagement: FEATURES.LEAD_GENERATION,
  quoteCreation: FEATURES.QUOTES,
  quotesManagement: FEATURES.QUOTES,
  quotesFollowUp: FEATURES.AUTOMATIC_REMINDERS,
  invoicesFollowUp: FEATURES.AUTOMATIC_REMINDERS,
  clientInvoices: FEATURES.INVOICES,
  supplierInvoices: FEATURES.INVOICES,
  clientManagement: FEATURES.CLIENTS,
  creditInsurance: FEATURES.CREDIT_INSURANCE,
  recovery: FEATURES.RECOVERY
};

// ============================================
// FEATURE DISPLAY INFO (for UI)
// ============================================

export const FEATURE_INFO = {
  [FEATURES.QUOTES]: {
    icon: 'FileText',
    starterLimit: '15/month',
    proLimit: 'Unlimited'
  },
  [FEATURES.INVOICES]: {
    icon: 'Receipt',
    starterLimit: '15/month',
    proLimit: 'Unlimited'
  },
  [FEATURES.CLIENTS]: {
    icon: 'Users',
    starterLimit: 'Unlimited',
    proLimit: 'Unlimited'
  },
  [FEATURES.TEMPLATES]: {
    icon: 'Layout',
    starterLimit: 'Basic',
    proLimit: 'Premium'
  },
  [FEATURES.LEAD_GENERATION]: {
    icon: 'Target',
    starterLimit: 'Not available',
    proLimit: 'Full access'
  },
  [FEATURES.AUTOMATIC_REMINDERS]: {
    icon: 'Bell',
    starterLimit: 'Not available',
    proLimit: 'Full access'
  },
  [FEATURES.MULTI_USER]: {
    icon: 'UserPlus',
    starterLimit: '1 profile',
    proLimit: 'Up to 10'
  },
  [FEATURES.ADVANCED_ANALYTICS]: {
    icon: 'BarChart2',
    starterLimit: 'Basic',
    proLimit: 'Advanced'
  },
  [FEATURES.AI_FEATURES]: {
    icon: 'Cpu',
    starterLimit: 'Limited',
    proLimit: 'Complete'
  },
  [FEATURES.SIGNATURE_PREDICTIONS]: {
    icon: 'PenTool',
    starterLimit: 'Not available',
    proLimit: 'Full access'
  },
  [FEATURES.PRICE_OPTIMIZATION]: {
    icon: 'TrendingUp',
    starterLimit: 'Not available',
    proLimit: 'Full access'
  },
  [FEATURES.EMAIL_SUPPORT]: {
    icon: 'Mail',
    starterLimit: 'Available',
    proLimit: 'Available'
  },
  [FEATURES.PRIORITY_SUPPORT]: {
    icon: 'Headphones',
    starterLimit: 'Not available',
    proLimit: 'Available'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a subscription status is considered active
 */
export const isActiveSubscription = (status) => {
  return [
    SUBSCRIPTION_STATUS.TRIAL,
    SUBSCRIPTION_STATUS.TRIALING,
    SUBSCRIPTION_STATUS.ACTIVE
  ].includes(status);
};

/**
 * Get feature access level for a plan
 */
export const getFeatureAccess = (plan, feature) => {
  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  return planFeatures[feature] || 'none';
};

/**
 * Check if feature is available for plan (any access level except 'none')
 */
export const isFeatureAvailable = (plan, feature) => {
  return getFeatureAccess(plan, feature) !== 'none';
};

/**
 * Check if feature has full access for plan
 */
export const hasFullAccess = (plan, feature) => {
  return getFeatureAccess(plan, feature) === 'full';
};

/**
 * Get quota for plan
 */
export const getQuota = (plan, quotaKey) => {
  const planQuotas = QUOTAS[plan] || QUOTAS.starter;
  return planQuotas[quotaKey];
};

/**
 * Check if quota is unlimited
 */
export const isUnlimited = (plan, quotaKey) => {
  return getQuota(plan, quotaKey) === -1;
};

/**
 * Get all available features for a plan
 */
export const getAvailableFeatures = (plan) => {
  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  return Object.entries(planFeatures)
    .filter(([_, access]) => access !== 'none')
    .map(([feature]) => feature);
};

/**
 * Get unavailable features for a plan
 */
export const getUnavailableFeatures = (plan) => {
  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  return Object.entries(planFeatures)
    .filter(([_, access]) => access === 'none')
    .map(([feature]) => feature);
};

export default {
  PLANS,
  SUBSCRIPTION_STATUS,
  FEATURES,
  QUOTAS,
  PLAN_FEATURES,
  MODULE_FEATURE_MAP,
  FEATURE_INFO,
  isActiveSubscription,
  getFeatureAccess,
  isFeatureAvailable,
  hasFullAccess,
  getQuota,
  isUnlimited,
  getAvailableFeatures,
  getUnavailableFeatures
};

