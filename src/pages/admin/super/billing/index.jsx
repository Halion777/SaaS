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
    activeSubscriptions: 0,
    cancelledSubscriptions: 0
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
      console.log('Loading billing data...');
      
      // Load subscriptions from subscriptions table (created by Stripe webhook)
      // Exclude subscriptions for superadmin users
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          users!subscriptions_user_id_fkey(first_name, last_name, email, company_name, role)
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

      console.log('Billing data loaded:', {
        subscriptions: filteredSubscriptions.length,
        payments: filteredPaymentsData.length,
        paymentRecords: filteredPaymentRecords.length
      });

      setSubscriptions(filteredSubscriptions);
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

      // Calculate subscription counts (excluding superadmin)
      const activeSubscriptions = filteredSubscriptions?.filter(sub => sub.status === 'active').length || 0;
      const cancelledSubscriptions = filteredSubscriptions?.filter(sub => 
        sub.status === 'cancelled' || sub.status === 'inactive'
      ).length || 0;

      setBillingStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        cancelledSubscriptions
      });

      // Process chart data (excluding superadmin)
      const chartData = processChartData(filteredPaymentRecords, filteredSubscriptions);
      setChartData(chartData);

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // Clear all filters
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
      if (sub.status === 'active' || sub.status === 'trial') {
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
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
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
              <Button
                variant="outline"
                onClick={() => navigate('/admin/super/dashboard')}
                  className="flex items-center gap-2"
              >
                  <Icon name="ArrowLeft" size={16} />
                Back to Dashboard
              </Button>
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
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : billingStats.cancelledSubscriptions}
                  </p>
                </div>
                <Icon name="UserX" size={24} className="text-red-600" />
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

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'trial', label: 'Trial' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'payment_failed', label: 'Payment Failed' }
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">From Date</label>
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

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
                            {subscription.status}
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
                            {(subscription.status === 'active' || subscription.status === 'trialing') && (
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
                            {subscription.users?.full_name || 'Unknown'}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{subscription.users?.email || 'No email'}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
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
                        {(subscription.status === 'active' || subscription.status === 'trialing') && (
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

          {/* Recent Payments */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
            </div>
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
                          {payment.description || 'Subscription Payment'}
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
                          {payment.subscriptions?.users?.full_name || 'Unknown'}
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
                          <p className="text-xs text-muted-foreground">{payment.description || 'Subscription Payment'}</p>
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
