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

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOffset, setSidebarOffset] = useState(288); // Default sidebar width
  const [runTour, setRunTour] = useState(false);

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
    
    window.addEventListener('storage', handleStorage);
    
    // Check for mobile
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setSidebarOffset(0);
      } else {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Tour Component */}
      <DashboardTour run={runTour} onFinish={endTour} />
      
      {/* Sidebar */}
      <MainSidebar />
      
      {/* Main Content */}
      <div 
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
          transition: 'margin-left 0.3s ease-out'
        }}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Icon name="LayoutDashboard" size={24} className="text-primary mr-3" />
                <h1 className="text-2xl font-bold text-foreground">Aperçu Rapide</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Vue d'ensemble de votre activité • {formatDate(currentTime)} • {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                iconName="BarChart3" 
                iconPosition="left"
                onClick={() => window.location.href = '/analytics-dashboard'}
                className="dashboard-analytics-button"
              >
                Analyses détaillées
              </Button>
              <Button 
                variant="default" 
                iconName="Plus" 
                iconPosition="left"
                className="dashboard-new-quote-button"
              >
                Nouveau devis
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 shadow-md dashboard-welcome">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-white">Bienvenue sur votre tableau de bord</h2>
                <p className="text-white/90">Voici un aperçu rapide de votre activité et des actions importantes</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={startTour}
                >
                  <span className="flex items-center">
                    <Icon name="Play" size={16} className="mr-2" />
                    Visite guidée
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 dashboard-metrics">
            {metricsData.map((metric, index) => (
              <MetricsCard key={index} {...metric} />
            ))}
          </div>

          {/* Main Dashboard Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quote Chart */}
              <div className="dashboard-chart">
                <QuoteChart />
              </div>
              
              {/* Recent Quotes */}
              <div className="dashboard-recent-quotes">
                <RecentQuotes />
              </div>
              
              {/* Quick Actions */}
              <div className="dashboard-quick-actions">
                <QuickActions />
              </div>
            </div>
            
            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Tasks and Alerts */}
              <div className="dashboard-tasks">
                <TaskList />
              </div>
              <div className="dashboard-ai-alerts">
                <AIAlerts />
              </div>
              
              {/* Top Clients */}
              <div className="dashboard-top-clients">
                <TopClients />
              </div>
            </div>
          </div>
          
          {/* AI Performance Insights */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm dashboard-ai-insights">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <Icon name="Brain" size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Insights IA</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/analytics-dashboard'}
              >
                <span className="flex items-center">
                  Voir l'analyse complète
                  <Icon name="ArrowRight" size={16} className="ml-2" />
                </span>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">Optimisation des prix</h4>
                <p className="text-xs text-muted-foreground">
                  Augmentez vos tarifs de 8% selon l'analyse du marché pour optimiser votre rentabilité
                </p>
              </div>
              <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">Meilleur jour de conversion</h4>
                <p className="text-xs text-muted-foreground">
                  Les mardis et jeudis ont un taux de conversion 23% plus élevé que les autres jours
                </p>
              </div>
              <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">Opportunité de relance</h4>
                <p className="text-xs text-muted-foreground">
                  5 devis non signés depuis plus de 7 jours pourraient être convertis avec une relance
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;