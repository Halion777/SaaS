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

/**
 * Protected route: auth + subscription. Guard uses Stripe only (get-subscription).
 * No localStorage/session/cache; show guard only when Stripe says subscription ended.
 */
const ProtectedRoute = ({ children, skipSubscriptionCheck = false }) => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { loading: multiUserLoading } = useMultiUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !user || skipSubscriptionCheck) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        // 1) Quick DB check: superadmin / lifetime / special emails → allow, skip Stripe
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, has_lifetime_access, email')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          const emailLower = userData.email?.toLowerCase().trim();
          if (userData.role === 'superadmin') {
            if (!userData.has_lifetime_access) {
              await supabase.from('users').update({ has_lifetime_access: true }).eq('id', user.id);
            }
            setSubscriptionStatus('active');
            setSubscriptionLoading(false);
            return;
          }
          if (emailLower === SUPER_ADMIN_EMAIL?.toLowerCase()) {
            await supabase.from('users').update({ role: 'superadmin', has_lifetime_access: true }).eq('id', user.id);
            setSubscriptionStatus('active');
            setSubscriptionLoading(false);
            return;
          }
          if (userData.has_lifetime_access === true) {
            setSubscriptionStatus('active');
            setSubscriptionLoading(false);
            return;
          }
          if (emailLower === SUPPORT_EMAIL?.toLowerCase()) {
            await supabase.from('users').update({ has_lifetime_access: true }).eq('id', user.id);
            setSubscriptionStatus('active');
            setSubscriptionLoading(false);
            return;
          }
        }

        // 2) Stripe-only: get-subscription. On error → allow (no guard).
        const { data: stripeRes, error: stripeErr } = await supabase.functions.invoke('get-subscription', {
          body: { userId: user.id }
        });

        if (stripeErr) {
          setSubscriptionStatus('active');
          setShowExpiredModal(false);
          setSubscriptionLoading(false);
          return;
        }

        const sub = stripeRes?.subscription ?? null;
        if (!sub) {
          setShowExpiredModal(true);
          setSubscriptionStatus('none');
          setSubscriptionLoading(false);
          return;
        }

        // Guard only when period/trial has actually ended. "Canceled" means no renewal
        // but access until current_period_end — so don't block on status alone.
        const now = Date.now();
        const periodEnd = sub.current_period_end ? (typeof sub.current_period_end === 'number' ? sub.current_period_end : new Date(sub.current_period_end).getTime()) : null;
        const trialEnd = sub.trial_end ? (typeof sub.trial_end === 'number' ? sub.trial_end : new Date(sub.trial_end).getTime()) : null;
        const periodEnded = periodEnd != null && periodEnd < now;
        const trialEnded = trialEnd != null && trialEnd < now;

        if (periodEnded || trialEnded) {
          setShowExpiredModal(true);
          setSubscriptionStatus('expired');
        } else {
          setSubscriptionStatus('active');
          setShowExpiredModal(false);
        }
      } catch (err) {
        console.error('Subscription check error:', err);
        setSubscriptionStatus('active');
        setShowExpiredModal(false);
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
                onClick={() => logout()}
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
