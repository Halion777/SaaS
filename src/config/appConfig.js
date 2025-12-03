/**
 * Application Configuration
 * Centralized configuration values from environment variables
 */

/**
 * Support email that automatically gets lifetime access
 * Set via VITE_SUPPORT_EMAIL environment variable
 * Falls back to 'support@h7aglobal.com' if not set
 */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;

