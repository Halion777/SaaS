import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import TableLoader from './ui/TableLoader';
import Button from './ui/Button';
import Icon from './AppIcon';

/**
 * SubscriptionGuard component that checks if user has an active subscription
 * Redirects to subscription page if subscription is cancelled or expired
 */
const SubscriptionGuard = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
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

  // Show loading while checking auth and subscription
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TableLoader 
          message={t('subscription.checking', 'Verifying subscription...')}
          className="h-screen"
        />
      </div>
    );
  }

  // Show expired subscription modal
  if (showExpiredModal) {
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

  // Subscription is valid, render children
  return children;
};

export default SubscriptionGuard;

