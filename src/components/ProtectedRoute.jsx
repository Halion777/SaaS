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

        // 2) Stripe-only: get-subscription.
        // Only show guard when we have a CLEAR success response. Any doubt → allow (no guard).
        const { data: stripeRes, error: stripeErr } = await supabase.functions.invoke('get-subscription', {
          body: { userId: user.id }
        });

        // Invoke failed (network, timeout, function crash) → allow
        if (stripeErr) {
          setSubscriptionStatus('active');
          setShowExpiredModal(false);
          setSubscriptionLoading(false);
          return;
        }

        // No response or function reported failure (e.g. Stripe/DB error) → allow
        if (!stripeRes || stripeRes.success !== true) {
          setSubscriptionStatus('active');
          setShowExpiredModal(false);
          setSubscriptionLoading(false);
          return;
        }

        const sub = stripeRes.subscription ?? null;

        // Helper: when we would show guard, check DB as fallback — if DB says they have access, allow
        const dbSaysHasAccess = async () => {
          try {
            const { data: dbSub } = await supabase
              .from('subscriptions')
              .select('status, current_period_end, trial_end')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!dbSub) return false;
            const s = (dbSub.status || '').toLowerCase();
            if (s !== 'active' && s !== 'trialing' && s !== 'trial') return false;
            const now = Date.now();
            const periodEnd = dbSub.current_period_end ? new Date(dbSub.current_period_end).getTime() : null;
            const trialEnd = dbSub.trial_end ? new Date(dbSub.trial_end).getTime() : null;
            if (periodEnd != null && periodEnd < now) return false;
            if (trialEnd != null && trialEnd < now) return false;
            return true;
          } catch {
            return false;
          }
        };

        if (!sub) {
          if (await dbSaysHasAccess()) {
            setSubscriptionStatus('active');
            setShowExpiredModal(false);
          } else {
            setShowExpiredModal(true);
            setSubscriptionStatus('none');
          }
          setSubscriptionLoading(false);
          return;
        }

        // Permanent fix: grace period (24h) after period/trial end to avoid blocking paying users
        const GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours

        // If Stripe says active, past_due, or trialing/trial, allow (trial users can use the app)
        const status = (sub.status || '').toLowerCase();
        if (status === 'active' || status === 'past_due' || status === 'trialing' || status === 'trial') {
          setSubscriptionStatus('active');
          setShowExpiredModal(false);
          setSubscriptionLoading(false);
          return;
        }

        // For trialing/canceled/etc: only show guard when period/trial ended *beyond* grace
        try {
          const now = Date.now();
          const periodEnd = sub.current_period_end != null
            ? (typeof sub.current_period_end === 'number' ? sub.current_period_end : new Date(sub.current_period_end).getTime())
            : null;
          const trialEnd = sub.trial_end != null
            ? (typeof sub.trial_end === 'number' ? sub.trial_end : new Date(sub.trial_end).getTime())
            : null;
          const periodEnded = periodEnd != null && (periodEnd + GRACE_MS) < now;
          const trialEnded = trialEnd != null && (trialEnd + GRACE_MS) < now;

          if (periodEnded || trialEnded) {
            if (await dbSaysHasAccess()) {
              setSubscriptionStatus('active');
              setShowExpiredModal(false);
            } else {
              setShowExpiredModal(true);
              setSubscriptionStatus('expired');
            }
          } else {
            setSubscriptionStatus('active');
            setShowExpiredModal(false);
          }
        } catch (parseErr) {
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
