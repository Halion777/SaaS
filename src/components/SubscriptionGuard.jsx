import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { SUPPORT_EMAIL, SUPER_ADMIN_EMAIL } from '../config/appConfig';
import { useInternetConnection } from './InternetConnectionCheck';
import TableLoader from './ui/TableLoader';
import Button from './ui/Button';
import Icon from './AppIcon';
import Header from './Header';
import Footer from './Footer';

/**
 * SubscriptionGuard component that checks if user has an active subscription
 * Redirects to subscription page if subscription is cancelled or expired
 * Super admin users are exempt from subscription checks
 */
const SubscriptionGuard = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Internet connection check
  const { isOnline, isChecking, checkConnection } = useInternetConnection();

  // Check if mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        // First, check if user is a super admin or has lifetime access
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, has_lifetime_access, email')
          .eq('id', user.id)
          .single();

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
          setIsSuperAdmin(true);
          setSubscriptionStatus('active');
          setLoading(false);
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
          setIsSuperAdmin(true);
          setSubscriptionStatus('active');
          setLoading(false);
          return;
        }

        // Check for lifetime access
        if (userData?.has_lifetime_access === true) {
          setSubscriptionStatus('active');
          setLoading(false);
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
          setLoading(false);
          return;
        }

        // Fetch subscription status from database
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('status, cancel_at_period_end, current_period_end, trial_end')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
        }

        if (subscriptionData) {
          // Check if subscription is valid
          const isActive = subscriptionData.status === 'active' || 
                          subscriptionData.status === 'trialing' ||
                          subscriptionData.status === 'trial';
          
          // Check if trial has expired
          const trialExpired = subscriptionData.trial_end && 
                              new Date(subscriptionData.trial_end) < new Date() &&
                              (subscriptionData.status === 'trialing' || subscriptionData.status === 'trial');
          
          // Check if subscription period has ended
          const periodEnded = subscriptionData.current_period_end && 
                             new Date(subscriptionData.current_period_end) < new Date();

          if (!isActive || trialExpired || periodEnded) {
            setShowExpiredModal(true);
            setSubscriptionStatus('expired');
          } else {
            setSubscriptionStatus('active');
          }
        } else {
          // No subscription found
          setShowExpiredModal(true);
          setSubscriptionStatus('none');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // Allow access on error to prevent locking users out
        setSubscriptionStatus('active');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSubscription();
    }
  }, [isAuthenticated, user, authLoading]);

  // Don't show separate loader - parent already shows one
  if (authLoading || loading) {
    return null;
  }

  // Check internet connection first
  // Allow access to public routes when offline
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/about', '/contact', '/features', '/terms', '/privacy', '/cookies', '/blog', '/find-artisan'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  // If offline and not on public route, show internet connection error
  if (!isOnline && !isPublicRoute && !isChecking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center p-4 sm:p-6 min-h-screen">
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
      </div>
    );
  }

  // Show expired subscription modal
  if (showExpiredModal) {
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

  // Subscription is valid, render children
  return children;
};

export default SubscriptionGuard;

