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
    quotesPerMonth: -1, // -1 = unlimited (quotes are unlimited)
    invoicesPerMonth: -1, // -1 = unlimited (simple invoices are unlimited)
    peppolInvoicesPerMonth: 50, // Up to 50 Peppol e-invoices per month (sent + received)
    maxClients: 30, // Up to 30 active clients
    maxProfiles: 1, // 1 user
    maxStorage: '10GB'
  },
  pro: {
    quotesPerMonth: -1, // -1 = unlimited
    invoicesPerMonth: -1, // -1 = unlimited
    peppolInvoicesPerMonth: -1, // -1 = unlimited (normal usage)
    maxClients: -1, // -1 = unlimited
    maxProfiles: 10, // Multi-user access
    maxStorage: '100GB'
  }
};

// ============================================
// FEATURE ACCESS BY PLAN
// ============================================

export const PLAN_FEATURES = {
  // Starter Plan Features
  starter: {
    // Core Features
    [FEATURES.QUOTES]: 'full',           // Unlimited quotes
    [FEATURES.INVOICES]: 'full',         // Unlimited simple invoices
    [FEATURES.CLIENTS]: 'limited',       // Up to 30 active clients
    [FEATURES.TEMPLATES]: 'full',         // Premium quote template
    [FEATURES.PEPPOL]: 'limited',        // Up to 50 Peppol invoices/month (sent + received)
    
    // Advanced Features
    [FEATURES.LEAD_GENERATION]: 'limited', // Qualified lead suggestions (BETA)
    [FEATURES.AUTOMATIC_REMINDERS]: 'none', // Not available
    [FEATURES.MULTI_USER]: 'none',        // 1 user only
    [FEATURES.ADVANCED_ANALYTICS]: 'limited', // Basic statistics only
    [FEATURES.AI_FEATURES]: 'full',       // AI-powered smart quotes, automatic suggestions
    [FEATURES.SIGNATURE_PREDICTIONS]: 'none',
    [FEATURES.PRICE_OPTIMIZATION]: 'none',
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
    [FEATURES.INVOICES]: 'full',         // Unlimited simple invoices
    [FEATURES.CLIENTS]: 'full',          // Unlimited clients
    [FEATURES.TEMPLATES]: 'full',        // Customisable library, templates adapted to each job type
    [FEATURES.PEPPOL]: 'full',           // Unlimited Peppol e-invoices (normal usage)
    
    // Advanced Features - Full
    [FEATURES.LEAD_GENERATION]: 'full',   // Integrated prospecting/leads, client requests
    [FEATURES.AUTOMATIC_REMINDERS]: 'full', // Automatic reminders for unsigned quotes and unpaid invoices
    [FEATURES.MULTI_USER]: 'full',       // Multi-user access (owner, admin, site manager, etc.)
    [FEATURES.ADVANCED_ANALYTICS]: 'full', // Detailed statistics: revenue, signed quotes, conversion rates, expenses, etc.
    [FEATURES.AI_FEATURES]: 'full',       // All AI features
    [FEATURES.SIGNATURE_PREDICTIONS]: 'full',
    [FEATURES.PRICE_OPTIMIZATION]: 'full',
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
    starterLimit: 'Unlimited',
    proLimit: 'Unlimited'
  },
  [FEATURES.INVOICES]: {
    icon: 'Receipt',
    starterLimit: 'Unlimited (simple invoices)',
    proLimit: 'Unlimited'
  },
  [FEATURES.CLIENTS]: {
    icon: 'Users',
    starterLimit: 'Up to 30 active clients',
    proLimit: 'Unlimited'
  },
  [FEATURES.TEMPLATES]: {
    icon: 'Layout',
    starterLimit: 'Premium template',
    proLimit: 'Customisable library, templates per job type'
  },
  [FEATURES.LEAD_GENERATION]: {
    icon: 'Target',
    starterLimit: 'Qualified lead suggestions (BETA)',
    proLimit: 'Full lead generation (integrated prospecting)'
  },
  [FEATURES.AUTOMATIC_REMINDERS]: {
    icon: 'Bell',
    starterLimit: 'Not available',
    proLimit: 'Automatic reminders for quotes & invoices'
  },
  [FEATURES.MULTI_USER]: {
    icon: 'UserPlus',
    starterLimit: '1 user',
    proLimit: 'Multi-user access (owner, admin, site manager, etc.)'
  },
  [FEATURES.ADVANCED_ANALYTICS]: {
    icon: 'BarChart2',
    starterLimit: 'Basic statistics',
    proLimit: 'Detailed statistics & reporting'
  },
  [FEATURES.AI_FEATURES]: {
    icon: 'Cpu',
    starterLimit: 'AI-powered smart quotes & suggestions',
    proLimit: 'Complete AI features'
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
  [FEATURES.PEPPOL]: {
    icon: 'FileCheck',
    starterLimit: 'Up to 50/month (sent + received)',
    proLimit: 'Unlimited (normal usage)'
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

