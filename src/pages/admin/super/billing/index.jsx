import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';
import TableLoader from 'components/ui/TableLoader';
import RevenueChart from 'components/ui/RevenueChart';
import SubscriptionViewModal from './components/SubscriptionViewModal';
import SubscriptionEditModal from './components/SubscriptionEditModal';
import SubscriptionCancelModal from './components/SubscriptionCancelModal';
import SubscriptionsFilterToolbar from './components/SubscriptionsFilterToolbar';
import PaymentsFilterToolbar from './components/PaymentsFilterToolbar';

const SuperAdminBilling = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth < 1024 ? 'card' : 'table';
  });
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [billingStats, setBillingStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0,
    activeSubscriptions: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    planDistribution: [],
    paymentTrends: []
  });

  // Modal states
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
    const updateSidebarOffset = (isCollapsed) => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }

      // Auto-switch to card view on mobile/tablet
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      updateSidebarOffset(isCollapsed);
    };
    
    const handleResize = () => {
      // Get current sidebar state from localStorage
      const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
      const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
      updateSidebarOffset(isCollapsed);
    };

    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    
    // Set initial state based on saved sidebar state
    const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
    const initialCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    updateSidebarOffset(initialCollapsed);

    return () => {
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      
      // Load subscriptions from subscriptions table (created by Stripe webhook)
      // Exclude subscriptions for superadmin users
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          users!subscriptions_user_id_fkey(first_name, last_name, email, company_name, role, selected_plan)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Error loading subscriptions:', subscriptionsError);
        throw subscriptionsError;
      }

      // Load paid invoices for payment data
      // Exclude invoices for superadmin users
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('invoices')
        .select(`
          *,
          users!invoices_user_id_fkey(first_name, last_name, email, company_name, role)
        `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        throw paymentsError;
      }

      // Load payment records for actual payment tracking
      // Exclude payment records for superadmin users
      const { data: paymentRecordsData, error: paymentRecordsError } = await supabase
        .from('payment_records')
        .select(`
          *,
          subscriptions!payment_records_subscription_id_fkey(
            users!subscriptions_user_id_fkey(first_name, last_name, email, company_name, role)
          )
        `)
        .eq('status', 'succeeded')
        .order('paid_at', { ascending: false });

      if (paymentRecordsError) {
        console.error('Error loading payment records:', paymentRecordsError);
        // Don't throw error, just log it as payment records might not exist yet
      }

      // Filter out superadmin users from subscriptions, payments, and payment records
      const filteredSubscriptions = (subscriptionsData || []).filter(sub => 
        sub.users && sub.users.role !== 'superadmin'
      );
      const filteredPaymentsData = (paymentsData || []).filter(payment => 
        payment.users && payment.users.role !== 'superadmin'
      );
      const filteredPaymentRecords = (paymentRecordsData || []).filter(record => 
        record.subscriptions?.users && record.subscriptions.users.role !== 'superadmin'
      );

      // ✅ PRIORITY: Sync each subscription with live Stripe data first
      const subscriptionsWithStripeData = await Promise.all(
        filteredSubscriptions.map(async (subscription) => {
          const userId = subscription.user_id;
          if (!userId) return subscription;

          try {
            // Get live data from Stripe
            const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-subscription', {
              body: { userId: userId }
            });

            // If we got Stripe data successfully, merge it with database data (Stripe takes priority)
            if (!stripeError && stripeData?.success && stripeData?.subscription) {
              const stripeSubscription = stripeData.subscription;
              
              // Merge: Use Stripe data for amounts, dates, status; keep database data for other fields
              return {
                ...subscription,
                // Prioritize Stripe data for critical fields
                status: stripeSubscription.status || subscription.status,
                plan_type: stripeSubscription.plan_type || subscription.plan_type,
                plan_name: stripeSubscription.plan_name || subscription.plan_name,
                amount: stripeSubscription.amount || subscription.amount,
                interval: stripeSubscription.interval || subscription.interval,
                current_period_start: stripeSubscription.current_period_start || subscription.current_period_start,
                current_period_end: stripeSubscription.current_period_end || subscription.current_period_end,
                trial_end: stripeSubscription.trial_end || subscription.trial_end,
                cancel_at_period_end: stripeSubscription.cancel_at_period_end !== undefined 
                  ? stripeSubscription.cancel_at_period_end 
                  : subscription.cancel_at_period_end,
                cancelled_at: stripeSubscription.cancelled_at || subscription.cancelled_at,
                // Keep database user info
                users: subscription.users
              };
            }
            
            // If Stripe fetch failed, use database data as fallback
            return subscription;
          } catch (error) {
            console.error(`Error fetching Stripe data for subscription ${subscription.id}:`, error);
            return subscription; // Fallback to database data
          }
        })
      );

      // Fetch usage statistics for each subscription
      const subscriptionsWithUsage = await Promise.all(
        subscriptionsWithStripeData.map(async (subscription) => {
          const userId = subscription.user_id;
          if (!userId) return subscription;

          try {
            // Get monthly clients added count (clients created this month)
            const startOfMonthForClients = new Date();
            startOfMonthForClients.setDate(1);
            startOfMonthForClients.setHours(0, 0, 0, 0);
            
            const { count: monthlyClientsAdded } = await supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .gte('created_at', startOfMonthForClients.toISOString());

            // Get monthly Peppol invoices usage (sent + received)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            // Count sent Peppol invoices (from invoices table)
            // Use peppol_sent_at if available, otherwise created_at
            const { count: peppolSentCount } = await supabase
              .from('invoices')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('peppol_enabled', true)
              .not('peppol_sent_at', 'is', null)
              .gte('peppol_sent_at', startOfMonth.toISOString());
            
            // Count received Peppol invoices (from expense_invoices table)
            // Use peppol_received_at for accurate monthly count
            // Note: peppol_received_at is timestamp without timezone, but Supabase handles ISO format correctly
            const { count: peppolReceivedCount } = await supabase
              .from('expense_invoices')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('peppol_enabled', true)
              .eq('source', 'peppol')
              .not('peppol_received_at', 'is', null)
              .gte('peppol_received_at', startOfMonth.toISOString());

            const peppolUsage = (peppolSentCount || 0) + (peppolReceivedCount || 0);

            // Get plan limits
            const plan = subscription.users?.selected_plan || 'starter';
            const { QUOTAS, formatQuotaLimit } = await import('../../../../config/subscriptionFeatures');
            const planQuotas = QUOTAS[plan] || QUOTAS.starter;
            const maxClientsPerMonth = formatQuotaLimit(planQuotas.clientsPerMonth);
            const maxPeppol = formatQuotaLimit(planQuotas.peppolInvoicesPerMonth);

            return {
              ...subscription,
              usage: {
                clientsAddedThisMonth: monthlyClientsAdded || 0,
                maxClientsPerMonth: maxClientsPerMonth,
                peppolInvoices: peppolUsage,
                maxPeppolInvoices: maxPeppol
              }
            };
          } catch (error) {
            console.error(`Error fetching usage for subscription ${subscription.id}:`, error);
            return subscription;
          }
        })
      );

      setSubscriptions(subscriptionsWithUsage);
      setPayments(filteredPaymentRecords);
      setFilteredPayments(filteredPaymentRecords);

      // Calculate revenue based on actual payment records (excluding superadmin)
      const totalRevenue = filteredPaymentRecords?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyRevenue = filteredPaymentRecords?.filter(record => 
        new Date(record.paid_at) >= currentMonth
      ).reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      // Calculate previous month revenue
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      previousMonth.setDate(1);
      const previousMonthEnd = new Date(currentMonth);
      previousMonthEnd.setDate(0); // Last day of previous month
      const previousMonthRevenue = filteredPaymentRecords?.filter(record => {
        const recordDate = new Date(record.paid_at);
        return recordDate >= previousMonth && recordDate <= previousMonthEnd;
      }).reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      // Calculate subscription counts (excluding superadmin)
      const activeSubscriptions = subscriptionsWithUsage?.filter(sub => 
        sub.status === 'active' || sub.status === 'trialing' || sub.status === 'trial'
      ).length || 0;

      setBillingStats({
        totalRevenue,
        monthlyRevenue,
        previousMonthRevenue,
        activeSubscriptions
      });

      // Process chart data (excluding superadmin)
      const chartData = processChartData(filteredPaymentRecords, subscriptionsWithUsage);
      setChartData(chartData);

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    // Normalize trial/trialing
    const normalizedStatus = status === 'trial' ? 'trialing' : status;
    switch (normalizedStatus) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Normalize status display text (trial -> trialing)
  const normalizeStatus = (status) => {
    return status === 'trial' ? 'trialing' : status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Apply date filters to payments
  const applyDateFilters = () => {
    let filtered = payments;
    
    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      filtered = filtered.filter(payment => 
        new Date(payment.paid_at) >= fromDate
      );
    }
    
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(payment => 
        new Date(payment.paid_at) <= toDate
      );
    }
    
    setFilteredPayments(filtered);
  };

  // Clear all filters (kept for backward compatibility, but filters are now handled by toolbars)
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter({ from: '', to: '' });
    setFilteredPayments(payments);
  };

  // Update filtered payments when date filter changes
  useEffect(() => {
    applyDateFilters();
  }, [dateFilter, payments]);

  // Process chart data
  const processChartData = (paymentRecords, subscriptions) => {
    // Monthly revenue data (last 12 months)
    const monthlyRevenue = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const monthRevenue = paymentRecords?.filter(record => {
        const recordDate = new Date(record.paid_at);
        return recordDate >= monthStart && recordDate <= monthEnd;
      }).reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
      
      monthlyRevenue.push({
        name: monthName,
        revenue: monthRevenue
      });
    }

    // Plan distribution
    const planDistribution = [];
    const planCounts = {};
    
    subscriptions?.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trial' || sub.status === 'trialing') {
        const planName = sub.plan_name || 'Unknown Plan';
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      }
    });
    
    Object.entries(planCounts).forEach(([plan, count]) => {
      planDistribution.push({
        name: plan,
        revenue: count
      });
    });

    // Payment trends (last 30 days)
    const paymentTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const dayRevenue = paymentRecords?.filter(record => {
        const recordDate = new Date(record.paid_at);
        return recordDate >= dayStart && recordDate <= dayEnd;
      }).reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
      
      paymentTrends.push({
        name: dayName,
        revenue: dayRevenue
      });
    }

    return {
      monthlyRevenue,
      planDistribution,
      paymentTrends
    };
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      ((sub.users?.first_name && sub.users?.last_name ? `${sub.users.first_name} ${sub.users.last_name}` : sub.users?.first_name || sub.users?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      sub.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Match both 'trial' and 'trialing' when filtering for trialing
    const matchesStatus = statusFilter === 'all' || 
      sub.status === statusFilter || 
      (statusFilter === 'trialing' && sub.status === 'trial');
    
    return matchesSearch && matchesStatus;
  });

  // Modal handlers
  const handleViewSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };

  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsEditModalOpen(true);
  };

  const handleCancelSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsCancelModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedSubscription(null);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsCancelModalOpen(false);
  };

  const handleSubscriptionUpdate = () => {
    loadBillingData(); // Refresh data after update
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Billing & Subscriptions - Super Admin | Haliqo</title>
      </Helmet>

      <SuperAdminSidebar />

      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >

        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-2 sm:px-4 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="space-y-1">
                <div className="flex items-center">
                  <Icon name="CreditCard" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Billing & Subscriptions</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                Manage subscriptions and monitor revenue
              </p>
            </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            </div>
          </div>
          </header>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : formatCurrency(billingStats.totalRevenue)}
                  </p>
                </div>
                <Icon name="DollarSign" size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : formatCurrency(billingStats.monthlyRevenue)}
                  </p>
                </div>
                <Icon name="TrendingUp" size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : billingStats.activeSubscriptions}
                  </p>
                </div>
                <Icon name="Users" size={24} className="text-green-600" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Previous Month</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : formatCurrency(billingStats.previousMonthRevenue)}
                  </p>
                </div>
                <Icon name="TrendingUp" size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Revenue Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Monthly Revenue</h3>
                <Icon name="TrendingUp" size={20} className="text-blue-600" />
              </div>
              <RevenueChart
                data={chartData.monthlyRevenue}
                type="area"
                height={300}
                color="#3b82f6"
              />
            </div>

            {/* Plan Distribution Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Plan Distribution</h3>
                <Icon name="PieChart" size={20} className="text-green-600" />
              </div>
              <RevenueChart
                data={chartData.planDistribution}
                type="pie"
                height={300}
              />
            </div>
          </div>

          {/* Payment Trends Chart */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Payment Trends (Last 30 Days)</h3>
              <Icon name="BarChart" size={20} className="text-purple-600" />
            </div>
            <RevenueChart
              data={chartData.paymentTrends}
              type="bar"
              height={250}
              color="#8b5cf6"
            />
          </div>

          {/* Subscriptions Filter */}
          <SubscriptionsFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredCount={filteredSubscriptions.length}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">View:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Table" size={14} className="mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'card'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Grid" size={14} className="mr-1" />
                  Cards
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredSubscriptions.length} subscription(s)
            </div>
          </div>

          {/* Subscriptions Table/Card View */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Subscriptions</h3>
            </div>
            {loading ? (
              <TableLoader message="Loading subscriptions..." />
            ) : (
              <>
              {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Next Billing
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Usage
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((subscription) => (
                      <tr key={subscription.id} className="border-t border-border hover:bg-muted/25">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {(subscription.users?.first_name && subscription.users?.last_name ? `${subscription.users.first_name} ${subscription.users.last_name}` : subscription.users?.first_name || subscription.users?.last_name || 'Unknown')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {subscription.users?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {subscription.plan_name || 'Standard Plan'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {subscription.interval || 'monthly'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                            {normalizeStatus(subscription.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(subscription.amount || 0)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(subscription.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Clients (this month):</span>
                              <span className="font-medium text-foreground">
                                {subscription.usage?.clientsAddedThisMonth || 0} / {subscription.usage?.maxClientsPerMonth === 'Unlimited' ? '∞' : subscription.usage?.maxClientsPerMonth || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Peppol:</span>
                              <span className="font-medium text-foreground">
                                {subscription.usage?.peppolInvoices || 0} / {subscription.usage?.maxPeppolInvoices === 'Unlimited' ? '∞' : subscription.usage?.maxPeppolInvoices || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {/* View Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSubscription(subscription)}
                              title="View subscription details"
                            >
                              <Icon name="Eye" size={14} />
                            </Button>
                            
                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSubscription(subscription)}
                              title="Edit subscription"
                            >
                              <Icon name="Edit" size={14} />
                            </Button>
                            
                            {/* Cancel Button */}
                            {(subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'trial') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelSubscription(subscription)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                title="Cancel subscription"
                              >
                                <Icon name="Trash2" size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredSubscriptions.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="CreditCard" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No subscriptions found</p>
                  </div>
                )}
              </div>
              )}

              {viewMode === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {(subscription.users?.first_name && subscription.users?.last_name ? `${subscription.users.first_name} ${subscription.users.last_name}` : subscription.users?.first_name || subscription.users?.last_name || 'Unknown')}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{subscription.users?.email || 'No email'}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                          {normalizeStatus(subscription.status)}
                        </span>
                      </div>

                      {/* Subscription Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Plan:</span>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{subscription.plan_name || 'Standard Plan'}</p>
                            <p className="text-xs text-muted-foreground">{subscription.interval || 'monthly'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Amount:</span>
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(subscription.amount || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Next Billing:</span>
                          <span className="text-xs text-foreground">
                            {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Created:</span>
                          <span className="text-xs text-foreground">{formatDate(subscription.created_at)}</span>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Usage:</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Clients (this month):</span>
                              <span className="text-xs font-medium text-foreground">
                                {subscription.usage?.clientsAddedThisMonth || 0} / {subscription.usage?.maxClientsPerMonth === 'Unlimited' ? '∞' : subscription.usage?.maxClientsPerMonth || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Peppol:</span>
                              <span className="text-xs font-medium text-foreground">
                                {subscription.usage?.peppolInvoices || 0} / {subscription.usage?.maxPeppolInvoices === 'Unlimited' ? '∞' : subscription.usage?.maxPeppolInvoices || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-1 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubscription(subscription)}
                          className="h-8 px-2"
                          title="View Details"
                        >
                          <Icon name="Eye" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubscription(subscription)}
                          className="h-8 px-2"
                          title="Edit"
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                        {(subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'trial') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                            title="Cancel"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredSubscriptions.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Icon name="CreditCard" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No subscriptions found</p>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </div>

          {/* Payments Filter */}
          <PaymentsFilterToolbar
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            filteredCount={filteredPayments.length}
          />

          {/* Recent Payments */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
            </div>
            {loading ? (
              <div className="p-8">
                <TableLoader message="Loading payment records..." />
              </div>
            ) : (
              <>
            {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="border-t border-border hover:bg-muted/25">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {(payment.subscriptions?.users?.first_name && payment.subscriptions?.users?.last_name ? `${payment.subscriptions.users.first_name} ${payment.subscriptions.users.last_name}` : payment.subscriptions?.users?.first_name || payment.subscriptions?.users?.last_name || 'Unknown')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.subscriptions?.users?.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {payment.stripe_invoice_id || `#${payment.id.slice(-8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.subscriptions?.plan_name && payment.subscriptions?.interval 
                            ? `${payment.subscriptions.plan_name} - ${payment.subscriptions.interval}`
                            : payment.description 
                              ? payment.description.replace('pro plan subscription - Trial period', 'Pro Plan').replace('starter plan subscription - Trial period', 'Starter Plan')
                              : 'Subscription payment'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(payment.amount || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(payment.paid_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="Receipt" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              )}
            </div>
            )}

            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredPayments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* User Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {(payment.subscriptions?.users?.first_name && payment.subscriptions?.users?.last_name ? `${payment.subscriptions.users.first_name} ${payment.subscriptions.users.last_name}` : payment.subscriptions?.users?.first_name || payment.subscriptions?.users?.last_name || 'Unknown')}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{payment.subscriptions?.users?.email || 'No email'}</p>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Invoice:</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{payment.stripe_invoice_id || `#${payment.id.slice(-8)}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.subscriptions?.plan_name && payment.subscriptions?.interval 
                              ? `${payment.subscriptions.plan_name} - ${payment.subscriptions.interval}`
                              : payment.description 
                                ? payment.description.replace('pro plan subscription - Trial period', 'Pro Plan').replace('starter plan subscription - Trial period', 'Starter Plan')
                                : 'Subscription payment'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Amount:</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Date:</span>
                        <span className="text-xs text-foreground">{formatDate(payment.paid_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPayments.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Icon name="Receipt" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payments found</p>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
      </main>
      </div>

      {/* Modals */}
      <SubscriptionViewModal
        isOpen={isViewModalOpen}
        onClose={handleModalClose}
        subscription={selectedSubscription}
      />

      <SubscriptionEditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        subscription={selectedSubscription}
        onUpdate={handleSubscriptionUpdate}
      />

      <SubscriptionCancelModal
        isOpen={isCancelModalOpen}
        onClose={handleModalClose}
        subscription={selectedSubscription}
        onUpdate={handleSubscriptionUpdate}
      />
    </div>
  );
};

export default SuperAdminBilling;
