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
import Header from './Header';
import Footer from './Footer';

// Cache duration: 5 minutes in milliseconds
const SUBSCRIPTION_CACHE_DURATION = 5 * 60 * 1000;
const SUBSCRIPTION_CACHE_KEY = 'haliqo_subscription_cache';

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
    
    // Check if cache is still valid (within 5 minutes)
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
 * This resets the 5-minute timer every time it's called
 */
const setCachedSubscription = (userId, status, isSuperAdmin = false, subscriptionData = null, hasLifetimeAccess = false) => {
  try {
    const cacheData = {
      userId,
      status,
      isSuperAdmin,
      hasLifetimeAccess,
      subscriptionData,
      timestamp: Date.now() // Fresh timestamp on every save = resets 5-min timer
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
 * Uses localStorage cache for 5 minutes to handle unstable connections
 * Detects network errors and uses cache instead of showing subscription guard
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

      // Clear cache if it exists and has expired status - force fresh check after resubscription
      const cachedData = getCachedSubscription(user.id);
      if (cachedData && (cachedData.status === 'expired' || cachedData.status === 'none')) {
        // Clear expired cache to force fresh check
        clearSubscriptionCache();
      }
      
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
          // Check if this is a network error (unstable internet)
          if (isNetworkError(userError)) {
            // Network error detected - use cache if available, don't show guard
            if (cachedData) {
              // Only show guard if subscription actually expired based on dates
              if (cachedData.subscriptionExpired && !cachedData.hasLifetimeAccess) {
                setShowExpiredModal(true);
                setSubscriptionStatus('expired');
              } else if (cachedData.status === 'active' || cachedData.isSuperAdmin || cachedData.hasLifetimeAccess) {
                // Use cached active status - don't show guard for network issues
                setSubscriptionStatus('active');
                setShowExpiredModal(false);
              } else {
                // Only show guard if we're certain subscription is expired (not just network issue)
                setShowExpiredModal(true);
                setSubscriptionStatus(cachedData.status);
              }
              setSubscriptionLoading(false);
              return;
            }
            // No cache but network error - allow access to prevent locking users out
            setSubscriptionStatus('active');
            setShowExpiredModal(false);
            setSubscriptionLoading(false);
            return;
          }
          // Non-network error - proceed with normal error handling
          if (cachedData) {
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
          throw new Error('Error and no cache available');
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
          // Update cache with fresh timestamp (resets 5-min timer)
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
          // Update cache with fresh timestamp (resets 5-min timer)
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
          // Check if this is a network error (unstable internet)
          if (isNetworkError(error)) {
            // Network error detected - use cache if available, don't show guard
            if (cachedData) {
              // Only show guard if subscription actually expired based on dates
              if (cachedData.subscriptionExpired && !cachedData.hasLifetimeAccess) {
                setShowExpiredModal(true);
                setSubscriptionStatus('expired');
              } else if (cachedData.status === 'active' || cachedData.hasLifetimeAccess) {
                // Use cached active status - don't show guard for network issues
                setSubscriptionStatus('active');
                setShowExpiredModal(false);
              } else {
                // Only show guard if we're certain subscription is expired (not just network issue)
                setShowExpiredModal(true);
                setSubscriptionStatus(cachedData.status);
              }
              setSubscriptionLoading(false);
              return;
            }
            // No cache but network error - allow access to prevent locking users out
            setSubscriptionStatus('active');
            setShowExpiredModal(false);
            setSubscriptionLoading(false);
            return;
          }
          // Non-network error - proceed with normal error handling
          if (cachedData) {
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
          throw new Error('Error fetching subscription and no cache available');
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
            // Database shows expired - verify with Stripe directly (fallback for resubscription)
            try {
              const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-subscription', {
                body: { userId: user.id }
              });

              if (!stripeError && stripeData?.success && stripeData?.subscription) {
                const stripeSub = stripeData.subscription;
                const stripeIsActive = stripeSub.status === 'active' || 
                                      stripeSub.status === 'trialing' || 
                                      stripeSub.status === 'past_due';
                
                if (stripeIsActive) {
                  // Stripe shows active - database is out of sync, allow access
                  setShowExpiredModal(false);
                  setSubscriptionStatus('active');
                  setCachedSubscription(user.id, 'active', false, {
                    status: stripeSub.status,
                    current_period_end: stripeSub.current_period_end,
                    trial_end: stripeSub.trial_end
                  });
                } else {
                  // Stripe also shows expired
                  setShowExpiredModal(true);
                  setSubscriptionStatus('expired');
                  setCachedSubscription(user.id, 'expired', false, subscriptionData);
                }
              } else {
                // Stripe check failed or no subscription - use database result
                setShowExpiredModal(true);
                setSubscriptionStatus('expired');
                setCachedSubscription(user.id, 'expired', false, subscriptionData);
              }
            } catch (stripeCheckError) {
              console.error('Error checking Stripe subscription:', stripeCheckError);
              // Check if this is a network error
              if (isNetworkError(stripeCheckError) && cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
                // Network error but have valid active cache - use cache, don't show guard
                setSubscriptionStatus('active');
                setShowExpiredModal(false);
              } else {
                // On error, use database result
                setShowExpiredModal(true);
                setSubscriptionStatus('expired');
                setCachedSubscription(user.id, 'expired', false, subscriptionData);
              }
            }
          } else {
            // Subscription is active - clear any expired cache and set active
            setShowExpiredModal(false); // Ensure modal is hidden
            setSubscriptionStatus('active');
            // Update cache with fresh timestamp (resets 5-min timer)
            setCachedSubscription(user.id, 'active', false, subscriptionData);
          }
        } else {
          // No subscription found in database - check Stripe directly (fallback for resubscription)
          try {
            const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-subscription', {
              body: { userId: user.id }
            });

            if (!stripeError && stripeData?.success && stripeData?.subscription) {
              const stripeSub = stripeData.subscription;
              const stripeIsActive = stripeSub.status === 'active' || 
                                    stripeSub.status === 'trialing' || 
                                    stripeSub.status === 'past_due';
              
              if (stripeIsActive) {
                // Stripe shows active subscription - database is out of sync, allow access
                setShowExpiredModal(false);
                setSubscriptionStatus('active');
                setCachedSubscription(user.id, 'active', false, {
                  status: stripeSub.status,
                  current_period_end: stripeSub.current_period_end,
                  trial_end: stripeSub.trial_end
                });
              } else {
                // Stripe also shows no active subscription
                if (cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
                  setSubscriptionStatus('active');
                  setShowExpiredModal(false);
                } else {
                  setShowExpiredModal(true);
                  setSubscriptionStatus('none');
                  setCachedSubscription(user.id, 'none', false);
                }
              }
            } else {
              // Stripe check failed - check if network error
              if (isNetworkError(stripeError) && cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
                // Network error but have valid active cache - use cache, don't show guard
                setSubscriptionStatus('active');
                setShowExpiredModal(false);
              } else if (cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
                setSubscriptionStatus('active');
                setShowExpiredModal(false);
              } else {
                setShowExpiredModal(true);
                setSubscriptionStatus('none');
                setCachedSubscription(user.id, 'none', false);
              }
            }
          } catch (stripeCheckError) {
            console.error('Error checking Stripe subscription:', stripeCheckError);
            // Check if this is a network error
            if (isNetworkError(stripeCheckError) && cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
              // Network error but have valid active cache - use cache, don't show guard
              setSubscriptionStatus('active');
              setShowExpiredModal(false);
            } else if (cachedData && cachedData.status === 'active' && !cachedData.subscriptionExpired) {
              setSubscriptionStatus('active');
              setShowExpiredModal(false);
            } else {
              setShowExpiredModal(true);
              setSubscriptionStatus('none');
              setCachedSubscription(user.id, 'none', false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        
        // Check if this is a network error (unstable internet)
        if (isNetworkError(error)) {
          // Network error detected - prefer cache, don't show guard
          if (cachedData) {
            // Only show guard if subscription actually expired based on dates
            if (cachedData.subscriptionExpired && !cachedData.hasLifetimeAccess) {
              setShowExpiredModal(true);
              setSubscriptionStatus('expired');
            } else if (cachedData.status === 'active' || cachedData.isSuperAdmin || cachedData.hasLifetimeAccess) {
              // Use cached active status - don't show guard for network issues
              setSubscriptionStatus('active');
              setShowExpiredModal(false);
            } else {
              // Only show guard if we're certain subscription is expired (not just network issue)
              setShowExpiredModal(true);
              setSubscriptionStatus(cachedData.status);
            }
          } else {
            // No cache but network error - allow access to prevent locking users out
            setSubscriptionStatus('active');
            setShowExpiredModal(false);
          }
        } else {
          // Non-network error - use cached data if available and valid
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
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
        <Footer />
      </div>
    );
  }
  
  // Auth valid and subscription valid - render children
  return children;
};

export default ProtectedRoute;
