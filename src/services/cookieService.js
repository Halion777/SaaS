/**
 * Cookie Service - Manages cookie consent and preferences
 * Complies with EU GDPR requirements
 */

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

/**
 * Cookie categories
 */
export const COOKIE_CATEGORIES = {
  ESSENTIAL: 'essential',
  FUNCTIONAL: 'functional',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing'
};

/**
 * Get cookie consent status
 * @returns {Object|null} Consent object or null if not set
 */
export const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

/**
 * Check if user has given consent
 * @returns {boolean} True if consent has been given
 */
export const hasCookieConsent = () => {
  const consent = getCookieConsent();
  return consent !== null && consent.timestamp !== undefined;
};

/**
 * Get cookie preferences
 * @returns {Object} Cookie preferences object
 */
export const getCookiePreferences = () => {
  try {
    const preferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (preferences) {
      return JSON.parse(preferences);
    }
    
    // Default preferences (only essential cookies enabled)
    return {
      [COOKIE_CATEGORIES.ESSENTIAL]: true, // Always true, cannot be disabled
      [COOKIE_CATEGORIES.FUNCTIONAL]: false,
      [COOKIE_CATEGORIES.ANALYTICS]: false,
      [COOKIE_CATEGORIES.MARKETING]: false
    };
  } catch (error) {
    console.error('Error reading cookie preferences:', error);
    return {
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
      [COOKIE_CATEGORIES.FUNCTIONAL]: false,
      [COOKIE_CATEGORIES.ANALYTICS]: false,
      [COOKIE_CATEGORIES.MARKETING]: false
    };
  }
};

/**
 * Save cookie consent
 * @param {Object} preferences - Cookie preferences object
 * @param {string} action - Action taken: 'accept_all', 'reject_all', 'custom'
 */
export const saveCookieConsent = (preferences, action = 'custom') => {
  try {
    const consentData = {
      timestamp: new Date().toISOString(),
      action: action,
      preferences: preferences
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    
    // Trigger custom event for other parts of the app to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: { preferences, action }
    }));
    
    return true;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    return false;
  }
};

/**
 * Accept all cookies
 */
export const acceptAllCookies = () => {
  const preferences = {
    [COOKIE_CATEGORIES.ESSENTIAL]: true,
    [COOKIE_CATEGORIES.FUNCTIONAL]: true,
    [COOKIE_CATEGORIES.ANALYTICS]: true,
    [COOKIE_CATEGORIES.MARKETING]: true
  };
  
  return saveCookieConsent(preferences, 'accept_all');
};

/**
 * Reject all non-essential cookies
 */
export const rejectAllCookies = () => {
  const preferences = {
    [COOKIE_CATEGORIES.ESSENTIAL]: true, // Always true
    [COOKIE_CATEGORIES.FUNCTIONAL]: false,
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.MARKETING]: false
  };
  
  return saveCookieConsent(preferences, 'reject_all');
};

/**
 * Save custom cookie preferences
 * @param {Object} preferences - Cookie preferences object
 */
export const saveCustomPreferences = (preferences) => {
  // Ensure essential cookies are always enabled
  preferences[COOKIE_CATEGORIES.ESSENTIAL] = true;
  
  return saveCookieConsent(preferences, 'custom');
};

/**
 * Check if a specific cookie category is allowed
 * @param {string} category - Cookie category
 * @returns {boolean} True if category is allowed
 */
export const isCategoryAllowed = (category) => {
  const preferences = getCookiePreferences();
  return preferences[category] === true;
};

/**
 * Clear all cookie preferences (for testing/debugging)
 */
export const clearCookiePreferences = () => {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cookie preferences:', error);
    return false;
  }
};

export default {
  getCookieConsent,
  hasCookieConsent,
  getCookiePreferences,
  saveCookieConsent,
  acceptAllCookies,
  rejectAllCookies,
  saveCustomPreferences,
  isCategoryAllowed,
  clearCookiePreferences,
  COOKIE_CATEGORIES
};

