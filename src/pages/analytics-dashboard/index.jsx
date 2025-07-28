import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import KPICard from './components/KPICard';
import RevenueChart from './components/RevenueChart';
import ConversionChart from './components/ConversionChart';
import ClientSegmentChart from './components/ClientSegmentChart';
import AIInsightsPanel from './components/AIInsightsPanel';
import MetricsProgress from './components/MetricsProgress';
import ComparisonAnalytics from './components/ComparisonAnalytics';
import FilterControls from './components/FilterControls';
import ExportControls from './components/ExportControls';
import { generateBusinessInsights, generatePricingOptimization, analyzePerformancePatterns } from '../../services/openaiService';
import { useScrollPosition } from '../../utils/useScrollPosition';

const AnalyticsDashboard = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [pricingOptimization, setPricingOptimization] = useState(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const tabsScrollRef = useScrollPosition('analytics-tabs-scroll');

  // Mock business data for AI analysis
  const businessData = {
    revenue: 156750,
    quotes: 245,
    clients: 89,
    conversionRate: 68.5,
    avgProjectValue: 2340,
    marketSegments: ['residential', 'commercial', 'renovation'],
    services: ['plumbing', 'electrical', 'renovation', 'maintenance']
  };

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      
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

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
    const loadAIAnalytics = async () => {
      setIsLoading(true);
      try {
        const [insights, pricing, performance] = await Promise.all([
          generateBusinessInsights(businessData),
          generatePricingOptimization(businessData),
          analyzePerformancePatterns(businessData)
        ]);
        
        setAiInsights(insights);
        setPricingOptimization(pricing);
        setPerformanceAnalysis(performance);
      } catch (error) {
        console.error('Error loading AI analytics:', error);
        // Set fallback data
        setAiInsights({
          insights: ['Revenue growth trending upward', 'Client acquisition improving'],
          recommendations: ['Focus on premium services', 'Expand marketing reach'],
          predictions: ['20% growth expected next quarter']
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAIAnalytics();
  }, [dateRange, selectedSegment, selectedService]);

  const kpiData = [
    {
      title: 'Chiffre d\'affaires',
      value: '156 750€',
      change: '+12.5%',
      trend: 'up',
      icon: 'Euro',
      color: 'emerald',
      description: 'vs mois précédent'
    },
    {
      title: 'Taux de conversion',
      value: '68.5%',
      change: '+5.2%',
      trend: 'up',
      icon: 'TrendingUp',
      color: 'blue',
      description: 'devis acceptés'
    },
    {
      title: 'Coût d\'acquisition',
      value: '85€',
      change: '-8.3%',
      trend: 'down',
      icon: 'Target',
      color: 'purple',
      description: 'par nouveau client'
    },
    {
      title: 'Marge bénéficiaire',
      value: '32.8%',
      change: '+2.1%',
      trend: 'up',
      icon: 'PieChart',
      color: 'orange',
      description: 'marge moyenne'
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 120000, forecast: 125000 },
    { month: 'Fév', revenue: 135000, forecast: 140000 },
    { month: 'Mar', revenue: 148000, forecast: 152000 },
    { month: 'Avr', revenue: 156750, forecast: 165000 },
    { month: 'Mai', forecast: 175000 },
    { month: 'Jun', forecast: 180000 }
  ];

  const conversionData = [
    { name: 'Plomberie', rate: 75, count: 45 },
    { name: 'Électricité', rate: 68, count: 32 },
    { name: 'Rénovation', rate: 62, count: 28 },
    { name: 'Maintenance', rate: 80, count: 15 }
  ];

  const clientSegmentData = [
    { name: 'Résidentiel', value: 65, revenue: 102000 },
    { name: 'Commercial', value: 25, revenue: 39200 },
    { name: 'Industriel', value: 10, revenue: 15550 }
  ];

  const currentMetrics = {
    monthProgress: 78,
    revenueTarget: 85,
    clientTarget: 92,
    projectsTarget: 67
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <>
            {/* KPI Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
            >
              {kpiData.map((kpi, index) => (
                <KPICard
                  key={kpi.title}
                  {...kpi}
                  delay={index * 0.1}
                />
              ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {/* Revenue Forecasting */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <RevenueChart data={revenueData} />
              </motion.div>

              {/* Conversion Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ConversionChart data={conversionData} />
              </motion.div>
            </div>
          </>
        );
      case 'segments':
        return (
          <>
            {/* Client Segments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 sm:mb-8"
            >
              <ClientSegmentChart data={clientSegmentData} />
            </motion.div>

            {/* Real-time Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 sm:mb-8"
            >
              <MetricsProgress metrics={currentMetrics} />
            </motion.div>
          </>
        );
      case 'ai':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* AI Insights Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="xl:col-span-2"
            >
              <AIInsightsPanel
                insights={aiInsights}
                pricingOptimization={pricingOptimization}
                performanceAnalysis={performanceAnalysis}
                isLoading={isLoading}
              />
            </motion.div>

            {/* Comparative Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ComparisonAnalytics />
            </motion.div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="BarChart3" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Analyses Détaillées</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Explorez vos données en profondeur pour des décisions stratégiques
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">

                <ExportControls />
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 sm:mb-6"
          >
            <div ref={tabsScrollRef} className="flex border-b border-border overflow-x-auto scrollbar-hide">
              <button
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 min-w-fit ${
                  activeTab === 'overview' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="flex items-center">
                  <Icon name="PieChart" size={16} className="mr-2" />
                  <span className="hidden sm:inline">Vue d'ensemble</span>
                  <span className="sm:hidden">Vue</span>
                </span>
              </button>
              <button
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 min-w-fit ${
                  activeTab === 'segments' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('segments')}
              >
                <span className="flex items-center">
                  <Icon name="Users" size={16} className="mr-2" />
                  <span className="hidden sm:inline">Segments clients</span>
                  <span className="sm:hidden">Segments</span>
                </span>
              </button>
              <button
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 min-w-fit ${
                  activeTab === 'ai' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('ai')}
              >
                <span className="flex items-center">
                  <Icon name="Brain" size={16} className="mr-2" />
                  <span className="hidden sm:inline">Insights IA</span>
                  <span className="sm:hidden">IA</span>
                </span>
              </button>
            </div>
          </motion.div>

          {/* Filter Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 sm:mb-8 bg-card border border-border p-3 sm:p-4 rounded-lg"
          >
            <FilterControls
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedSegment={selectedSegment}
              onSegmentChange={setSelectedSegment}
              selectedService={selectedService}
              onServiceChange={setSelectedService}
            />
          </motion.div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;