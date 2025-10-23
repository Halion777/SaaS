import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import MetricsCard from './components/MetricsCard';
import QuoteChart from './components/QuoteChart';
import TaskList from './components/TaskList';
import AIAlerts from './components/AIAlerts';
import RecentQuotes from './components/RecentQuotes';
import TopClients from './components/TopClients';
import QuickActions from './components/QuickActions';
import SponsoredBanner from './components/SponsoredBanner';
import AIPerformanceWidget from './components/AIPerformanceWidget';
import DashboardTour from './components/DashboardTour';
import InvoiceOverviewWidget from './components/InvoiceOverviewWidget';
import PeppolWidget from './components/PeppolWidget';
import DashboardPersonalization from './components/DashboardPersonalization';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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
    aiPerformance: true,
    peppolWidget: true,
    sponsoredBanner: true,
    aiAlerts: true
  });
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true); // Default to true to avoid flash
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

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
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    // Check for mobile and tablet
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
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

  const metricsData = [
    {
      title: t('dashboard.metrics.quotesThisMonth'),
      value: '67',
      change: t('dashboard.metrics.changeTexts.positive', { value: 12 }),
      changeType: 'positive',
      icon: 'FileText',
      color: 'primary'
    },
    {
      title: t('dashboard.metrics.signatureRate'),
      value: '78%',
      change: t('dashboard.metrics.changeTexts.positive', { value: 8 }),
      changeType: 'positive',
      icon: 'TrendingUp',
      color: 'success'
    },
    {
      title: t('dashboard.metrics.monthlyTurnover'),
      value: '24.850€',
      change: t('dashboard.metrics.changeTexts.positive', { value: 15 }),
      changeType: 'positive',
      icon: 'Euro',
      color: 'warning'
    },
    {
      title: t('dashboard.metrics.aiGain'),
      value: '+40%',
      change: t('dashboard.metrics.changeTexts.new'),
      changeType: 'positive',
      icon: 'Brain',
      color: 'primary'
    }
  ];

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
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

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-4 sm:p-6 shadow-md dashboard-welcome mt-4 sm:mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white">{t('dashboard.welcomeBanner.title')}</h2>
                <p className="text-white/90 text-sm sm:text-base">{t('dashboard.welcomeBanner.subtitle')}</p>
              </div>
              <div className="w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 w-full md:w-auto"
                  onClick={startTour}
                >
                  <span className="flex items-center justify-center">
                    <Icon name="Play" size={16} className="mr-2" />
                    <span className="hidden sm:inline">{t('dashboard.buttons.guidedTour')}</span>
                    <span className="sm:hidden">{t('dashboard.buttons.guidedTour')}</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>

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
              <InvoiceOverviewWidget />
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
                <QuoteChart />
              </div>
              
              {/* Recent Quotes */}
              {widgetSettings.recentQuotes && (
                <div className="dashboard-recent-quotes">
                  <RecentQuotes />
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
              {widgetSettings.aiAlerts && (
                <div className="dashboard-ai-alerts">
                  <AIAlerts />
                </div>
              )}
              
              {/* Top Clients */}
              {widgetSettings.topClients && (
                <div className="dashboard-top-clients">
                  <TopClients />
                </div>
              )}
            </div>
          </div>
          
          {/* AI Performance Insights */}
          {widgetSettings.aiPerformance && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm dashboard-ai-insights">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Icon name="Brain" size={16} className="sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.aiInsights.title')}</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/analytics-dashboard'}
                  className="w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center">
                    <span className="hidden sm:inline">{t('dashboard.aiInsights.viewFullAnalysis')}</span>
                    <span className="sm:hidden">{t('dashboard.aiInsights.viewFullAnalysis')}</span>
                    <Icon name="ArrowRight" size={16} className="ml-2" />
                  </span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('dashboard.aiInsights.priceOptimization.title')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.aiInsights.priceOptimization.description')}
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-success/5 border border-success/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('dashboard.aiInsights.bestConversionDay.title')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.aiInsights.bestConversionDay.description')}
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('dashboard.aiInsights.followUpOpportunity.title')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.aiInsights.followUpOpportunity.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sponsored Banner */}
          {widgetSettings.sponsoredBanner && (
            <div className="dashboard-sponsored-banner">
              <SponsoredBanner />
            </div>
                    )}
        </div>
      </main>

      {/* Dashboard Personalization Modal */}
      <DashboardPersonalization
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        onSave={handleWidgetSettingsSave}
      />
    </div>
  );
};

export default Dashboard;