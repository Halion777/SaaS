import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMultiUser } from '../context/MultiUserContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import { SUPPORT_EMAIL, SUPER_ADMIN_EMAIL } from '../config/appConfig';
import TableLoader from './ui/TableLoader';
import Button from './ui/Button';
import Icon from './AppIcon';

// Cache duration: 30 minutes in milliseconds
const SUBSCRIPTION_CACHE_DURATION = 30 * 60 * 1000;
const SUBSCRIPTION_CACHE_KEY = 'haliqo_subscription_cache';

/**
 * Get cached subscription data from localStorage
 * Returns null if cache doesn't exist, is for different user, or has expired
 * Also validates that the subscription itself hasn't expired based on stored dates
 */
const getCachedSubscription = (userId) => {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Check if cache is for the same user
    if (data.userId !== userId) {
      localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
      return null;
    }
    
    // Check if cache is still valid (within 30 minutes)
    const now = Date.now();
    const cacheAge = now - data.timestamp;
    
    if (cacheAge > SUBSCRIPTION_CACHE_DURATION) {
      localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
      return null;
    }
    
    // IMPORTANT: Even if cache is valid, check if subscription itself has expired
    // This prevents users from accessing app if subscription ended while using cached data
    // Skip expiration check for lifetime access users
    if (data.status === 'active' && data.subscriptionData && !data.isSuperAdmin && !data.hasLifetimeAccess) {
      const subData = data.subscriptionData;
      const currentTime = new Date();
      
      // Check if trial has expired
      if (subData.trial_end) {
        const trialEnd = new Date(subData.trial_end);
        if (trialEnd < currentTime && (subData.status === 'trialing' || subData.status === 'trial')) {
          // Trial has expired, mark as expired
          data.status = 'expired';
          data.subscriptionExpired = true;
        }
      }
      
      // Check if subscription period has ended
      if (subData.current_period_end) {
        const periodEnd = new Date(subData.current_period_end);
        if (periodEnd < currentTime) {
          // Subscription period has ended, mark as expired
          data.status = 'expired';
          data.subscriptionExpired = true;
        }
      }
    }
    
    // Add remaining time info
    data.remainingTime = Math.round((SUBSCRIPTION_CACHE_DURATION - cacheAge) / 1000 / 60);
    return data;
  } catch (error) {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    return null;
  }
};

/**
 * Save subscription data to localStorage cache
 * This resets the 30-minute timer every time it's called
 */
const setCachedSubscription = (userId, status, isSuperAdmin = false, subscriptionData = null, hasLifetimeAccess = false) => {
  try {
    const cacheData = {
      userId,
      status,
      isSuperAdmin,
      hasLifetimeAccess,
      subscriptionData,
      timestamp: Date.now() // Fresh timestamp on every save = resets 30-min timer
    };
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cacheData));
    
  } catch (error) {
    console.error('Error saving subscription cache:', error);
  }
};

/**
 * Clear subscription cache (call on logout)
 */
export const clearSubscriptionCache = () => {
  try {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
  
  } catch (error) {
    console.error('Error clearing subscription cache:', error);
  }
};

/**
 * Protected route component that redirects to login if user is not authenticated
 * and checks for valid subscription (all in one loading phase)
 * Uses localStorage cache for 30 minutes to handle unstable connections
 */
