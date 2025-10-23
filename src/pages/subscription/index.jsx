import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { createCheckoutSession, createPortalSession } from '../../services/stripeService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import TableLoader from '../../components/ui/TableLoader';

const SubscriptionManagement = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Handle sidebar toggle
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      setSidebarOffset(isCollapsed ? 80 : 288);
    };

    // Set initial state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setSidebarOffset(isCollapsed ? 80 : 288);

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle);
  }, []);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: {
        monthly: 29.99,
        yearly: 24.99
      },
      description: 'Perfect for beginners',
      features: [
        '15 quotes/invoices per month',
        'Basic templates',
        'Payment tracking',
        'Email support',
        'Basic client management'
      ],
      limitations: [
        'Limited AI',
        'No automatic reminders'
      ],
      current: false,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: {
        monthly: 49.99,
        yearly: 41.66
      },
      description: 'Complete solution with AI',
      features: [
        'Unlimited quotes/invoices',
        'Complete AI and optimizations',
        'Automatic reminders',
        'Advanced analytics',
        'Premium templates',
        'Priority support',
        'Signature predictions',
        'Price optimization'
      ],
      limitations: [],
      current: false,
      popular: true
    }
  ];

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load subscription data from subscriptions table
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading subscription data:', error);
        return;
      }

      setSubscription(subscriptionData);
      
      // Mark current plan
      plans.forEach(plan => {
        plan.current = plan.id === subscriptionData.plan_type;
      });

    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlanId) => {
    if (isChangingPlan) return;
    
    try {
      setIsChangingPlan(true);
      
      // Create Stripe checkout session for plan change
      const { data, error } = await createCheckoutSession({
        planType: newPlanId,
        billingCycle: 'monthly',
        userId: user.id,
        successUrl: `${window.location.origin}/dashboard?subscription=updated`,
        cancelUrl: `${window.location.origin}/subscription?cancelled=true`
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        alert('Error processing subscription change. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Error changing subscription. Please try again.');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      // Always use Supabase user ID - the Edge Function will look up the Stripe customer ID
      const { data, error } = await createPortalSession(user.id);
      
      if (error) {
        console.error('Error creating portal session:', error);
        alert('Error opening billing portal. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Error opening billing portal. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trialing': 
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': 
      case 'trial': return 'Trial';
      case 'cancelled': return 'Cancelled';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Subscription Management | Haliqo</title>
        <meta name="description" content="Manage your Haliqo subscription plan" />
      </Helmet>

      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="CreditCard" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Manage Your Subscription</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Upgrade, downgrade, or manage your Haliqo plan
                </p>
              </div>
            </div>
          </header>

          {/* Current Subscription Status */}
          {loading ? (
            <TableLoader message="Loading subscription details..." />
          ) : subscription ? (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                {getStatusText(subscription.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold text-foreground">
                  {subscription.plan_name || 'Unknown Plan'}
                  {(subscription.status === 'trial' || subscription.status === 'trialing') && 
                    <span className="text-sm text-primary ml-2">(Trial)</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-semibold text-foreground">
                  €{subscription.amount || 0}/{subscription.interval || 'month'}
                </p>
                {(subscription.status === 'trial' || subscription.status === 'trialing') && subscription.trial_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billing starts after trial
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {(subscription.status === 'trial' || subscription.status === 'trialing') ? 'Trial End' : 'Next Billing'}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {subscription.trial_end 
                    ? new Date(subscription.trial_end).toLocaleDateString()
                    : subscription.current_period_end 
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : 'N/A'
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={handleManageBilling}
                className="flex items-center gap-2"
              >
                <Icon name="CreditCard" size={16} />
                Manage Billing
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('mailto:support@haliqo.com', '_blank')}
                className="flex items-center gap-2"
              >
                <Icon name="Mail" size={16} />
                Contact Support
              </Button>
            </div>
          </div>
          ) : null}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-muted rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <span className="ml-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Available Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 ${
                plan.current 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="text-3xl font-bold text-foreground">
                  €{plan.price[billingCycle]}
                  <span className="text-lg text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-success font-medium mt-2">
                    Save €{((plan.price.monthly * 12) - (plan.price.yearly * 12)).toFixed(2)} per year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Icon name="Check" size={16} className="text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.limitations && plan.limitations.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-center">
                      <Icon name="X" size={16} className="text-red-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                onClick={() => handlePlanChange(plan.id)}
                disabled={plan.current || isChangingPlan}
                className={`w-full ${
                  plan.current 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : ''
                }`}
              >
                {plan.current ? 'Current Plan' : 
                 isChangingPlan ? 'Processing...' : 
                 'Change Plan'}
              </Button>
            </div>
          ))}
        </div>

          {/* FAQ Section */}
          <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Can I change my plan anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">What happens to my data when I downgrade?</h4>
              <p className="text-sm text-muted-foreground">
                Your data is preserved. You'll have access to all your existing quotes and clients, but new features may be limited based on your plan.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">How does billing work?</h4>
              <p className="text-sm text-muted-foreground">
                You'll be charged the prorated amount for plan changes. Upgrades are charged immediately, downgrades are credited to your next billing cycle.
              </p>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
