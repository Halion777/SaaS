import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
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
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOffset(0);
      } else {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-20' : ''
        }`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
          paddingRight: isMobile ? '1rem' : '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem'
        }}
      >
        <div className="py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <Icon name="BarChart3" size={32} color="var(--color-primary)" className="mr-3" />
                  Tableau de bord analytique
                </h1>
                <p className="text-muted-foreground mt-2">
                  Intelligence d'affaires et insights IA pour la prise de décision stratégique
                </p>
              </div>
              <ExportControls />
            </div>
          </motion.div>

          {/* Filter Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
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

          {/* KPI Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

            {/* Client Segments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ClientSegmentChart data={clientSegmentData} />
            </motion.div>

            {/* Real-time Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <MetricsProgress metrics={currentMetrics} />
            </motion.div>
          </div>

          {/* AI Insights and Comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* AI Insights Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
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
              transition={{ delay: 0.8 }}
            >
              <ComparisonAnalytics />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;