const ProtectedRoute = ({ children, skipSubscriptionCheck = false }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loading: multiUserLoading } = useMultiUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Check subscription when auth is ready
  // On every reload: try to fetch fresh data and update cache
  // Cache is used as fallback only when network fails
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !user || skipSubscriptionCheck) {
        setSubscriptionLoading(false);
        return;
      }

      // Get cached data for fallback in case of network issues
      const cachedData = getCachedSubscription(user.id);
      
      try {
        // Always try to fetch fresh data from network
        // Step 1: Check if user is a super admin or has lifetime access
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, has_lifetime_access, email')
          .eq('id', user.id)
          .single();

        // If network error on user check, use cache as fallback
        if (userError) {
          if (cachedData) {
            // Check if subscription expired based on cached dates (even if status was 'active')
            if (cachedData.subscriptionExpired) {
              setShowExpiredModal(true);
              setSubscriptionStatus('expired');
            } else if (cachedData.status === 'active' || cachedData.isSuperAdmin || cachedData.hasLifetimeAccess) {
              setSubscriptionStatus('active');
            } else {
              setShowExpiredModal(true);
              setSubscriptionStatus(cachedData.status);
            }
            setSubscriptionLoading(false);
            return;
          }
          // No cache available, throw to catch block
          throw new Error('Network error and no cache available');
        }

        // Super admin users are exempt from subscription checks and always have lifetime access
        const emailLower = userData?.email?.toLowerCase().trim();
        if (userData?.role === 'superadmin') {
          // Ensure superadmin always has lifetime access
          if (!userData.has_lifetime_access) {
            await supabase
              .from('users')
              .update({ has_lifetime_access: true })
              .eq('id', user.id);
          }
          setSubscriptionStatus('active');
          // Update cache with fresh timestamp (resets 30-min timer)
          setCachedSubscription(user.id, 'active', true);
          setSubscriptionLoading(false);
          return;
        }

        // Special case: Super admin email gets superadmin role and lifetime access
        if (emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) {
          // Grant superadmin role and lifetime access
          await supabase
            .from('users')
            .update({ 
              role: 'superadmin',
              has_lifetime_access: true
            })
            .eq('id', user.id);
          setSubscriptionStatus('active');
          setCachedSubscription(user.id, 'active', true);
          setSubscriptionLoading(false);
          return;
        }

        // Check for lifetime access
        if (userData?.has_lifetime_access === true) {
          setSubscriptionStatus('active');
          // Update cache with fresh timestamp (resets 30-min timer)
          setCachedSubscription(user.id, 'active', false, null, true);
          setSubscriptionLoading(false);
          return;
        }

        // Special case: Support email gets lifetime access
        if (emailLower === SUPPORT_EMAIL.toLowerCase()) {
          // Grant lifetime access to this email
          await supabase
            .from('users')
            .update({ has_lifetime_access: true })
            .eq('id', user.id);
          setSubscriptionStatus('active');
          setCachedSubscription(user.id, 'active', false, null, true);
          setSubscriptionLoading(false);
          return;
        }

        // Step 2: Fetch subscription status from database
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('status, cancel_at_period_end, current_period_end, trial_end')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If network error on subscription fetch, use cache as fallback
        if (error && error.code !== 'PGRST116') {
          if (cachedData) {
            // Check if subscription expired based on cached dates
          if (cachedData.subscriptionExpired && !cachedData.hasLifetimeAccess) {
              setShowExpiredModal(true);
              setSubscriptionStatus('expired');
          } else if (cachedData.status === 'active' || cachedData.hasLifetimeAccess) {
              setSubscriptionStatus('active');
            } else {
              setShowExpiredModal(true);
              setSubscriptionStatus(cachedData.status);
            }
            setSubscriptionLoading(false);
            return;
          }
          throw new Error('Network error fetching subscription and no cache available');
        }

        // Step 3: Process subscription data and update cache
        if (subscriptionData) {
          const isActive = subscriptionData.status === 'active' || 
                          subscriptionData.status === 'trialing' ||
                          subscriptionData.status === 'trial';
          
          const trialExpired = subscriptionData.trial_end && 
                              new Date(subscriptionData.trial_end) < new Date() &&
                              (subscriptionData.status === 'trialing' || subscriptionData.status === 'trial');
          
          const periodEnded = subscriptionData.current_period_end && 
                             new Date(subscriptionData.current_period_end) < new Date();

          if (!isActive || trialExpired || periodEnded) {
            setShowExpiredModal(true);
            setSubscriptionStatus('expired');
            // Update cache with fresh timestamp
            setCachedSubscription(user.id, 'expired', false, subscriptionData);
          } else {
            setSubscriptionStatus('active');
            // Update cache with fresh timestamp (resets 30-min timer)
            setCachedSubscription(user.id, 'active', false, subscriptionData);
          }
        } else {
          // No subscription found in database
          // Check if we have valid cache showing active (might be temporary network issue)
          if (cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
            setSubscriptionStatus('active');
            // Don't update cache here - let it expire naturally
          } else {
            setShowExpiredModal(true);
            setSubscriptionStatus('none');
            setCachedSubscription(user.id, 'none', false);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        
        // On any error, use cached data if available and valid
        if (cachedData) {
          // Check if subscription expired based on cached dates
          if (cachedData.subscriptionExpired) {
            setShowExpiredModal(true);
            setSubscriptionStatus('expired');
            } else if (cachedData.status === 'active' || cachedData.isSuperAdmin || cachedData.hasLifetimeAccess) {
            setSubscriptionStatus('active');
          } else {
            setShowExpiredModal(true);
            setSubscriptionStatus(cachedData.status);
          }
        } else {
          // No cache available, allow access to prevent locking users out
          setSubscriptionStatus('active');
        }
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      checkSubscription();
    } else if (!authLoading) {
      setSubscriptionLoading(false);
    }
  }, [isAuthenticated, user, authLoading, skipSubscriptionCheck]);
  
  // Show SINGLE loading state while checking auth, subscription, AND multi-user context
  const isLoading = authLoading || 
    (isAuthenticated && subscriptionLoading && !skipSubscriptionCheck) ||
    (isAuthenticated && multiUserLoading);
    
  if (isLoading) {
    return (
        <TableLoader 
          message={t('ui.loading', 'Loading...')}
        overlay={true}
        zIndex={50}
        />
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Show expired subscription modal
  if (showExpiredModal && !skipSubscriptionCheck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="AlertTriangle" size={32} className="text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {subscriptionStatus === 'none' 
              ? t('subscription.noSubscription', 'No Active Subscription')
              : t('subscription.expired', 'Subscription Expired')}
          </h2>
          
          <p className="text-muted-foreground mb-8">
            {subscriptionStatus === 'none'
              ? t('subscription.noSubscriptionMessage', 'You don\'t have an active subscription. Please subscribe to access the application.')
              : t('subscription.expiredMessage', 'Your subscription has expired. Please renew your subscription to continue using Haliqo.')}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscription')}
              className="w-full"
            >
              <Icon name="CreditCard" size={18} className="mr-2" />
              {t('subscription.renewSubscription', 'Manage Subscription')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                clearSubscriptionCache();
                supabase.auth.signOut();
                navigate('/login');
              }}
              className="w-full"
            >
              <Icon name="LogOut" size={18} className="mr-2" />
              {t('nav.logout', 'Logout')}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-6">
            {t('subscription.contactSupport', 'Need help? Contact us at support@haliqo.com')}
          </p>
        </div>
      </div>
    );
  }
  
  // Auth valid and subscription valid - render children
  return children;
};

export default ProtectedRoute;
