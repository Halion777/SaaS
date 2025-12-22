import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import PermissionGuard from '../../components/PermissionGuard';
import MetricsCard from './components/MetricsCard';
import QuoteChart from './components/QuoteChart';
import TaskList from './components/TaskList';
import RecentQuotes from './components/RecentQuotes';
import TopClients from './components/TopClients';
import QuickActions from './components/QuickActions';
import UpcomingEvents from './components/UpcomingEvents';
import RecentActivity from './components/RecentActivity';
import SponsoredBanner from './components/SponsoredBanner';
import DashboardTour from './components/DashboardTour';
import InvoiceOverviewWidget from './components/InvoiceOverviewWidget';
import PeppolWidget from './components/PeppolWidget';
import DashboardPersonalization from './components/DashboardPersonalization';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { fetchQuotes } from '../../services/quotesService';
import InvoiceService from '../../services/invoiceService';
import ExpenseInvoicesService from '../../services/expenseInvoicesService';
import { fetchClients } from '../../services/clientsService';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOffset, setSidebarOffset] = useState(288); // Default sidebar width
  const [runTour, setRunTour] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({
    metricsCards: true,
    invoiceOverview: true,
    recentQuotes: true,
    topClients: true,
    taskList: true,
    quickActions: true,
    peppolWidget: true,
    sponsoredBanner: true,
    upcomingEvents: true,
    recentActivity: true
  });
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true); // Default to true to avoid flash
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: null,
    quotes: [],
    clients: [],
    invoices: [],
    invoiceStats: null,
    expenseInvoices: null,
    loading: true
  });
  const hasLoadedData = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check sidebar state for layout adjustment
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    setSidebarOffset(isCollapsed ? 64 : 288); // 64px for collapsed, 288px (72*4) for expanded
    
    // Listen for sidebar collapse/expand events
    const handleStorage = (e) => {
      if (e.key === 'sidebar-collapsed') {
        const isCollapsed = JSON.parse(e.newValue);
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    // Debounced resize handler to prevent excessive re-renders
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        setIsMobile(mobile);
        setIsTablet(tablet);
        
        if (mobile) {
          setSidebarOffset(0);
        } else if (tablet) {
          // On tablet, sidebar auto-closes after navigation, so always use collapsed width
          // But account for wider collapsed sidebar on tablet (80px instead of 64px)
          setSidebarOffset(80);
        } else {
          // On desktop, check sidebar state
          const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
          setSidebarOffset(isCollapsed ? 64 : 288);
        }
      }, 150); // Debounce resize events
    };
    
    // Initial check
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
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []); // Empty dependency array - only run once on mount

  const formatTime = (date) => {
    const locale = i18n.language || 'fr';
    return date.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const locale = i18n.language || 'fr';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const startTour = () => {
    setRunTour(true);
  };

  const endTour = () => {
    setRunTour(false);
    // Save that the user has seen the tour
    localStorage.setItem('dashboard-tour-completed', 'true');
  };

  // Load widget settings on component mount
  useEffect(() => {
    const loadWidgetSettings = () => {
      try {
        const savedSettings = localStorage.getItem('dashboard-widget-settings');
        if (savedSettings) {
          setWidgetSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading widget settings:', error);
      }
    };
    loadWidgetSettings();
  }, []);

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user?.id) {
        setCheckingVerification(false);
        return;
      }

      try {
        // Check if banner was dismissed
        const dismissed = localStorage.getItem('email-verification-banner-dismissed');
        if (dismissed === 'true') {
          setBannerDismissed(true);
          setCheckingVerification(false);
          return;
        }

        // Check email verification status from public.users
        const { data, error } = await supabase
          .from('users')
          .select('email_verified')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking email verification:', error);
          setCheckingVerification(false);
          return;
        }

        setEmailVerified(data?.email_verified || false);
        setCheckingVerification(false);
      } catch (error) {
        console.error('Error in checkEmailVerification:', error);
        setCheckingVerification(false);
      }
    };

    checkEmailVerification();
  }, [user]);

  const handleWidgetSettingsSave = (newSettings) => {
    setWidgetSettings(newSettings);
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('email-verification-banner-dismissed', 'true');
  };

  const handleGoToSettings = () => {
    navigate('/dashboard');
    // Dispatch event to open account settings
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-account-settings'));
    }, 100);
  };

  // Fetch dashboard data - only load once when user.id is available
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      // Prevent reloading if data was already loaded for this user
      if (hasLoadedData.current) return;
      
      try {
        hasLoadedData.current = true;
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch all data in parallel
        const [quotesResult, clientsResult, invoicesResult, expenseInvoicesResult] = await Promise.all([
          fetchQuotes(user.id),
          fetchClients(),
          InvoiceService.fetchInvoices(user.id),
          new ExpenseInvoicesService().getExpenseInvoices()
        ]);

        // Process quotes data
        const quotes = quotesResult.data || [];
        
        // Calculate dates for current and previous periods
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Calculate quotes this month
        const quotesThisMonth = quotes.filter(q => new Date(q.created_at) >= firstDayOfMonth).length;
        
        // Calculate quotes last month for growth comparison
        const quotesLastMonth = quotes.filter(q => {
          const quoteDate = new Date(q.created_at);
          return quoteDate >= firstDayOfLastMonth && quoteDate <= lastDayOfLastMonth;
        }).length;
        
        // Calculate growth percentage for quotes
        const quotesGrowth = quotesLastMonth > 0 
          ? Math.round(((quotesThisMonth - quotesLastMonth) / quotesLastMonth) * 100)
          : (quotesThisMonth > 0 ? 100 : 0);
        
        // Calculate signature rate (accepted / sent)
        const sentQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'rejected').length;
        const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
        const signatureRate = sentQuotes > 0 ? Math.round((acceptedQuotes / sentQuotes) * 100) : 0;

        // Calculate monthly turnover from invoices
        const invoices = invoicesResult.success ? invoicesResult.data : [];
        const invoicesThisMonth = invoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= firstDayOfMonth;
        });
        const monthlyTurnover = invoicesThisMonth.reduce((sum, inv) => sum + (parseFloat(inv.final_amount || inv.amount || 0)), 0);
        
        // Calculate last month's turnover for growth comparison
        const invoicesLastMonth = invoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= firstDayOfLastMonth && invDate <= lastDayOfLastMonth;
        });
        const lastMonthTurnover = invoicesLastMonth.reduce((sum, inv) => sum + (parseFloat(inv.final_amount || inv.amount || 0)), 0);
        
        // Calculate growth percentage for turnover
        const turnoverGrowth = lastMonthTurnover > 0
          ? Math.round(((monthlyTurnover - lastMonthTurnover) / lastMonthTurnover) * 100)
          : (monthlyTurnover > 0 ? 100 : 0);

        // Process clients data
        const clients = clientsResult.data || [];
        
        // Calculate total clients and clients from last month for growth
        const totalClients = clients.length;
        const clientsLastMonth = clients.filter(c => {
          const clientDate = new Date(c.created_at);
          return clientDate >= firstDayOfLastMonth && clientDate <= lastDayOfLastMonth;
        }).length;
        
        // Calculate growth percentage for clients (comparing new clients this month vs last month)
        const newClientsThisMonth = clients.filter(c => {
          const clientDate = new Date(c.created_at);
          return clientDate >= firstDayOfMonth;
        }).length;
        const clientsGrowth = clientsLastMonth > 0
          ? Math.round(((newClientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)
          : (newClientsThisMonth > 0 ? 100 : 0);
        
        // Process expense invoices
        const expenseInvoices = expenseInvoicesResult.success ? expenseInvoicesResult.data : [];
        const expenseInvoicesStats = {
          totalExpenses: expenseInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount || 0)), 0),
          paidExpenses: expenseInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.amount || 0)), 0),
          outstandingAmount: expenseInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').reduce((sum, inv) => sum + (parseFloat(inv.amount || 0)), 0),
          overdueCount: expenseInvoices.filter(inv => inv.status === 'overdue').length
        };

        // Calculate invoice stats
        const invoiceStats = {
          totalRevenue: invoices.reduce((sum, inv) => sum + (parseFloat(inv.final_amount || inv.amount || 0)), 0),
          paidRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.final_amount || inv.amount || 0)), 0),
          outstandingAmount: invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').reduce((sum, inv) => sum + (parseFloat(inv.final_amount || inv.amount || 0)), 0),
          overdueCount: invoices.filter(inv => inv.status === 'overdue').length
        };
        
        // Calculate overdue invoices count
        const overdueInvoices = invoices.filter(inv => {
          if (inv.status === 'paid') return false;
          const dueDate = new Date(inv.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length;
        
        // Calculate overdue invoices from last month for growth comparison
        const overdueInvoicesLastMonth = invoices.filter(inv => {
          if (inv.status === 'paid') return false;
          const dueDate = new Date(inv.due_date);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          lastMonthStart.setHours(0, 0, 0, 0);
          lastMonthEnd.setHours(23, 59, 59, 999);
          dueDate.setHours(0, 0, 0, 0);
          // Check if invoice was overdue at the end of last month
          return dueDate < lastMonthEnd && dueDate >= lastMonthStart;
        }).length;
        
        // Calculate growth percentage for overdue invoices (negative is good, positive is bad)
        const overdueGrowth = overdueInvoicesLastMonth > 0
          ? Math.round(((overdueInvoices - overdueInvoicesLastMonth) / overdueInvoicesLastMonth) * 100)
          : (overdueInvoices > 0 ? 100 : 0);

        setDashboardData({
          metrics: {
            quotesThisMonth,
            quotesGrowth,
            totalClients,
            clientsGrowth,
            monthlyTurnover,
            turnoverGrowth,
            overdueInvoices,
            overdueGrowth
          },
          quotes: quotes.slice(0, 10), // Recent 10 quotes
          clients: clients.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)).slice(0, 4), // Top 4 clients by revenue
          invoices: invoices, // Full invoices array for RecentActivity widget
          invoiceStats: invoiceStats, // Invoice statistics
          expenseInvoices: expenseInvoicesStats,
          loading: false
        });
        
        // Dispatch event to signal page loading is complete
        window.dispatchEvent(new CustomEvent('page-loaded'));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
        // Dispatch event even on error so profile can show
        window.dispatchEvent(new CustomEvent('page-loaded'));
      }
    };

    // Reset the flag when user changes
    if (user?.id) {
      hasLoadedData.current = false;
      loadDashboardData();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language || 'fr', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const metricsData = dashboardData.loading ? [
    {
      title: t('dashboard.metrics.quotesThisMonth'),
      value: '...',
      change: null,
      changeType: null,
      icon: 'FileText',
      color: 'primary'
    },
    {
      title: t('dashboard.metrics.totalClients'),
      value: '...',
      change: null,
      changeType: null,
      icon: 'Users',
      color: 'success'
    },
    {
      title: t('dashboard.metrics.monthlyTurnover'),
      value: '...',
      change: null,
      changeType: null,
      icon: 'Euro',
      color: 'warning'
    },
    {
      title: t('dashboard.metrics.overdueInvoices'),
      value: '...',
      change: null,
      changeType: null,
      icon: 'AlertCircle',
      color: 'error'
    }
  ] : (dashboardData.metrics ? [
    {
      title: t('dashboard.metrics.quotesThisMonth'),
      value: dashboardData.metrics.quotesThisMonth.toString(),
      change: `${dashboardData.metrics.quotesGrowth >= 0 ? '+' : ''}${dashboardData.metrics.quotesGrowth}%`,
      changeType: dashboardData.metrics.quotesGrowth >= 0 ? 'positive' : 'negative',
      icon: 'FileText',
      color: 'primary'
    },
    {
      title: t('dashboard.metrics.totalClients'),
      value: dashboardData.metrics.totalClients.toString(),
      change: `${dashboardData.metrics.clientsGrowth >= 0 ? '+' : ''}${dashboardData.metrics.clientsGrowth}%`,
      changeType: dashboardData.metrics.clientsGrowth >= 0 ? 'positive' : 'negative',
      icon: 'Users',
      color: 'success'
    },
    {
      title: t('dashboard.metrics.monthlyTurnover'),
      value: formatCurrency(dashboardData.metrics.monthlyTurnover),
      change: `${dashboardData.metrics.turnoverGrowth >= 0 ? '+' : ''}${dashboardData.metrics.turnoverGrowth}%`,
      changeType: dashboardData.metrics.turnoverGrowth >= 0 ? 'positive' : 'negative',
      icon: 'Euro',
      color: 'warning'
    },
    {
      title: t('dashboard.metrics.overdueInvoices'),
      value: dashboardData.metrics.overdueInvoices.toString(),
      change: `${dashboardData.metrics.overdueGrowth >= 0 ? '+' : ''}${dashboardData.metrics.overdueGrowth}%`,
      // For overdue invoices, negative growth is good (fewer overdue), positive is bad (more overdue)
      changeType: dashboardData.metrics.overdueGrowth <= 0 ? 'positive' : 'negative',
      icon: 'AlertCircle',
      color: dashboardData.metrics.overdueInvoices > 0 ? 'error' : 'success'
    }
  ] : []);


  return (
    <PermissionGuard module="dashboard" requiredPermission="view_only">
    <div className="min-h-screen bg-background">
      {/* Tour Component */}
      <DashboardTour run={runTour} onFinish={endTour} />
      
      {/* Sidebar */}
      <MainSidebar />
      
      {/* Main Content */}
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
          <div className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center">
                <Icon name="LayoutDashboard" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('dashboard.header.title')}</h1>
              </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('dashboard.header.subtitle')} • {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
            </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                    size="icon"
                iconName="Settings" 
                iconPosition="left"
                onClick={() => setIsPersonalizationOpen(true)}
                    className="dashboard-personalization-button sm:h-9 sm:px-3 sm:w-auto"
              >
                    <span className="hidden sm:inline">{t('dashboard.buttons.personalize')}</span>
              </Button>
              <Button 
                variant="outline" 
                    size="icon"
                iconName="BarChart3" 
                iconPosition="left"
                onClick={() => window.location.href = '/analytics-dashboard'}
                    className="dashboard-analytics-button sm:h-9 sm:px-3 sm:w-auto"
              >
                    <span className="hidden sm:inline">{t('dashboard.buttons.detailedAnalytics')}</span>
              </Button>
                </div>
              <Button 
                variant="default" 
                  size="icon"
                iconName="Plus" 
                iconPosition="left"
                onClick={() => navigate('/quote-creation')}
                  className="dashboard-new-quote-button sm:h-9 sm:px-3 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white [&>svg]:mx-auto sm:[&>svg]:mx-0"
              >
                  <span className="hidden sm:inline">{t('dashboard.buttons.newQuote')}</span>
              </Button>
              </div>
            </div>
          </div>

          {/* Email Verification Banner */}
          {!checkingVerification && !emailVerified && !bannerDismissed && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0">
                <Icon name="Mail" size={20} className="text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  {t('dashboard.emailVerification.title')}
                </h3>
                <p className="text-sm text-yellow-800">
                  {t('dashboard.emailVerification.description')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGoToSettings}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 whitespace-nowrap"
                >
                  {t('dashboard.emailVerification.verifyNow')}
                </Button>
                <button
                  onClick={handleDismissBanner}
                  className="p-1.5 hover:bg-yellow-100 rounded-md transition-colors"
                  aria-label="Dismiss"
                >
                  <Icon name="X" size={16} className="text-yellow-600" />
                </button>
              </div>
            </div>
          )}

          {/* Sponsored Banner - Moved to top */}
          {widgetSettings.sponsoredBanner && (
            <div className="dashboard-sponsored-banner mb-4 sm:mb-6 mt-4 sm:mt-6">
              <SponsoredBanner />
            </div>
          )}

          {/* Metrics Cards */}
          {widgetSettings.metricsCards && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 dashboard-metrics">
              {metricsData.map((metric, index) => (
                <MetricsCard key={index} {...metric} />
              ))}
            </div>
          )}

          {/* Invoice Overview Widget */}
          {widgetSettings.invoiceOverview && (
            <div className="mb-4 sm:mb-6">
              <InvoiceOverviewWidget 
                invoiceData={dashboardData.invoiceStats}
                expenseInvoiceData={dashboardData.expenseInvoices}
                loading={dashboardData.loading}
              />
            </div>
          )}

          {/* Peppol Widget */}
          {widgetSettings.peppolWidget && (
            <div className="mb-4 sm:mb-6">
              <PeppolWidget />
            </div>
          )}

          {/* Main Dashboard Content - Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Full width on mobile, 2/3 on tablet/desktop */}
            <div className="md:col-span-2 space-y-4 sm:space-y-6">
              {/* Quote Chart */}
              <div className="dashboard-chart">
                <QuoteChart quotes={dashboardData.quotes} loading={dashboardData.loading} />
              </div>
              
              {/* Recent Quotes */}
              {widgetSettings.recentQuotes && (
                <div className="dashboard-recent-quotes">
                  <RecentQuotes quotes={dashboardData.quotes} loading={dashboardData.loading} />
                </div>
              )}
              
              {/* Quick Actions */}
              {widgetSettings.quickActions && (
                <div className="dashboard-quick-actions">
                  <QuickActions />
                </div>
              )}
            </div>
            
            {/* Right Column - Full width on mobile, 1/3 on tablet/desktop */}
            <div className="space-y-4 sm:space-y-6">
              {/* Tasks and Alerts */}
              {widgetSettings.taskList && (
                <div className="dashboard-tasks">
                  <TaskList />
                </div>
              )}
              
              {/* Top Clients */}
              {widgetSettings.topClients && (
                <div className="dashboard-top-clients">
                  <TopClients clients={dashboardData.clients} loading={dashboardData.loading} />
                </div>
              )}

              {/* Upcoming Events */}
              {widgetSettings.upcomingEvents && (
                <div className="dashboard-upcoming-events">
                  <UpcomingEvents loading={dashboardData.loading} />
                </div>
              )}

              {/* Recent Activity */}
              {widgetSettings.recentActivity && (
                <div className="dashboard-recent-activity">
                  <RecentActivity 
                    quotes={dashboardData.quotes} 
                    invoices={dashboardData.invoices || []} 
                    loading={dashboardData.loading} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Floating Guide Button */}
          <button
            onClick={startTour}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            aria-label={t('dashboard.buttons.guidedTour')}
            title={t('dashboard.buttons.guidedTour')}
          >
            <Icon 
              name="Play" 
              size={20} 
              className="sm:w-6 sm:h-6 ml-0.5 group-hover:scale-110 transition-transform duration-300" 
              color="white" 
            />
          </button>
        </div>
      </main>

      {/* Dashboard Personalization Modal */}
      <DashboardPersonalization
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        onSave={handleWidgetSettingsSave}
      />
    </div>
    </PermissionGuard>
  );
};

export default Dashboard;