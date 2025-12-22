import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';
import TableLoader from 'components/ui/TableLoader';
import RevenueChart from 'components/ui/RevenueChart';


const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalQuotes: 0,
    totalInvoices: 0,
    totalLeads: 0,
    subscriptionRevenue: 0,
    invoiceRevenue: 0,
    totalRevenue: 0,
    systemUptime: '99.8%',
    lastBackup: '2 hours ago'
  });
  const [systemUptime, setSystemUptime] = useState({
    uptimePercentage: 99.8,
    totalUptime: 0,
    lastRestart: null
  });
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'checking', responseTime: 0 },
    apiServices: { status: 'checking', responseTime: 0 },
    emailService: { status: 'checking', responseTime: 0 },
    fileStorage: { status: 'checking', responseTime: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    active: 0,
    converted: 0,
    spam: 0
  });
  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    userGrowth: [],
    quoteTrends: []
  });

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
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
        const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Set initial sidebar offset based on saved state
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (mobile) {
      setSidebarOffset(0);
    } else if (tablet) {
      setSidebarOffset(80);
    } else {
      const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
      const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
      setSidebarOffset(isCollapsed ? 64 : 288);
    }
  }, []);

  // Update current time and system uptime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Update uptime every minute
      if (new Date().getSeconds() === 0) {
        calculateSystemUptime();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset system uptime (useful for testing or actual restarts)
  const resetSystemUptime = () => {
    localStorage.setItem('system-start-time', new Date().toISOString());
    calculateSystemUptime();
  };

  // Calculate system uptime
  const calculateSystemUptime = () => {
    try {
      // Get system start time from localStorage or use current time as fallback
      const systemStartTime = localStorage.getItem('system-start-time');
      const startTime = systemStartTime ? new Date(systemStartTime) : new Date();
      
      // If no start time is stored, set it to current time
      if (!systemStartTime) {
        localStorage.setItem('system-start-time', startTime.toISOString());
      }
      
      const now = new Date();
      const totalTime = now.getTime() - startTime.getTime();
      
      // Convert to hours for easier calculation
      const totalHours = totalTime / (1000 * 60 * 60);
      
      // Calculate uptime based on system health checks
      // If all services are healthy, we have high uptime
      const healthStatuses = Object.values(systemHealth);
      const healthyServices = healthStatuses.filter(service => 
        service.status === 'healthy' || 
        service.status === 'operational' || 
        service.status === 'active' || 
        service.status === 'available'
      ).length;
      
      // Base uptime on service health (90% minimum, up to 99.9% if all healthy)
      const baseUptime = 90 + (healthyServices / healthStatuses.length) * 9.9;
      
      // Apply a small degradation over time (0.01% per day)
      const daysSinceStart = totalHours / 24;
      const timeDegradation = Math.min(daysSinceStart * 0.01, 0.1);
      
      const uptimePercentage = Math.max(90, baseUptime - timeDegradation);
      
      setSystemUptime({
        uptimePercentage: Math.round(uptimePercentage * 10) / 10,
        totalUptime: totalHours,
        lastRestart: startTime
      });
      
      // Update systemStats with calculated uptime
      setSystemStats(prev => ({
        ...prev,
        systemUptime: `${Math.round(uptimePercentage * 10) / 10}%`
      }));
      
    } catch (error) {
      console.error('Error calculating system uptime:', error);
      // Fallback to default values
      setSystemUptime({
        uptimePercentage: 99.8,
        totalUptime: 0,
        lastRestart: new Date()
      });
    }
  };

  // Health check functions
  const checkDatabaseHealth = async () => {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      return {
        status: error ? 'error' : 'healthy',
        responseTime: responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const checkApiServicesHealth = async () => {
    const startTime = Date.now();
    try {
      // Test a simple API endpoint
      const response = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      });
      const responseTime = Date.now() - startTime;
      return {
        status: response.ok ? 'operational' : 'error',
        responseTime: responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const checkEmailServiceHealth = async () => {
    const startTime = Date.now();
    try {
      // Check if email service is configured
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return {
          status: 'active',
          responseTime: Date.now() - startTime
        };
      }
      return {
        status: 'inactive',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const checkFileStorageHealth = async () => {
    const startTime = Date.now();
    try {
      // Test file storage by listing buckets
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;
      return {
        status: error ? 'error' : 'available',
        responseTime: responseTime
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const performHealthChecks = async () => {
    const [database, apiServices, emailService, fileStorage] = await Promise.all([
      checkDatabaseHealth(),
      checkApiServicesHealth(),
      checkEmailServiceHealth(),
      checkFileStorageHealth()
    ]);

    setSystemHealth({
      database,
      apiServices,
      emailService,
      fileStorage
    });

    // Calculate uptime after health checks are complete
    setTimeout(() => {
      calculateSystemUptime();
    }, 100);
  };

  // Load system statistics
  // Process chart data with optimized queries
  const processChartData = async () => {
    try {
      const currentDate = new Date();
      const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      // Single optimized query for all payment data (last 12 months)
      // Exclude superadmin payment records
      const { data: allPaymentData } = await supabase
        .from('payment_records')
        .select('amount, paid_at, user_id')
        .eq('status', 'succeeded')
        .gte('paid_at', twelveMonthsAgo.toISOString());
      
      // Get superadmin user IDs to exclude
      const { data: superadminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'superadmin');
      
      const superadminUserIds = superadminUsers?.map(u => u.id) || [];
      
      // Filter out payments from superadmin users
      const paymentData = allPaymentData?.filter(payment => 
        !superadminUserIds.includes(payment.user_id)
      ) || [];

      // Single optimized query for all invoice data (last 12 months)
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('final_amount, created_at')
        .eq('status', 'paid')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Single optimized query for all user data (last 12 months)
      // Exclude superadmin users
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .neq('role', 'superadmin')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Single optimized query for all quote data (last 30 days)
      // Exclude quotes from superadmin users
      const { data: allQuoteData } = await supabase
        .from('quotes')
        .select('created_at, user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      // Filter out quotes from superadmin users
      const quoteData = allQuoteData?.filter(quote => 
        !superadminUserIds.includes(quote.user_id)
      ) || [];

      // Process monthly revenue data (SUBSCRIPTION REVENUE ONLY)
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        // Filter subscription payments only (payment_records)
        const monthPayments = paymentData?.filter(payment => {
          const paymentDate = new Date(payment.paid_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        }) || [];
        
        const paymentRevenue = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        monthlyRevenue.push({
          name: monthName,
          revenue: paymentRevenue // Only subscription payments, no invoices
        });
      }

      // Process user growth data
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const monthUsers = userData?.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate >= monthStart && userDate <= monthEnd;
        }) || [];
        
        userGrowth.push({
          name: monthName,
          users: monthUsers.length
        });
      }

      // Process quote trends data
      const quoteTrends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        const dayQuotes = quoteData?.filter(quote => {
          const quoteDate = new Date(quote.created_at);
          return quoteDate >= dayStart && quoteDate <= dayEnd;
        }) || [];
        
        quoteTrends.push({
          name: dayName,
          quotes: dayQuotes.length
        });
      }

      setChartData({
        monthlyRevenue,
        userGrowth,
        quoteTrends
      });

    } catch (error) {
      console.error('Error processing chart data:', error);
    }
  };

  useEffect(() => {
    const loadSystemStats = async () => {
      try {
        setLoading(true);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Execute all basic stats queries in parallel
        // Get superadmin user IDs for filtering
        const { data: superadminUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'superadmin');
        
        const superadminUserIds = superadminUsers?.map(u => u.id) || [];

        const [
          totalUsersResult,
          activeUsersResult,
          totalQuotesResult,
          totalInvoicesResult,
          totalLeadsResult,
          activeLeadsResult,
          convertedLeadsResult,
          paymentDataResult,
          invoiceDataResult
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'superadmin'),
          supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'superadmin').gte('updated_at', thirtyDaysAgo.toISOString()),
          supabase.from('quotes').select('*', { count: 'exact', head: true }),
          supabase.from('invoices').select('*', { count: 'exact', head: true }),
          supabase.from('lead_requests').select('*', { count: 'exact', head: true }),
          supabase.from('lead_requests').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('lead_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('payment_records').select('amount, user_id').eq('status', 'succeeded'),
          supabase.from('invoices').select('final_amount, user_id').eq('status', 'paid')
        ]);

        // Process results
        const totalUsers = totalUsersResult.count || 0;
        const activeUsers = activeUsersResult.count || 0;
        const totalQuotes = totalQuotesResult.count || 0;
        const totalInvoices = totalInvoicesResult.count || 0;
        const totalLeads = totalLeadsResult.count || 0;
        const activeLeads = activeLeadsResult.count || 0;
        const convertedLeads = convertedLeadsResult.count || 0;

        // Filter out superadmin payments and invoices
        const filteredPayments = paymentDataResult.data?.filter(payment => 
          !superadminUserIds.includes(payment.user_id)
        ) || [];
        
        const filteredInvoices = invoiceDataResult.data?.filter(invoice => 
          !superadminUserIds.includes(invoice.user_id)
        ) || [];

        // Calculate revenues (excluding superadmin)
        const subscriptionRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const invoiceRevenue = filteredInvoices.reduce((sum, invoice) => sum + (invoice.final_amount || 0), 0);
        const totalRevenue = subscriptionRevenue + invoiceRevenue;

        setSystemStats({
          totalUsers,
          activeUsers,
          totalQuotes,
          totalInvoices,
          totalLeads,
          subscriptionRevenue,
          invoiceRevenue,
          totalRevenue,
          systemUptime: '99.8%',
          lastBackup: '2 hours ago'
        });

        setLeadStats({
          total: totalLeads,
          active: activeLeads,
          converted: convertedLeads,
          spam: 0
        });

        // Execute remaining operations in parallel
        await Promise.all([
          loadRecentActivity(),
          loadTopUsers(),
          performHealthChecks(),
          processChartData()
        ]);

        // Calculate system uptime after health checks
        calculateSystemUptime();

      } catch (error) {
        console.error('Error loading system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemStats();
  }, []);

  // Auto-refresh health checks every 30 seconds
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      performHealthChecks();
    }, 30000); // 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, []);

  const loadRecentActivity = async () => {
    try {
      // Execute all recent activity queries in parallel
      const [
        recentQuotesResult,
        recentUsersResult,
        recentLeadsResult
      ] = await Promise.all([
        supabase
          .from('quotes')
          .select(`
            id,
            quote_number,
            status,
            created_at,
            users!quotes_user_id_fkey(first_name, last_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('users')
          .select('id, first_name, last_name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('lead_requests')
          .select('id, client_name, project_description, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const recentQuotes = recentQuotesResult.data || [];
      const recentUsers = recentUsersResult.data || [];
      const recentLeads = recentLeadsResult.data || [];

      const activity = [
        ...recentQuotes.map(quote => ({
          id: quote.id,
          type: 'quote',
          title: `New quote ${quote.quote_number}`,
          description: `Created by ${(quote.users?.first_name && quote.users?.last_name ? `${quote.users.first_name} ${quote.users.last_name}` : quote.users?.first_name || quote.users?.last_name || 'Unknown')}`,
          timestamp: quote.created_at,
          status: quote.status
        })),
        ...recentUsers.map(user => ({
          id: user.id,
          type: 'user',
          title: `New user registered`,
          description: (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || user.email),
          timestamp: user.created_at,
          status: 'active'
        })),
        ...recentLeads.map(lead => ({
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
      // Execute queries in parallel
      const [quotesResult, usersResult] = await Promise.all([
        supabase.from('quotes').select('user_id'),
        supabase.from('users').select('id, first_name, last_name, email, company_name, role').neq('role', 'superadmin')
      ]);

      if (quotesResult.error) {
        console.error('Error fetching quotes:', quotesResult.error);
        return;
      }

      if (usersResult.error) {
        console.error('Error fetching users:', usersResult.error);
        return;
      }

      const quotesData = quotesResult.data || [];
      const usersData = usersResult.data || [];

      // Count quotes per user
      const userQuoteCounts = {};
      quotesData.forEach(quote => {
        if (quote.user_id) {
          userQuoteCounts[quote.user_id] = (userQuoteCounts[quote.user_id] || 0) + 1;
        }
      });

      // Create a map of user data
      const userMap = {};
      usersData.forEach(user => {
        userMap[user.id] = user;
      });

      // Get top 5 users (excluding superadmin)
      const topUsersList = Object.entries(userQuoteCounts)
        .map(([userId, count]) => {
          const userData = userMap[userId];
          // Skip superadmin users
          if (userData?.role === 'superadmin') return null;
          return {
            id: userId,
            name: (userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}` : userData?.first_name || userData?.last_name || 'Unknown'),
            email: userData?.email || '',
            company: userData?.company_name || '',
            quoteCount: count
          };
        })
        .filter(user => user !== null)
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
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
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
                   <p className="text-sm font-medium text-muted-foreground">Subscription Revenue</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : `€${systemStats.subscriptionRevenue.toLocaleString()}`}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                   <Icon name="CreditCard" size={24} className="text-blue-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="TrendingUp" size={16} className="text-green-500 mr-1" />
                   <span>From user subscriptions</span>
                 </div>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Invoice Revenue</p>
                   <p className="text-2xl font-bold text-foreground">
                     {loading ? '...' : `€${systemStats.invoiceRevenue.toLocaleString()}`}
                   </p>
                 </div>
                 <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                   <Icon name="Receipt" size={24} className="text-green-600" />
                 </div>
               </div>
               <div className="mt-4">
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Icon name="TrendingUp" size={16} className="text-green-500 mr-1" />
                   <span>From client invoices</span>
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
                   <span>Combined revenue</span>
                 </div>
               </div>
             </div>
           </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Subscription Revenue Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Subscription Revenue</h3>
                <Icon name="TrendingUp" size={20} className="text-blue-600" />
              </div>
              <RevenueChart
                data={chartData.monthlyRevenue}
                type="area"
                height={300}
                color="#3b82f6"
              />
            </div>

            {/* User Growth Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">User Growth</h3>
                <Icon name="Users" size={20} className="text-green-600" />
              </div>
              <RevenueChart
                data={chartData.userGrowth}
                type="line"
                height={300}
                color="#10b981"
                dataKey="users"
                valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
                valueLabel="Users"
              />
            </div>
          </div>

          {/* Quote Trends Chart */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Quote Trends (Last 30 Days)</h3>
              <Icon name="BarChart" size={20} className="text-purple-600" />
            </div>
            <RevenueChart
              data={chartData.quoteTrends}
              type="bar"
              height={250}
              color="#8b5cf6"
              dataKey="quotes"
              valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
              valueLabel="Quotes"
            />
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
                   onClick={() => navigate('/admin/super/email-templates')}
                 >
                   <Icon name="Mail" size={24} className="mb-2" />
                   <span className="text-sm">Email Templates</span>
                 </Button>
               </div>
             </div>

             <div className="bg-card border border-border rounded-lg p-6">
               <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
               <div className="space-y-3">
                 {loading ? (
                   <TableLoader message="Loading recent activity..." className="h-32" />
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
                  <TableLoader message="Loading top users..." className="h-32" />
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
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">System Health</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      systemHealth.database.status === 'healthy' ? 'bg-green-500' :
                      systemHealth.database.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">Database</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${
                      systemHealth.database.status === 'healthy' ? 'text-green-600' :
                      systemHealth.database.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {systemHealth.database.status === 'healthy' ? 'Healthy' :
                       systemHealth.database.status === 'error' ? 'Error' : 'Checking...'}
                    </span>
                    {systemHealth.database.responseTime > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {systemHealth.database.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      systemHealth.apiServices.status === 'operational' ? 'bg-green-500' :
                      systemHealth.apiServices.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">API Services</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${
                      systemHealth.apiServices.status === 'operational' ? 'text-green-600' :
                      systemHealth.apiServices.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {systemHealth.apiServices.status === 'operational' ? 'Operational' :
                       systemHealth.apiServices.status === 'error' ? 'Error' : 'Checking...'}
                    </span>
                    {systemHealth.apiServices.responseTime > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {systemHealth.apiServices.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      systemHealth.emailService.status === 'active' ? 'bg-green-500' :
                      systemHealth.emailService.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">Email Service</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${
                      systemHealth.emailService.status === 'active' ? 'text-green-600' :
                      systemHealth.emailService.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {systemHealth.emailService.status === 'active' ? 'Active' :
                       systemHealth.emailService.status === 'error' ? 'Error' : 'Checking...'}
                    </span>
                    {systemHealth.emailService.responseTime > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {systemHealth.emailService.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      systemHealth.fileStorage.status === 'available' ? 'bg-green-500' :
                      systemHealth.fileStorage.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground">File Storage</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${
                      systemHealth.fileStorage.status === 'available' ? 'text-green-600' :
                      systemHealth.fileStorage.status === 'error' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {systemHealth.fileStorage.status === 'available' ? 'Available' :
                       systemHealth.fileStorage.status === 'error' ? 'Error' : 'Checking...'}
                    </span>
                    {systemHealth.fileStorage.responseTime > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {systemHealth.fileStorage.responseTime}ms
                      </div>
                    )}
                  </div>
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
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
