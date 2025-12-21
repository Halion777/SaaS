import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMultiUser } from '../context/MultiUserContext';
import Icon from './AppIcon';
import Button from './ui/Button';
import MainSidebar from './ui/MainSidebar';
import GlobalProfile from './ui/GlobalProfile';

/**
 * Check if an error is network-related (unstable internet)
 * Returns true if the error indicates a network connectivity issue
 */
const isNetworkError = (error) => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code || '';
  
  // Check for common network error patterns
  const networkErrorPatterns = [
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'NetworkError when attempting to fetch resource',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_CONNECTION_RESET',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET'
  ];
  
  // Check if error message contains network error patterns
  const isNetworkErrorPattern = networkErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Check for Supabase network error codes
  const isSupabaseNetworkError = errorCode === 'PGRST301' || // Connection error
                                  errorCode === 'PGRST302' || // Timeout
                                  errorCode === 'PGRST303';    // Network error
  
  // Check for fetch API network errors
  const isFetchNetworkError = error instanceof TypeError && 
                               (errorMessage.includes('fetch') || errorMessage.includes('network'));
  
  return isNetworkErrorPattern || isSupabaseNetworkError || isFetchNetworkError;
};

/**
 * LimitedAccessGuard Component
 * 
 * Shows limited access message for Starter plan users with upgrade button.
 * Unlike PermissionGuard, this allows viewing the page but shows a banner/overlay
 * indicating limited features and provides upgrade button.
 * 
 * Usage:
 * <LimitedAccessGuard requiredPlan="pro" featureName="Lead Generation">
 *   <LeadsManagementPage />
 * </LimitedAccessGuard>
 * 
 * Props:
 * - requiredPlan: 'pro' - The plan required for full access
 * - featureName: Name of the feature (for display)
 * - showBanner: If true, shows banner at top instead of blocking (default: true)
 * - customMessage: Custom message to show
 */
const LimitedAccessGuard = ({ 
  children, 
  requiredPlan = 'pro',
  featureName = 'This feature',
  showBanner = true,
  customMessage = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile, loading } = useMultiUser();
  
  // Calculate initial sidebar offset based on saved state and screen size
  const calculateInitialOffset = () => {
    const mobile = window.innerWidth < 768;
    const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (mobile) {
      return 0;
    } else if (tablet) {
      return 80;
    } else {
      // Check localStorage for saved sidebar state
      try {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        return isCollapsed ? 80 : 288;
      } catch (e) {
        // Default to expanded if localStorage read fails
        return 288;
      }
    }
  };

  // Sidebar offset state for responsive layout
  const [sidebarOffset, setSidebarOffset] = useState(() => calculateInitialOffset());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

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
      } else {
        // Re-check sidebar state on resize for desktop
        try {
          const savedCollapsed = localStorage.getItem('sidebar-collapsed');
          const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
          setSidebarOffset(isCollapsed ? 80 : 288);
        } catch (e) {
          setSidebarOffset(288);
        }
      }
    };

    // Initialize on mount - check current sidebar state
    const initializeOffset = () => {
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

    // Initialize immediately
    initializeOffset();

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Don't show separate loader - parent already shows one
  if (loading) {
    return null;
  }

  // If userProfile is null/undefined and we're not loading, it might be a network error
  // In that case, allow access to prevent blocking users with unstable internet
  // Only show guard if we have confirmed userProfile data
  if (!userProfile && !loading) {
    // Likely network error - allow access to prevent false positives
    return children;
  }

  // Check if user has required plan
  const hasRequiredPlan = userProfile?.selected_plan === requiredPlan;
  const isStarterPlan = userProfile?.selected_plan === 'starter';

  // If user has required plan, render children without banner
  if (hasRequiredPlan) {
    return children;
  }

  // If showBanner is true, show banner at top and allow access
  if (showBanner && isStarterPlan) {
    const getMessage = () => {
      if (customMessage) return customMessage;
      return t('limitedAccess.banner.message', {
        feature: featureName,
        defaultValue: `${featureName} is available with limited features on Starter plan. Upgrade to Pro for full access.`
      });
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Limited Access Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
          <div 
            className={`transition-all duration-300 ease-out ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}
            style={{ marginLeft: isMobile ? 0 : `${sidebarOffset}px` }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Sparkles" size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                    {t('limitedAccess.banner.title', {
                      feature: featureName,
                      defaultValue: `Limited Access: ${featureName}`
                    })}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {getMessage()}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/subscription')}
                className="w-full sm:w-auto flex-shrink-0"
                size="sm"
              >
                <Icon name="ArrowUp" size={16} className="mr-2" />
                {t('limitedAccess.banner.upgradeButton', 'Upgrade to Pro')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Render children with banner */}
        {children}
      </div>
    );
  }

  // If showBanner is false, show blocking message (similar to PermissionGuard)
  const getMessage = () => {
    if (customMessage) return customMessage;
    return t('limitedAccess.blocked.message', {
      feature: featureName,
      plan: requiredPlan,
      defaultValue: `${featureName} requires ${requiredPlan} plan. Please upgrade to access this feature.`
    });
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
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="Sparkles" size={32} className="text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {t('limitedAccess.blocked.title', {
                feature: featureName,
                defaultValue: 'Upgrade Required'
              })}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {getMessage()}
            </p>

            {userProfile && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{t('limitedAccess.blocked.currentPlan', 'Current Plan')}:</span>{' '}
                  <span className="capitalize">{userProfile.selected_plan || 'starter'}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{t('limitedAccess.blocked.requiredPlan', 'Required Plan')}:</span>{' '}
                  <span className="capitalize">{requiredPlan}</span>
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                {t('limitedAccess.blocked.goBack', 'Go Back')}
              </Button>
              <Button
                onClick={() => navigate('/subscription')}
                iconName="ArrowUp"
                iconPosition="left"
              >
                {t('limitedAccess.blocked.upgradeButton', 'Upgrade to Pro')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LimitedAccessGuard;

