import React, { useState, useEffect, useRef } from 'react';

/**
 * Shared utility function to check internet connectivity
 * Can be used by both hooks and class components
 * Checks both general internet and Supabase connectivity
 */
export const checkInternetConnection = async () => {
  try {
    // First check: Try to fetch a small resource to verify general connectivity
    try {
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
    } catch (fetchError) {
      // Check for specific network error codes
      const errorMessage = fetchError?.message || fetchError?.toString() || '';
      const isNetworkError = errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
                           errorMessage.includes('ERR_NETWORK') ||
                           errorMessage.includes('Failed to fetch') ||
                           errorMessage.includes('NetworkError') ||
                           fetchError?.name === 'TypeError';
      
      if (isNetworkError) {
        return false;
      }
    }

    // Second check: Try to connect to Supabase to verify database connectivity
    // This catches ERR_INTERNET_DISCONNECTED and other Supabase network errors
    try {
      const { supabase } = await import('../services/supabaseClient');
      
      // Make a lightweight query to test Supabase connection
      // Use Promise.race with timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { error } = result || {};
        
        // If we get an error, check if it's a network error
        if (error) {
          const errorMessage = error.message || error.toString() || '';
          const errorCode = error.code || '';
          
          // Check for Supabase network error codes and browser network errors
          // This includes ERR_INTERNET_DISCONNECTED from Supabase requests
          const isSupabaseNetworkError = 
            errorCode === 'PGRST301' || // Connection error
            errorCode === 'PGRST302' || // Timeout
            errorCode === 'PGRST303' || // Network error
            errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
            errorMessage.includes('ERR_NETWORK') ||
            errorMessage.includes('ERR_CONNECTION_REFUSED') ||
            errorMessage.includes('ERR_CONNECTION_TIMED_OUT') ||
            errorMessage.includes('ERR_CONNECTION_RESET') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ETIMEDOUT') ||
            errorMessage.includes('ENOTFOUND');
          
          if (isSupabaseNetworkError) {
            return false;
          }
          // Other Supabase errors (like permission errors) don't mean we're offline
          // So we still return true if it's not a network error
        }
        
        return true;
      } catch (raceError) {
        // Check if it's a timeout or network error
        const errorMessage = raceError?.message || raceError?.toString() || '';
        if (errorMessage.includes('timeout') || 
            errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
            errorMessage.includes('ERR_NETWORK')) {
          return false;
        }
        throw raceError;
      }
    } catch (supabaseError) {
      // Check if Supabase error is network-related
      const errorMessage = supabaseError?.message || supabaseError?.toString() || '';
      const errorName = supabaseError?.name || '';
      
      const isNetworkError = 
        errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
        errorMessage.includes('ERR_NETWORK') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage.includes('ERR_CONNECTION_TIMED_OUT') ||
        errorMessage.includes('ERR_CONNECTION_RESET') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ENOTFOUND') ||
        errorName === 'TypeError' ||
        errorName === 'AbortError' ||
        errorName === 'NetworkError';
      
      if (isNetworkError) {
        return false;
      }
      // If it's not a network error, assume we're online (might be a different issue)
      return true;
    }
  } catch (error) {
    // Catch any other errors and check if they're network-related
    const errorMessage = error?.message || error?.toString() || '';
    const isNetworkError = errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
                          errorMessage.includes('ERR_NETWORK') ||
                          errorMessage.includes('Failed to fetch') ||
                          errorMessage.includes('NetworkError');
    
    return !isNetworkError;
  }
};

/**
 * Hook to check internet connectivity
 * Returns online status and connection checking function
 */
export const useInternetConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const offlineTimeoutRef = useRef(null);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const isConnected = await checkInternetConnection();
      setIsOnline(isConnected);
      return isConnected;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Don't set up connection checking on mobile devices
    if (isMobile) {
      setIsOnline(true); // Always assume online on mobile
      return;
    }

    const handleOnline = () => {
      // Clear any pending offline timeout
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      // Clear any existing timeout
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
      // Add a delay before setting offline to avoid false positives
      offlineTimeoutRef.current = setTimeout(() => {
        setIsOnline(false);
        offlineTimeoutRef.current = null;
      }, 2000); // 2 second delay
    };

    // Handle visibility change - re-check when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, re-check connection
        checkConnection();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check
    checkConnection();

    // Check every 30 seconds (only on desktop)
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };
  }, [isMobile]);

  return { isOnline, isChecking, checkConnection };
};

/**
 * Internet Connection Check Component
 * Simple wrapper component - internet connectivity checks are handled by individual guards
 * (PermissionGuard, SubscriptionGuard, LimitedAccessGuard) that wrap specific pages
 * This component just passes through children and provides the useInternetConnection hook
 */
const InternetConnectionCheck = ({ children }) => {
  // Simple wrapper - let individual guards handle internet connectivity checks
  // Guards like PermissionGuard, SubscriptionGuard, and LimitedAccessGuard
  // already have internet connectivity checks built in
  return <>{children}</>;
};

export default InternetConnectionCheck;
