import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMultiUser } from '../context/MultiUserContext';
import { useInternetConnection } from './InternetConnectionCheck';
import Icon from './AppIcon';
import Button from './ui/Button';
import MainSidebar from './ui/MainSidebar';
import GlobalProfile from './ui/GlobalProfile';

/**
 * PermissionGuard Component
 * 
 * Wraps pages/components to enforce permission-based access control.
 * 
 * Usage:
 * <PermissionGuard module="quoteCreation" requiredPermission="full_access">
 *   <QuoteCreationPage />
 * </PermissionGuard>
 * 
 * // For admin-only pages:
 * <PermissionGuard adminOnly>
 *   <AdminOnlyPage />
 * </PermissionGuard>
 * 
 * Props:
 * - module: The permission module key (e.g., 'quoteCreation', 'quotesManagement')
 * - requiredPermission: 'view_only' or 'full_access' (default: 'view_only')
 * - adminOnly: If true, only admins can access (ignores module/requiredPermission)
 * - customMessage: Custom message to show when access is denied
 * - fallback: Custom fallback component (optional)
 * - redirectTo: Redirect path if no access (optional, default shows access denied)
 * - showMessage: Show access denied message (default: true)
 */
const PermissionGuard = ({ 
  children, 
  module, 
  requiredPermission = 'view_only',
  adminOnly = false,
  customMessage = null,
  fallback = null,
  redirectTo = null,
  showMessage = true
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const multiUserContext = useMultiUser();
  const { 
    hasPermission, 
    loading, 
    currentProfile, 
    isAdmin, 
    companyProfiles,
    initialized
  } = multiUserContext || {
    hasPermission: () => false,
    loading: true,
    currentProfile: null,
    isAdmin: () => false,
    companyProfiles: [],
    initialized: false
  };
  
  // Internet connection check
  const { isOnline, isChecking, checkConnection } = useInternetConnection();
  
  // Sidebar offset state for responsive layout
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);

  // Handle sidebar toggle and responsive layout
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
      }
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Don't show separate loader - parent already shows one
  // But also wait for profile to be loaded if it should exist
  if (loading || !initialized) {
    return null;
  }

  // Check internet connection first (similar to LimitedAccessGuard)
  // Allow access to public routes when offline
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/about', '/contact', '/features', '/terms', '/privacy', '/cookies', '/blog', '/find-artisan'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  // If offline and not on public route, show internet connection error
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

  // Check permission
  let hasAccess;
  
  if (adminOnly) {
    // For admin-only pages: allow if no profiles exist (first time setup) or if user is admin
    hasAccess = companyProfiles.length === 0 || isAdmin();
  } else {
    // For new users after registration, profile might not be loaded yet even if initialized is true
    // Allow dashboard access even without profile (it's the landing page after registration)
    if (!currentProfile && companyProfiles.length === 0 && module === 'dashboard') {
      // Dashboard should be accessible even without profile (first profile is created during registration)
      hasAccess = true;
    } else {
      hasAccess = hasPermission(module, requiredPermission);
    }
  }

  // If user has access, render children
  if (hasAccess) {
    return children;
  }

  // Handle redirect if specified
  if (redirectTo) {
    navigate(redirectTo);
    return null;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return fallback;
  }

  // Default: Show access denied message with sidebar
  if (showMessage) {
    // Determine the message to show
    const getMessage = () => {
      if (customMessage) return customMessage;
      if (adminOnly) return t('permissions.accessDenied.adminOnly', 'Only administrators can access this page.');
      if (requiredPermission === 'full_access') {
        return t('permissions.accessDenied.noFullAccess', "You don't have permission to perform this action. Contact your administrator for access.");
      }
      return t('permissions.accessDenied.noAccess', "You don't have permission to view this page. Contact your administrator for access.");
    };

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
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="ShieldOff" size={32} className="text-destructive" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {t('permissions.accessDenied.title', 'Access Denied')}
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {getMessage()}
              </p>

              {currentProfile && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('permissions.accessDenied.currentRole', 'Current Role')}:</span>{' '}
                    <span className="capitalize">{currentProfile.role}</span>
                  </p>
                  {!adminOnly && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t('permissions.accessDenied.requiredAccess', 'Required Access')}:</span>{' '}
                      <span className="capitalize">{requiredPermission.replace('_', ' ')}</span>
                    </p>
                  )}
                  {adminOnly && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t('permissions.accessDenied.requiredAccess', 'Required Access')}:</span>{' '}
                      <span>{t('permissions.accessDenied.adminRole', 'Administrator')}</span>
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  iconName="ArrowLeft"
                  iconPosition="left"
                >
                  {t('permissions.accessDenied.goBack', 'Go Back')}
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  iconName="Home"
                  iconPosition="left"
                >
                  {t('permissions.accessDenied.goHome', 'Go to Dashboard')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If no message, just return null
  return null;
};

/**
 * Hook for checking permissions in components
 * Returns helper functions for permission-based UI
 */
export const usePermissionCheck = (module) => {
  const { hasPermission } = useMultiUser();
  
  return {
    canView: hasPermission(module, 'view_only'),
    canEdit: hasPermission(module, 'full_access'),
    canCreate: hasPermission(module, 'full_access'),
    canDelete: hasPermission(module, 'full_access'),
    hasFullAccess: hasPermission(module, 'full_access'),
    hasViewOnly: hasPermission(module, 'view_only') && !hasPermission(module, 'full_access')
  };
};

export default PermissionGuard;

