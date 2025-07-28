import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
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
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
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

  const handleWidgetSettingsSave = (newSettings) => {
    setWidgetSettings(newSettings);
  };

  const metricsData = [
    {
      title: 'Devis ce mois',
      value: '67',
      change: '+12%',
      changeType: 'positive',
      icon: 'FileText',
      color: 'primary'
    },
    {
      title: 'Taux de signature',
      value: '78%',
      change: '+8%',
      changeType: 'positive',
      icon: 'TrendingUp',
      color: 'success'
    },
    {
      title: 'CA du mois',
      value: '24.850€',
      change: '+15%',
      changeType: 'positive',
      icon: 'Euro',
      color: 'warning'
    },
    {
      title: 'Gain IA',
      value: '+40%',
      change: 'Nouveau',
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
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Aperçu Rapide</h1>
              </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Vue d'ensemble de votre activité • {formatDate(currentTime)} • {formatTime(currentTime)}
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
                    <span className="hidden sm:inline">Personnaliser</span>
              </Button>
              <Button 
                variant="outline" 
                    size="icon"
                iconName="BarChart3" 
                iconPosition="left"
                onClick={() => window.location.href = '/analytics-dashboard'}
                    className="dashboard-analytics-button sm:h-9 sm:px-3 sm:w-auto"
              >
                    <span className="hidden sm:inline">Analyses détaillées</span>
              </Button>
                </div>
              <Button 
                variant="default" 
                  size="icon"
                iconName="Plus" 
                iconPosition="left"
                  className="dashboard-new-quote-button sm:h-9 sm:px-3 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white [&>svg]:mx-auto sm:[&>svg]:mx-0"
              >
                  <span className="hidden sm:inline">Nouveau devis</span>
              </Button>
              </div>
            </div>
          </div>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-4 sm:p-6 shadow-md dashboard-welcome mt-4 sm:mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white">Bienvenue sur votre tableau de bord</h2>
                <p className="text-white/90 text-sm sm:text-base">Voici un aperçu rapide de votre activité et des actions importantes</p>
              </div>
              <div className="w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 w-full md:w-auto"
                  onClick={startTour}
                >
                  <span className="flex items-center justify-center">
                    <Icon name="Play" size={16} className="mr-2" />
                    <span className="hidden sm:inline">Visite guidée</span>
                    <span className="sm:hidden">Visite</span>
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
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Insights IA</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/analytics-dashboard'}
                  className="w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center">
                    <span className="hidden sm:inline">Voir l'analyse complète</span>
                    <span className="sm:hidden">Voir plus</span>
                    <Icon name="ArrowRight" size={16} className="ml-2" />
                  </span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">Optimisation des prix</h4>
                  <p className="text-xs text-muted-foreground">
                    Augmentez vos tarifs de 8% selon l'analyse du marché pour optimiser votre rentabilité
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-success/5 border border-success/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">Meilleur jour de conversion</h4>
                  <p className="text-xs text-muted-foreground">
                    Les mardis et jeudis ont un taux de conversion 23% plus élevé que les autres jours
                  </p>
                </div>
                <div className="p-3 sm:p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">Opportunité de relance</h4>
                  <p className="text-xs text-muted-foreground">
                    5 devis non signés depuis plus de 7 jours pourraient être convertis avec une relance
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