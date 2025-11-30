import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { createPortalSession } from '../../services/stripeService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import GlobalProfile from '../../components/ui/GlobalProfile';
import TableLoader from '../../components/ui/TableLoader';
import ProcessingOverlay from '../../components/ui/ProcessingOverlay';
import SubscriptionNotificationService from '../../services/subscriptionNotificationService';
import PermissionGuard from '../../components/PermissionGuard';

const SubscriptionManagement = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'invoices'
  const [invoices, setInvoices] = useState([]);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Handle sidebar toggle and responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Dynamic plans state - fetched from database
  const [plans, setPlans] = useState([
    {
      id: 'starter',
      name: 'Starter Plan',
      price: {
        monthly: 29.99,
        yearly: 24.99,
        yearlyTotal: 299.88
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
        yearly: 41.66,
        yearlyTotal: 499.92
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
  ]);

  // Load pricing from database on mount
  useEffect(() => {
    const loadPricing = async () => {
      const result = await SubscriptionNotificationService.getAllPricingData();
      if (result.success && result.data) {
        setPlans(prevPlans => prevPlans.map(plan => {
          const dbPricing = result.data[plan.id];
          if (dbPricing) {
            return {
              ...plan,
              name: dbPricing.name || plan.name,
              description: dbPricing.description || plan.description,
              price: {
                monthly: dbPricing.monthly,
                yearly: dbPricing.yearly,
                yearlyTotal: dbPricing.yearlyTotal
              },
              popular: dbPricing.popular
            };
          }
          return plan;
        }));
      }
    };
    loadPricing();
  }, []);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // First, try to fetch real-time data from Stripe
      try {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-subscription', {
          body: { userId: user.id }
        });

        if (!stripeError && stripeData?.success && stripeData?.subscription) {
          const subscriptionData = stripeData.subscription;
          
          // Normalize status
          if (subscriptionData.status === 'trial') {
            subscriptionData.status = 'trialing';
          }
          
          setSubscription(subscriptionData);
          
          // Set billing cycle based on current subscription
          if (subscriptionData?.interval) {
            setBillingCycle(subscriptionData.interval);
          }
          
          // Mark current plan
          plans.forEach(plan => {
            plan.current = plan.id === subscriptionData.plan_type;
          });

          console.log('Subscription loaded from:', stripeData.source);
          return;
        }
      } catch (stripeErr) {
        console.warn('Could not fetch from Stripe, falling back to database:', stripeErr);
      }

      // Fallback: Load subscription data from local database
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

      // Normalize status
      if (subscriptionData?.status === 'trial') {
        subscriptionData.status = 'trialing';
      }

      setSubscription(subscriptionData);
      
      // Set billing cycle based on current subscription
      if (subscriptionData?.interval) {
        setBillingCycle(subscriptionData.interval);
      }
      
      // Mark current plan
      plans.forEach(plan => {
        plan.current = plan.id === subscriptionData.plan_type;
      });

      console.log('Subscription loaded from: database (fallback)');

    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      setLoadingInvoices(true);
      
      const { data, error } = await supabase.functions.invoke('get-invoices', {
        body: { userId: user.id, limit: 20 }
      });

      if (error) {
        console.error('Error loading invoices:', error);
        return;
      }

      if (data?.success) {
        setInvoices(data.invoices || []);
        setUpcomingInvoice(data.upcoming_invoice || null);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Load invoices when switching to invoices tab
  useEffect(() => {
    if (activeTab === 'invoices' && invoices.length === 0 && user) {
      loadInvoices();
    }
  }, [activeTab, user]);

  // Determine if plan change is upgrade or downgrade
  const isUpgrade = (newPlanId) => {
    if (!subscription) return true;
    const planHierarchy = { starter: 1, pro: 2 };
    const currentPlanType = subscription.plan_type || 'starter';
    return planHierarchy[newPlanId] > planHierarchy[currentPlanType];
  };

  const handlePlanChange = async (newPlanId) => {
    if (isChangingPlan || !subscription) return;
    
    // Open confirmation modal
    setSelectedPlan(plans.find(p => p.id === newPlanId));
    setShowPlanChangeModal(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan || isChangingPlan) return;
    
    try {
      setIsChangingPlan(true);
      
      // Get pricing from database
      const pricingResult = await SubscriptionNotificationService.getPricingInfo(
        selectedPlan.id, 
        billingCycle
      );
      
      let planName = selectedPlan.name;
      let amount = selectedPlan.price[billingCycle];
      
      if (pricingResult.success && pricingResult.data) {
        planName = pricingResult.data.plan_name;
        amount = pricingResult.data.amount;
      }

      // Call edge function to update subscription in Stripe
      const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
        body: {
          userId: user.id,
          action: 'update_plan',
          planType: selectedPlan.id,
          billingInterval: billingCycle
        }
      });

      if (error) {
        console.error('Error updating subscription:', error);
       
        return;
      }

      if (!data?.success) {
        alert(data?.error || 'Error updating subscription. Please try again.');
        return;
      }

      // Update local subscription in database
      // Use user_id instead of id since subscription.id might be Stripe subscription ID
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: selectedPlan.id,
          plan_name: planName,
          interval: billingCycle,
          amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating local subscription:', updateError);
      }

      // Update user's selected plan and subscription status
      await supabase
        .from('users')
        .update({ 
          selected_plan: selectedPlan.id,
          subscription_status: 'active' // Plan change means active subscription
        })
        .eq('id', user.id);

      // Reload subscription data
      await loadSubscriptionData();
      
      setShowPlanChangeModal(false);
      setSelectedPlan(null);
     

    } catch (error) {
      console.error('Error changing plan:', error);
    
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancelSubscription = async (cancelAtPeriodEnd = true) => {
    if (isCancelling || !subscription) return;
    
    try {
      setIsCancelling(true);
      
      // Call edge function to cancel subscription in Stripe
      const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
        body: {
          userId: user.id,
          action: 'cancel',
          cancelAtPeriodEnd: cancelAtPeriodEnd
        }
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
       
        return;
      }

      if (!data?.success) {
        alert(data?.error || 'Error cancelling subscription. Please try again.');
        return;
      }

      // Update local subscription
      // Use user_id instead of id since subscription.id might be Stripe subscription ID
      const newStatus = cancelAtPeriodEnd ? 'active' : 'cancelled';
      await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Also update user's subscription status
      await supabase
        .from('users')
        .update({ 
          subscription_status: newStatus
        })
        .eq('id', user.id);

      // Reload subscription data
      await loadSubscriptionData();
      
      setShowCancelModal(false);
      

    } catch (error) {
      console.error('Error cancelling subscription:', error);
    
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (isChangingPlan || !subscription) return;
    
    try {
      setIsChangingPlan(true);
      
      const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
        body: {
          userId: user.id,
          action: 'reactivate'
        }
      });

      if (error || !data?.success) {
        alert(data?.error || 'Error reactivating subscription. Please try again.');
        return;
      }

      // Update local subscription
      // Use user_id instead of id since subscription.id might be Stripe subscription ID
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Also update user's subscription status
      await supabase
        .from('users')
        .update({ 
          subscription_status: 'active'
        })
        .eq('id', user.id);

      await loadSubscriptionData();
      

    } catch (error) {
      console.error('Error reactivating subscription:', error);
 
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleManageBilling = async () => {
    if (isManagingBilling) return;
    
    try {
      setIsManagingBilling(true);
      
      // Always use Supabase user ID - the Edge Function will look up the Stripe customer ID
      const { data, error } = await createPortalSession(user.id);
      
      if (error) {
        console.error('Error creating portal session:', error);
        alert('Error opening billing portal. Please try again.');
        setIsManagingBilling(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Error opening billing portal. Please try again.');
      setIsManagingBilling(false);
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
      case 'trial': return 'Trialing';
      case 'cancelled': return 'Cancelled';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'void': return 'bg-red-100 text-red-800';
      case 'uncollectible': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <PermissionGuard 
      adminOnly 
      customMessage={t('subscription.adminOnly', 'Only administrators can manage subscription settings.')}
    >
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Subscription Management | Haliqo</title>
        <meta name="description" content="Manage your Haliqo subscription plan" />
      </Helmet>

      {/* Processing Overlay - Show when managing billing */}
      <ProcessingOverlay 
        isVisible={isManagingBilling}
        message={t('subscription.managingBilling', 'Opening billing portal...')}
        id="billing-portal-overlay"
        preventNavigation={false}
      />

      <MainSidebar />
      <GlobalProfile />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-16 pt-4' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="CreditCard" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('subscription.pageTitle', 'Manage Your Subscription')}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('subscription.pageDescription', 'Upgrade, downgrade, or manage your Haliqo plan')}
                </p>
              </div>
            </div>
          </header>

          {/* Current Subscription Status */}
          {loading ? (
            <TableLoader message={t('subscription.loadingPlans', 'Loading subscription details...')} />
          ) : subscription ? (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{t('subscription.currentPlan.title', 'Current Plan')}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                {t(`subscription.status.${subscription.status}`, getStatusText(subscription.status))}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('subscription.currentPlan.plan', 'Plan')}</p>
                <p className="text-lg font-semibold text-foreground">
                  {subscription.plan_name || 'Unknown Plan'}
                  {(subscription.status === 'trial' || subscription.status === 'trialing') && 
                    <span className="text-sm text-primary ml-2">({t('subscription.currentPlan.trial', 'Trial')})</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('subscription.currentPlan.price', 'Price')}</p>
                <p className="text-lg font-semibold text-foreground">
                  €{subscription.amount || 0}/{subscription.interval || 'month'}
                </p>
                {(subscription.status === 'trial' || subscription.status === 'trialing') && subscription.trial_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('subscription.currentPlan.billingStartsAfterTrial', 'Billing starts after trial')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {(subscription.status === 'trial' || subscription.status === 'trialing') 
                    ? t('subscription.currentPlan.trialEnd', 'Trial End') 
                    : t('subscription.currentPlan.nextBilling', 'Next Billing')}
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
              {subscription.payment_method && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('subscription.currentPlan.paymentMethod', 'Payment Method')}</p>
                  <div className="flex items-center gap-2">
                    <Icon name="CreditCard" size={16} className="text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">
                      {subscription.payment_method.brand?.toUpperCase()} •••• {subscription.payment_method.last4}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscription.currentPlan.expires', 'Expires')} {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {subscription.cancel_at_period_end ? (
                <Button
                  onClick={handleReactivateSubscription}
                  className="flex items-center gap-2"
                  disabled={isChangingPlan}
                >
                  <Icon name="RefreshCw" size={16} />
                  {isChangingPlan ? t('subscription.actions.processing', 'Processing...') : t('subscription.actions.reactivate', 'Reactivate Subscription')}
                </Button>
              ) : (subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'trial') && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Icon name="XCircle" size={16} />
                  {t('subscription.actions.cancel', 'Cancel Subscription')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleManageBilling}
                className="flex items-center gap-2"
                disabled={isManagingBilling}
              >
                <Icon name="CreditCard" size={16} />
                {isManagingBilling ? t('subscription.managingBilling', 'Opening...') : t('subscription.actions.updatePaymentMethod', 'Update Payment Method')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.open('mailto:support@haliqo.com', '_blank')}
                className="flex items-center gap-2"
              >
                <Icon name="Mail" size={16} />
                {t('subscription.actions.contactSupport', 'Contact Support')}
              </Button>
            </div>
            
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Icon name="AlertTriangle" size={16} />
                  <span className="text-sm font-medium">
                    {t('subscription.cancelWarning', 'Your subscription will be cancelled on {{date}}', { 
                      date: subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString() 
                        : t('subscription.endOfPeriod', 'the end of the billing period')
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
          ) : null}

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'plans'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Layers" size={16} className="inline mr-2" />
              {t('subscription.tabs.plans', 'Plans')}
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="FileText" size={16} className="inline mr-2" />
              {t('subscription.tabs.invoices', 'Invoices & Billing History')}
            </button>
          </div>

          {activeTab === 'plans' && (
            <>
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
                {t('subscription.billingCycle.monthly', 'Monthly')}
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                {t('subscription.billingCycle.yearly', 'Yearly')}
                <span className="ml-1 bg-success/10 text-success px-2 py-1 rounded-full text-xs">
                  {t('subscription.billingCycle.savePercent', 'Save {{percent}}%', { percent: 17 })}
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
                    {t('subscription.plans.recommended', 'Recommended')}
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
                  €{billingCycle === 'yearly' ? plan.price.yearlyTotal : plan.price.monthly}
                  <span className="text-lg text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('subscription.billingCycle.equivalent', 'Equivalent to €{{amount}}/month', { amount: plan.price.yearly })}
                  </p>
                )}
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-success font-medium mt-2">
                    {t('subscription.billingCycle.saveAmount', 'Save €{{amount}} per year', { amount: ((plan.price.monthly * 12) - plan.price.yearlyTotal).toFixed(2) })}
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
                {plan.current ? t('subscription.actions.currentPlan', 'Current Plan') : 
                 isChangingPlan ? t('subscription.actions.processing', 'Processing...') : 
                 t('subscription.actions.changePlan', 'Change Plan')}
              </Button>
            </div>
          ))}
        </div>

          {/* FAQ Section */}
          <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('subscription.faq.title', 'Frequently Asked Questions')}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">{t('subscription.faq.changePlan.question', 'Can I change my plan anytime?')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq.changePlan.answer', 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{t('subscription.faq.dataDowngrade.question', 'What happens to my data when I downgrade?')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq.dataDowngrade.answer', 'Your data is preserved. You\'ll have access to all your existing quotes and clients, but new features may be limited based on your plan.')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{t('subscription.faq.billing.question', 'How does billing work?')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq.billing.answer', 'You\'ll be charged the prorated amount for plan changes. Upgrades are charged immediately, downgrades are credited to your next billing cycle.')}
              </p>
            </div>
          </div>
        </div>
            </>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Upcoming Invoice */}
              {upcomingInvoice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon name="Calendar" size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">{t('subscription.invoices.upcomingPayment', 'Upcoming Payment')}</h3>
                        <p className="text-sm text-blue-700">{upcomingInvoice.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(upcomingInvoice.amount_due, upcomingInvoice.currency)}
                      </p>
                      <p className="text-sm text-blue-700">
                        {upcomingInvoice.next_payment_attempt 
                          ? t('subscription.invoices.due', 'Due {{date}}', { date: formatDate(upcomingInvoice.next_payment_attempt) })
                          : t('subscription.actions.processing', 'Processing')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices List */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon name="FileText" size={20} className="text-primary" />
                      {t('subscription.invoices.billingHistory', 'Billing History')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadInvoices}
                      disabled={loadingInvoices}
                    >
                      <Icon name={loadingInvoices ? "Loader2" : "RefreshCw"} size={14} className={loadingInvoices ? "animate-spin" : ""} />
                    </Button>
                  </div>
                </div>

                {loadingInvoices ? (
                  <div className="p-8">
                    <TableLoader message={t('subscription.invoices.loading', 'Loading invoices...')} />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="p-8 text-center">
                    <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">{t('subscription.invoices.noInvoices', 'No invoices yet')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('subscription.invoices.noInvoicesDescription', 'Your invoices will appear here after your first payment')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('subscription.invoices.invoice', 'Invoice')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('subscription.invoices.date', 'Date')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('subscription.invoices.amount', 'Amount')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('subscription.invoices.status', 'Status')}</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('subscription.invoices.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-muted/30">
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-sm font-medium text-foreground">{invoice.number || invoice.id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">{invoice.description}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-foreground">
                              {formatDate(invoice.created)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-foreground">
                              {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                                {t(`subscription.status.${invoice.status}`, invoice.status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {invoice.hosted_invoice_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                                    title={t('subscription.invoices.viewInvoice', 'View Invoice')}
                                  >
                                    <Icon name="ExternalLink" size={14} />
                                  </Button>
                                )}
                                {invoice.invoice_pdf && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                                    title={t('subscription.invoices.downloadPdf', 'Download PDF')}
                                  >
                                    <Icon name="Download" size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Plan Change Confirmation Modal */}
      {showPlanChangeModal && selectedPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="ArrowUpCircle" size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t('subscription.planChange.title', 'Change Plan')}</h3>
                <p className="text-sm text-muted-foreground">{t('subscription.planChange.subtitle', 'Confirm your plan change')}</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{t('subscription.planChange.newPlan', 'New Plan')}:</span>
                <span className="font-medium text-foreground">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{t('subscription.planChange.billing', 'Billing')}:</span>
                <span className="font-medium text-foreground">
                  {billingCycle === 'monthly' 
                    ? t('subscription.billingCycle.monthly', 'Monthly') 
                    : t('subscription.billingCycle.yearly', 'Yearly')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('subscription.planChange.price', 'Price')}:</span>
                <span className="font-medium text-foreground">
                  €{billingCycle === 'yearly' ? selectedPlan.price.yearlyTotal : selectedPlan.price.monthly}/{billingCycle === 'monthly' 
                    ? t('subscription.planChange.perMonth', 'month') 
                    : t('subscription.planChange.perYear', 'year')}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {isUpgrade(selectedPlan.id) 
                ? t('subscription.planChange.upgradeMessage', 'Your plan will be upgraded immediately. You\'ll be charged the prorated amount for the remainder of your billing period.')
                : t('subscription.planChange.downgradeMessage', 'Your downgrade will take effect at the end of your current billing period. You\'ll continue to have access to your current plan until then.')
              }
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPlanChangeModal(false);
                  setSelectedPlan(null);
                }}
                disabled={isChangingPlan}
                className="flex-1"
              >
                {t('subscription.planChange.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={confirmPlanChange}
                disabled={isChangingPlan}
                className="flex-1"
              >
                {isChangingPlan ? t('subscription.actions.processing', 'Processing...') : t('subscription.planChange.confirm', 'Confirm Change')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t('subscription.cancelModal.title', 'Cancel Subscription')}</h3>
                <p className="text-sm text-muted-foreground">{t('subscription.cancelModal.subtitle', 'We\'re sorry to see you go')}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {t('subscription.cancelModal.message', 'Your subscription will remain active until the end of your current billing period. You can reactivate anytime before then.')}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1"
              >
                {t('subscription.cancelModal.keepSubscription', 'Keep Subscription')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCancelSubscription(true)}
                disabled={isCancelling}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                {isCancelling ? t('subscription.cancelModal.cancelling', 'Cancelling...') : t('subscription.cancelModal.cancelAtPeriodEnd', 'Cancel at Period End')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
};

export default SubscriptionManagement;
