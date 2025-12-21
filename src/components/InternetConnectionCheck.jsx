import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Icon from './AppIcon';
import Button from './ui/Button';
import MainSidebar from './ui/MainSidebar';
import GlobalProfile from './ui/GlobalProfile';

/**
 * Hook to check internet connectivity
 * Returns online status and connection checking function
 */
export const useInternetConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      setIsOnline(true);
      return true;
    } catch (error) {
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

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

  // If offline and not on public route, show error
  if (!isOnline && !isPublicRoute && !isChecking) {
    return (
      <div className="min-h-screen bg-background">
        <MainSidebar />
        <GlobalProfile />
        <main 
          className={`transition-all duration-300 ease-out ${isMobile ? 'pb-16 pt-4' : ''}`}
          style={{ marginLeft: isMobile ? 0 : `${sidebarOffset}px` }}
        >
          <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-8 text-center">
              {/* Icon with animated pulse effect */}
              <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-error/20 rounded-full animate-ping"></div>
                <Icon name="AlertCircle" size={40} className="text-error relative z-10" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t('common.errors.noInternet', 'No Internet Connection')}
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {t('common.errors.noInternetMessage', 'Please check your internet connection and try again.')}
              </p>

              {/* Connection status info */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {t('common.errors.connectionStatus', 'Connection Status')}:
                  </span>
                  <span className="text-sm text-error font-medium">
                    {t('common.errors.offline', 'Offline')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('common.errors.connectionHelp', 'Make sure your device is connected to Wi-Fi or mobile data, then click Retry.')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={checkConnection}
                  variant="default"
                  iconName="RefreshCw"
                  iconPosition="left"
                  disabled={isChecking}
                >
                  {isChecking ? t('common.checking', 'Checking...') : t('common.retry', 'Retry')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  iconName="RotateCw"
                  iconPosition="left"
                >
                  {t('common.refresh', 'Refresh Page')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
};

export default InternetConnectionCheck;
