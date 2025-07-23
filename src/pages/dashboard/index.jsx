import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MetricsCard from './components/MetricsCard';
import QuoteChart from './components/QuoteChart';
import TaskList from './components/TaskList';
import AIAlerts from './components/AIAlerts';
import RecentQuotes from './components/RecentQuotes';
import TopClients from './components/TopClients';
import QuickActions from './components/QuickActions';
import SponsoredBanner from './components/SponsoredBanner';
import AIPerformanceWidget from './components/AIPerformanceWidget';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              iconName={isDarkMode ? "Sun" : "Moon"}
            >
              {isDarkMode ? 'Mode clair' : 'Mode sombre'}
            </Button>
            <Button variant="outline" iconName="Download" iconPosition="left">
              Exporter
            </Button>
            <Button variant="default" iconName="Plus" iconPosition="left">
              Nouveau devis
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsData.map((metric, index) => (
            <MetricsCard key={index} {...metric} />
          ))}
        </div>

        {/* Sponsored Banner */}
        <SponsoredBanner />

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuoteChart />
          <AIPerformanceWidget />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks and Alerts */}
          <div className="space-y-6">
            <TaskList />
            <AIAlerts />
          </div>

          {/* Center Column - Recent Quotes */}
          <div className="space-y-6">
            <RecentQuotes />
            <QuickActions />
          </div>

          {/* Right Column - Top Clients */}
          <div className="space-y-6">
            <TopClients />
            
            {/* Weekly Summary Card */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Résumé hebdomadaire</h3>
                <Icon name="Calendar" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Devis créés</span>
                  <span className="text-sm font-medium text-foreground">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Devis signés</span>
                  <span className="text-sm font-medium text-success">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CA généré</span>
                  <span className="text-sm font-medium text-foreground">6.450€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taux de conversion</span>
                  <span className="text-sm font-medium text-success">80%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Semaine du 14-20 Juillet</span>
                  <span className="text-success">+5% vs semaine précédente</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Recommendations */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recommandations IA</h3>
              <div className="ai-indicator w-2 h-2 bg-primary rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground font-medium">Optimiser les prix</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Augmentez vos tarifs de 8% selon l'analyse du marché
                </p>
              </div>
              <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <p className="text-sm text-foreground font-medium">Relancer Marie Dubois</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Probabilité de signature: 85% si relance aujourd'hui
                </p>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
            <h3 className="text-lg font-semibold text-foreground mb-4">Tendances</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="TrendingUp" size={16} color="var(--color-success)" />
                  <span className="text-sm text-foreground">Meilleur jour</span>
                </div>
                <span className="text-sm font-medium text-foreground">Mardi</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} color="var(--color-primary)" />
                  <span className="text-sm text-foreground">Heure optimale</span>
                </div>
                <span className="text-sm font-medium text-foreground">14h-16h</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="Target" size={16} color="var(--color-warning)" />
                  <span className="text-sm text-foreground">Service populaire</span>
                </div>
                <span className="text-sm font-medium text-foreground">Plomberie</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-professional">
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques rapides</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">24</p>
                <p className="text-xs text-muted-foreground">Clients actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">156</p>
                <p className="text-xs text-muted-foreground">Devis total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">4.2</p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-error">3</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;