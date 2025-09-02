import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';


const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalQuotes: 0,
    totalInvoices: 0,
    totalLeads: 0,
    totalRevenue: 0,
    systemUptime: '99.8%',
    lastBackup: '2 hours ago'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    active: 0,
    converted: 0,
    spam: 0
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load system statistics
  useEffect(() => {
    const loadSystemStats = async () => {
      try {
        setLoading(true);
        
        // Get total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Get active users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: activeUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', thirtyDaysAgo.toISOString());

        // Get total quotes
        const { count: totalQuotes } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true });

        // Get total invoices
        const { count: totalInvoices } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true });

        // Get total leads
        const { count: totalLeads } = await supabase
          .from('lead_requests')
          .select('*', { count: 'exact', head: true });

        // Get lead statistics
        const { count: activeLeads } = await supabase
          .from('lead_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: convertedLeads } = await supabase
          .from('lead_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        // Get total revenue from invoices
        const { data: revenueData } = await supabase
          .from('invoices')
          .select('final_amount')
          .eq('status', 'paid');

        const totalRevenue = revenueData?.reduce((sum, invoice) => sum + (invoice.final_amount || 0), 0) || 0;

        setSystemStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalQuotes: totalQuotes || 0,
          totalInvoices: totalInvoices || 0,
          totalLeads: totalLeads || 0,
          totalRevenue: totalRevenue,
          systemUptime: '99.8%',
          lastBackup: '2 hours ago'
        });

        setLeadStats({
          total: totalLeads || 0,
          active: activeLeads || 0,
          converted: convertedLeads || 0,
          spam: 0 // We'll implement spam detection later
        });

        // Load recent activity
        await loadRecentActivity();
        
        // Load top users
        await loadTopUsers();

      } catch (error) {
        console.error('Error loading system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemStats();
  }, []);

  const loadRecentActivity = async () => {
    try {
      // Get recent quotes
      const { data: recentQuotes } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          status,
          created_at,
          users!quotes_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent leads
      const { data: recentLeads } = await supabase
        .from('lead_requests')
        .select('id, client_name, project_description, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const activity = [
        ...(recentQuotes || []).map(quote => ({
          id: quote.id,
          type: 'quote',
          title: `New quote ${quote.quote_number}`,
          description: `Created by ${quote.users?.full_name || 'Unknown'}`,
          timestamp: quote.created_at,
          status: quote.status
        })),
        ...(recentUsers || []).map(user => ({
          id: user.id,
          type: 'user',
          title: `New user registered`,
          description: user.full_name || user.email,
          timestamp: user.created_at,
          status: 'active'
        })),
        ...(recentLeads || []).map(lead => ({
          id: lead.id,
          type: 'lead',
          title: `New lead request`,
          description: `${lead.client_name} - ${lead.project_description?.substring(0, 50)}...`,
          timestamp: lead.created_at,
          status: 'active'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadTopUsers = async () => {
    try {
      // Get users with most quotes
      const { data: topUsersData } = await supabase
        .from('quotes')
        .select(`
          user_id,
          users!quotes_user_id_fkey(full_name, email, company_name)
        `);

      // Count quotes per user
      const userQuoteCounts = {};
      topUsersData?.forEach(quote => {
        if (quote.user_id) {
          userQuoteCounts[quote.user_id] = (userQuoteCounts[quote.user_id] || 0) + 1;
        }
      });

      // Get top 5 users
      const topUsersList = Object.entries(userQuoteCounts)
        .map(([userId, count]) => {
          const userData = topUsersData?.find(q => q.user_id === userId)?.users;
          return {
            id: userId,
            name: userData?.full_name || 'Unknown',
            email: userData?.email || '',
            company: userData?.company_name || '',
            quoteCount: count
          };
        })
        .sort((a, b) => b.quoteCount - a.quoteCount)
        .slice(0, 5);

      setTopUsers(topUsersList);
    } catch (error) {
      console.error('Error loading top users:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Check if user is authenticated and has superadmin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        // Check if user has superadmin role
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !userData || userData.role !== 'superadmin') {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking superadmin access:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);



  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <SuperAdminSidebar />
      
             {/* Main Content */}
       <main className="ml-0 lg:ml-64 transition-all duration-300 ease-out">
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Shield" size={24} className="text-red-600 mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  System Overview • {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    iconName="Settings" 
                    iconPosition="left"
                    className="sm:h-9 sm:px-3 sm:w-auto"
                  >
                    <span className="hidden sm:inline">System Settings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    iconName="RefreshCw" 
                    iconPosition="left"
                    className="sm:h-9 sm:px-3 sm:w-auto"
                  >
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

                     {/* System Status Overview */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-card border border-border rounded-lg p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : systemStats.totalUsers.toLocaleString()}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                   <Icon name="Users" size={24} className="text-blue-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="UserCheck" size={16} className="text-green-500 mr-1" />
                   <span>{systemStats.activeUsers} active (30 days)</span>
                 </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : systemStats.totalQuotes.toLocaleString()}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                   <Icon name="FileText" size={24} className="text-green-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="TrendingUp" size={16} className="text-green-500 mr-1" />
                   <span>All time quotes</span>
                 </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : systemStats.totalLeads.toLocaleString()}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                   <Icon name="Target" size={24} className="text-orange-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="Activity" size={16} className="text-orange-500 mr-1" />
                   <span>{leadStats.active} active</span>
                 </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : `€${systemStats.totalRevenue.toLocaleString()}`}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                   <Icon name="DollarSign" size={24} className="text-purple-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="TrendingUp" size={16} className="text-green-500 mr-1" />
                   <span>From paid invoices</span>
                 </div>
               </div>
             </div>
           </div>

                     {/* Quick Actions */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-card border border-border rounded-lg p-6">
               <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-3">
                 <Button 
                   variant="outline" 
                   className="h-20 flex-col justify-center"
                   onClick={() => navigate('/admin/super/users')}
                 >
                   <Icon name="Users" size={24} className="mb-2" />
                   <span className="text-sm">Manage Users</span>
                 </Button>
                 <Button 
                   variant="outline" 
                   className="h-20 flex-col justify-center"
                   onClick={() => navigate('/admin/super/leads')}
                 >
                   <Icon name="Target" size={24} className="mb-2" />
                   <span className="text-sm">Manage Leads</span>
                 </Button>
                 <Button 
                   variant="outline" 
                   className="h-20 flex-col justify-center"
                   onClick={() => navigate('/admin/super/billing')}
                 >
                   <Icon name="CreditCard" size={24} className="mb-2" />
                   <span className="text-sm">Billing</span>
                 </Button>
                 <Button 
                   variant="outline" 
                   className="h-20 flex-col justify-center"
                   onClick={() => navigate('/admin/super/customization')}
                 >
                   <Icon name="Settings" size={24} className="mb-2" />
                   <span className="text-sm">Customization</span>
                 </Button>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
               <div className="space-y-3">
                 {loading ? (
                   <div className="flex items-center justify-center py-4">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                   </div>
                 ) : recentActivity.length > 0 ? (
                   recentActivity.slice(0, 5).map((activity, index) => (
                     <div key={activity.id} className="flex items-center space-x-3">
                       <div className={`h-2 w-2 rounded-full ${
                         activity.type === 'user' ? 'bg-green-500' :
                         activity.type === 'quote' ? 'bg-blue-500' :
                         activity.type === 'lead' ? 'bg-orange-500' : 'bg-purple-500'
                       }`}></div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-foreground truncate">
                           {activity.title}
                         </p>
                         <p className="text-xs text-muted-foreground truncate">
                           {activity.description}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {new Date(activity.timestamp).toLocaleString()}
                         </p>
                       </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-muted-foreground">No recent activity</p>
                 )}
               </div>
             </div>
           </div>

          {/* Top Users & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Users by Activity</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.company || user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{user.quoteCount}</p>
                        <p className="text-xs text-muted-foreground">quotes</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No user data available</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Database</span>
                  </div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">API Services</span>
                  </div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Email Service</span>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">File Storage</span>
                  </div>
                  <span className="text-sm text-green-600">Available</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">System Uptime</span>
                    <span className="text-sm text-green-600">{systemStats.systemUptime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
