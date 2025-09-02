import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';

const SuperAdminBilling = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load subscriptions
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          users!subscriptions_user_id_fkey(full_name, email, company_name)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Load payments from invoices
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('invoices')
        .select(`
          *,
          users!invoices_user_id_fkey(full_name, email, company_name)
        `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      setSubscriptions(subscriptionsData || []);
      setPayments(paymentsData || []);

      // Calculate stats
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.final_amount || 0), 0) || 0;
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyRevenue = paymentsData?.filter(payment => 
        new Date(payment.created_at) >= currentMonth
      ).reduce((sum, payment) => sum + (payment.final_amount || 0), 0) || 0;

      const activeSubscriptions = subscriptionsData?.filter(sub => sub.status === 'active').length || 0;
      const cancelledSubscriptions = subscriptionsData?.filter(sub => sub.status === 'cancelled').length || 0;

      setBillingStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        cancelledSubscriptions
      });

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
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
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

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Billing & Subscriptions - Super Admin | Haliqo</title>
      </Helmet>

      <SuperAdminSidebar />

      <main className="ml-0 lg:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing & Subscriptions</h1>
              <p className="text-muted-foreground mt-1">
                Manage subscriptions and monitor revenue
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/super/dashboard')}
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

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

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="past_due">Past Due</option>
                <option value="trialing">Trialing</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Subscriptions</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
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
                              {subscription.users?.full_name || 'Unknown'}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // View subscription details
                                console.log('View subscription:', subscription.id);
                              }}
                            >
                              <Icon name="Eye" size={14} />
                            </Button>
                            {subscription.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Cancel subscription
                                  if (confirm('Are you sure you want to cancel this subscription?')) {
                                    supabase
                                      .from('subscriptions')
                                      .update({ status: 'cancelled' })
                                      .eq('id', subscription.id)
                                      .then(() => loadBillingData());
                                  }
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Icon name="X" size={14} />
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
          </div>

          {/* Recent Payments */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
            </div>
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
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="border-t border-border hover:bg-muted/25">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {payment.users?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.users?.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {payment.invoice_number || `#${payment.id}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(payment.final_amount || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {payments.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="Receipt" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminBilling;
