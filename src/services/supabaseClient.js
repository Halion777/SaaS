import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for simplified authentication
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvuvjtbfvzhtccinhmcl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzI4MjMsImV4cCI6MjA2ODYwODgyM30.9vj1JflLlLVrBiv1czG89WZMLgzo-QINoGecfkhVeXs';

// Custom storage handler for enhanced security
const secureSessionStorage = {
  getItem: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item;
    } catch (error) {
      console.error('Error retrieving session item:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting session item:', error);
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing session item:', error);
    }
  }
};

/**
 * Supabase client with simplified authentication configuration
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use session storage for temporary authentication
    persistSession: true,
    storage: secureSessionStorage,
    
    // Simplified token management
    autoRefreshToken: true,
    detectSessionInUrl: false, // Removed PKCE-related detection
    
    // Removed PKCE flow
    flowType: 'implicit' // Use standard implicit flow
  }
});

/**
 * Secure session management utilities
 */
export const sessionManager = {
  /**
   * Completely clear all authentication-related data
   */
  clearAllAuthData: () => {
    try {
      // Clear Supabase session
      supabase.auth.signOut();
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Optional: Clear specific keys if needed
      const keysToRemove = [
        'sb-access-token', 
        'sb-refresh-token', 
        'sb-provider-token',
        'user_data',
        'registration_complete'
      ];
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('All authentication data cleared');
    } catch (error) {
      console.error('Error clearing authentication data:', error);
    }
  },
  
  /**
   * Check if user is currently authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    try {
      const session = supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
};

export default supabase; 