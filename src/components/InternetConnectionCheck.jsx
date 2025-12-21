import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Icon from './AppIcon';
import Button from './ui/Button';

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
 * Shows a full-screen error when offline and prevents access to protected routes
 */
const InternetConnectionCheck = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isOnline, isChecking, checkConnection } = useInternetConnection();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);

  // Handle sidebar offset for responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        setSidebarOffset(isCollapsed ? 80 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        try {
          const savedCollapsed = localStorage.getItem('sidebar-collapsed');
          const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
          setSidebarOffset(isCollapsed ? 80 : 288);
        } catch (e) {
          setSidebarOffset(288);
        }
      }
    };

    handleResize();
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Allow access to public routes when offline
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/about', '/contact', '/features', '/terms', '/privacy', '/cookies', '/blog', '/find-artisan'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  // Don't show internet connection guard on mobile devices
  // Mobile browsers can have unreliable network state detection when switching tabs
  if (isMobile) {
    return <>{children}</>;
  }

  // If offline and not on public route, show error (desktop only)
  if (!isOnline && !isPublicRoute && !isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-8 sm:p-10 text-center">
          {/* WiFi Icon with animated pulse effect */}
          <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-error/20 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-error/10 rounded-full"></div>
            <Icon name="WifiOff" size={48} className="text-error relative z-10" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-3">
            {t('common.errors.noInternet', 'No Internet Connection')}
          </h2>
          
          <p className="text-muted-foreground mb-8 text-base">
            {t('common.errors.noInternetMessage', 'Please check your internet connection and try again.')}
          </p>

          {/* Connection status info */}
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-5 mb-8 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                {t('common.errors.connectionStatus', 'Connection Status')}:
              </span>
              <span className="text-sm text-error font-bold px-3 py-1 bg-error/10 rounded-full">
                {t('common.errors.offline', 'Offline')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {t('common.errors.connectionHelp', 'Make sure your device is connected to Wi-Fi or mobile data, then click the button below.')}
            </p>
          </div>
          
          <Button
            onClick={checkConnection}
            variant="default"
            iconName="Wifi"
            iconPosition="left"
            disabled={isChecking}
            className="w-full sm:w-auto min-w-[200px] text-base py-6 px-8 font-semibold"
            size="lg"
          >
            {isChecking ? t('common.checking', 'Checking...') : t('common.connectMeNow', 'Connect Me Now')}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default InternetConnectionCheck;
