/**
 * Application Configuration
 * Centralized configuration values from environment variables
 */

/**
 * Support email that automatically gets lifetime access
 * Set via VITE_SUPPORT_EMAIL environment variable
 * Falls back to 'support@h7aglobal.com' if not set
 */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@h7aglobal.com';

/**
 * Super admin email that automatically gets superadmin role and lifetime access
 * Set via VITE_SUPER_ADMIN_EMAIL environment variable
 * Falls back to 'support@haliqo.com' if not set
 */
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'support@haliqo.com';

