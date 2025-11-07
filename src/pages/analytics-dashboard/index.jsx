import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import MainSidebar from '../../components/ui/MainSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import KPICard from './components/KPICard';
import RevenueChart from './components/RevenueChart';
import ConversionChart from './components/ConversionChart';
import ClientSegmentChart from './components/ClientSegmentChart';
import MetricsProgress from './components/MetricsProgress';
import FilterControls from './components/FilterControls';
import ExportControls from './components/ExportControls';
import DetailedAnalyticsPanel from './components/DetailedAnalyticsPanel';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { useAuth } from '../../context/AuthContext';
import { fetchQuotes } from '../../services/quotesService';
import { InvoiceService } from '../../services/invoiceService';
import { fetchClients } from '../../services/clientsService';
import { ExpenseInvoicesService } from '../../services/expenseInvoicesService';
import { getAnalyticsObjectives } from '../../services/authService';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({
    quotes: [],
    invoices: [],
    clients: [],
    expenseInvoices: []
  });
  const [userObjectives, setUserObjectives] = useState({
    revenueTarget: null,
    clientTarget: null,
    projectsTarget: null
  });
  const tabsScrollRef = useScrollPosition('analytics-tabs-scroll');
  const hasLoadedData = useRef(false);

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

  // Fetch analytics data from backend
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user?.id) return;
      
      // Prevent reloading if data was already loaded for this user
      if (hasLoadedData.current) return;
      
      try {
        hasLoadedData.current = true;
        setIsLoading(true);

        // Fetch all data in parallel
        const [quotesResult, clientsResult, invoicesResult, expenseInvoicesResult] = await Promise.all([
          fetchQuotes(user.id),
          fetchClients(),
          InvoiceService.fetchInvoices(user.id),
          new ExpenseInvoicesService().getExpenseInvoices()
        ]);

        setAnalyticsData({
          quotes: quotesResult.data || [],
          clients: clientsResult.data || [],
          invoices: invoicesResult.data || [],
          expenseInvoices: expenseInvoicesResult.data || []
        });

        // Load user objectives
        const objectivesResult = await getAnalyticsObjectives();
        if (objectivesResult.data) {
          setUserObjectives(objectivesResult.data);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Reset the flag when user changes
    if (user?.id) {
      hasLoadedData.current = false;
      loadAnalyticsData();
    }
  }, [user?.id]);

  // Calculate KPIs from backend data
  const kpiData = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Quotes this month
    const quotesThisMonth = analyticsData.quotes.filter(q => new Date(q.created_at) >= firstDayOfMonth).length;
    const quotesLastMonth = analyticsData.quotes.filter(q => {
      const quoteDate = new Date(q.created_at);
      return quoteDate >= firstDayOfLastMonth && quoteDate <= lastDayOfLastMonth;
    }).length;
    const quotesGrowth = quotesLastMonth > 0 
      ? Math.round(((quotesThisMonth - quotesLastMonth) / quotesLastMonth) * 100)
      : (quotesThisMonth > 0 ? 100 : 0);

    // Accepted quotes (including converted)
    const acceptedQuotesThisMonth = analyticsData.quotes.filter(q => 
      (q.status === 'accepted' || q.status === 'converted_to_invoice') && 
      new Date(q.created_at) >= firstDayOfMonth
    ).length;
    const acceptedQuotesLastMonth = analyticsData.quotes.filter(q => {
      const quoteDate = new Date(q.created_at);
      return (q.status === 'accepted' || q.status === 'converted_to_invoice') &&
        quoteDate >= firstDayOfLastMonth && quoteDate <= lastDayOfLastMonth;
    }).length;
    const acceptedGrowth = acceptedQuotesLastMonth > 0
      ? Math.round(((acceptedQuotesThisMonth - acceptedQuotesLastMonth) / acceptedQuotesLastMonth) * 100)
      : (acceptedQuotesThisMonth > 0 ? 100 : 0);

    // Monthly revenue
    const monthlyRevenue = analyticsData.invoices
      .filter(inv => new Date(inv.created_at) >= firstDayOfMonth)
      .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);
    const lastMonthRevenue = analyticsData.invoices
      .filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate >= firstDayOfLastMonth && invDate <= lastDayOfLastMonth;
      })
      .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : (monthlyRevenue > 0 ? 100 : 0);

    // Payment status
    const paidInvoices = analyticsData.invoices.filter(inv => inv.status === 'paid').length;
    const totalInvoices = analyticsData.invoices.length;
    const paymentRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
    const paidInvoicesLastMonth = analyticsData.invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return inv.status === 'paid' && invDate >= firstDayOfLastMonth && invDate <= lastDayOfLastMonth;
    }).length;
    const totalInvoicesLastMonth = analyticsData.invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate >= firstDayOfLastMonth && invDate <= lastDayOfLastMonth;
    }).length;
    const paymentRateLastMonth = totalInvoicesLastMonth > 0 ? Math.round((paidInvoicesLastMonth / totalInvoicesLastMonth) * 100) : 0;
    const paymentRateGrowth = paymentRateLastMonth > 0
      ? Math.round(((paymentRate - paymentRateLastMonth) / paymentRateLastMonth) * 100)
      : (paymentRate > 0 ? 100 : 0);

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return [
      {
        title: 'Total devis envoyés',
        value: quotesThisMonth.toString(),
        change: `${quotesGrowth >= 0 ? '+' : ''}${quotesGrowth}%`,
        trend: quotesGrowth >= 0 ? 'up' : 'down',
        icon: 'FileText',
        color: 'blue',
        description: 'devis ce mois-ci'
      },
      {
        title: 'Devis acceptés',
        value: acceptedQuotesThisMonth.toString(),
        change: `${acceptedGrowth >= 0 ? '+' : ''}${acceptedGrowth}%`,
        trend: acceptedGrowth >= 0 ? 'up' : 'down',
        icon: 'CheckCircle',
        color: 'emerald',
        description: 'taux de conversion'
      },
      {
        title: 'Revenu mensuel',
        value: formatCurrency(monthlyRevenue),
        change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`,
        trend: revenueGrowth >= 0 ? 'up' : 'down',
        icon: 'Euro',
        color: 'orange',
        description: 'vs mois précédent'
      },
      {
        title: 'Statut des paiements',
        value: `${paymentRate}%`,
        change: `${paymentRateGrowth >= 0 ? '+' : ''}${paymentRateGrowth}%`,
        trend: paymentRateGrowth >= 0 ? 'up' : 'down',
        icon: 'CreditCard',
        color: 'purple',
        description: 'payés à temps'
      }
    ];
  }, [analyticsData]);

  // Calculate detailed analytics data
  const detailedAnalyticsData = useMemo(() => {
    const paidInvoices = analyticsData.invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = analyticsData.invoices.filter(inv => inv.status === 'pending' || inv.status === 'unpaid').length;
    const overdueInvoices = analyticsData.invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.due_date);
      return dueDate < new Date();
    }).length;

    const totalClients = analyticsData.clients.length;
    const newClientsThisMonth = analyticsData.clients.filter(c => {
      const clientDate = new Date(c.created_at);
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return clientDate >= firstDayOfMonth;
    }).length;
    const returningClients = analyticsData.clients.filter(c => {
      // Clients with quotes or invoices
      return analyticsData.quotes.some(q => q.client_id === c.id) || 
             analyticsData.invoices.some(inv => inv.client_id === c.id);
    }).length;
    const inactiveClients = totalClients - returningClients;

    const totalQuotes = analyticsData.quotes.length;
    const acceptedQuotes = analyticsData.quotes.filter(q => q.status === 'accepted' || q.status === 'converted_to_invoice').length;
    const rejectedQuotes = analyticsData.quotes.filter(q => q.status === 'rejected').length;
    const pendingQuotes = analyticsData.quotes.filter(q => q.status === 'sent' || q.status === 'viewed' || q.status === 'draft').length;

    return {
      paymentStatus: {
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices
      },
      clientActivity: {
        newClients: newClientsThisMonth,
        returningClients: returningClients,
        inactiveClients: inactiveClients
      },
      invoiceStatistics: {
        totalRevenue: analyticsData.invoices.reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0),
        averageInvoice: analyticsData.invoices.length > 0 
          ? Math.round(analyticsData.invoices.reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0) / analyticsData.invoices.length)
          : 0,
        totalInvoices: analyticsData.invoices.length
      },
      quoteOverview: {
        totalQuotes: totalQuotes,
        acceptedQuotes: acceptedQuotes,
        rejectedQuotes: rejectedQuotes,
        pendingQuotes: pendingQuotes
      }
    };
  }, [analyticsData]);

  // Calculate revenue data for chart
  const revenueData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const revenue = analyticsData.invoices
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= firstDay && invDate <= lastDay;
        })
        .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);
      
      months.push({
        month: monthKey,
        revenue: revenue,
        forecast: null // No forecast for now
      });
    }
    return months;
  }, [analyticsData]);

  // Calculate conversion data by category (using project_categories from quotes)
  const conversionData = useMemo(() => {
    // Category mapping for display
    const categoryLabels = {
      'plumbing': 'Plomberie',
      'electrical': 'Électricité',
      'carpentry': 'Menuiserie',
      'painting': 'Peinture',
      'masonry': 'Maçonnerie',
      'tiling': 'Carrelage',
      'roofing': 'Toiture',
      'heating': 'Chauffage',
      'renovation': 'Rénovation',
      'cleaning': 'Nettoyage',
      'solar': 'Solaire',
      'gardening': 'Jardinage',
      'locksmith': 'Serrurerie',
      'glazing': 'Vitrerie',
      'insulation': 'Isolation',
      'airConditioning': 'Climatisation',
      'other': 'Autre'
    };

    // Group quotes by category
    const categoryGroups = {};
    analyticsData.quotes.forEach(quote => {
      // Use project_categories array if available, otherwise use custom_category or fallback
      const categories = quote.project_categories && quote.project_categories.length > 0
        ? quote.project_categories
        : (quote.custom_category ? [quote.custom_category] : ['other']);
      
      categories.forEach(category => {
        const categoryKey = category.toLowerCase();
        const displayName = categoryLabels[categoryKey] || category || 'Autre';
        
        if (!categoryGroups[displayName]) {
          categoryGroups[displayName] = { total: 0, accepted: 0 };
        }
        categoryGroups[displayName].total++;
        if (quote.status === 'accepted' || quote.status === 'converted_to_invoice') {
          categoryGroups[displayName].accepted++;
        }
      });
    });

    const result = Object.entries(categoryGroups)
      .map(([name, data]) => ({
        name: name,
        rate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
        count: data.total
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4 categories
    
    // Return empty array with at least one item if no data
    return result.length > 0 ? result : [{ name: 'Aucune donnée', rate: 0, count: 0 }];
  }, [analyticsData]);

  // Calculate client segment data
  const clientSegmentData = useMemo(() => {
    const professionalClients = analyticsData.clients.filter(c => c.client_type === 'company');
    const individualClients = analyticsData.clients.filter(c => c.client_type === 'individual');
    const totalClients = analyticsData.clients.length;

    const professionalRevenue = analyticsData.invoices
      .filter(inv => inv.client?.client_type === 'company')
      .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);
    const individualRevenue = analyticsData.invoices
      .filter(inv => inv.client?.client_type === 'individual')
      .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);

    const segments = [
      {
        name: 'Professionnel',
        value: totalClients > 0 ? Math.round((professionalClients.length / totalClients) * 100) : 0,
        revenue: professionalRevenue
      },
      {
        name: 'Particulier',
        value: totalClients > 0 ? Math.round((individualClients.length / totalClients) * 100) : 0,
        revenue: individualRevenue
      }
    ].filter(segment => segment.value > 0 || segment.revenue > 0);
    
    // Return at least one segment if no data
    return segments.length > 0 ? segments : [{ name: 'Aucune donnée', value: 100, revenue: 0 }];
  }, [analyticsData]);

  // Calculate current metrics progress
  const currentMetrics = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const monthProgress = Math.round((currentDay / daysInMonth) * 100);

    // Get current month values
    const monthlyRevenue = analyticsData.invoices
      .filter(inv => new Date(inv.created_at) >= firstDayOfMonth)
      .reduce((sum, inv) => sum + (parseFloat(inv.final_amount) || 0), 0);

    const newClientsThisMonth = analyticsData.clients.filter(c => {
      const clientDate = new Date(c.created_at);
      return clientDate >= firstDayOfMonth;
    }).length;

    const quotesThisMonth = analyticsData.quotes.filter(q => new Date(q.created_at) >= firstDayOfMonth).length;

    // Use user-defined targets if available, otherwise calculate from current values
    let revenueTarget, clientTarget, projectsTarget;

    if (userObjectives.revenueTarget !== null && userObjectives.revenueTarget !== undefined && userObjectives.revenueTarget > 0) {
      // User has set a target value (amount), calculate progress percentage
      revenueTarget = Math.round((monthlyRevenue / userObjectives.revenueTarget) * 100);
    } else {
      // Default: 10% above current
      const targetRevenue = monthlyRevenue * 1.1;
      revenueTarget = targetRevenue > 0 ? Math.round((monthlyRevenue / targetRevenue) * 100) : 0;
    }

    if (userObjectives.clientTarget !== null && userObjectives.clientTarget !== undefined && userObjectives.clientTarget > 0) {
      // User has set a target value (count), calculate progress percentage
      clientTarget = Math.round((newClientsThisMonth / userObjectives.clientTarget) * 100);
    } else {
      // Default: 20% above current
      const targetClients = newClientsThisMonth * 1.2;
      clientTarget = targetClients > 0 ? Math.round((newClientsThisMonth / targetClients) * 100) : 0;
    }

    if (userObjectives.projectsTarget !== null && userObjectives.projectsTarget !== undefined && userObjectives.projectsTarget > 0) {
      // User has set a target value (count), calculate progress percentage
      projectsTarget = Math.round((quotesThisMonth / userObjectives.projectsTarget) * 100);
    } else {
      // Default: 15% above current
      const targetProjects = quotesThisMonth * 1.15;
      projectsTarget = targetProjects > 0 ? Math.round((quotesThisMonth / targetProjects) * 100) : 0;
    }

    return {
      monthProgress,
      revenueTarget: Math.min(revenueTarget, 100),
      clientTarget: Math.min(clientTarget, 100),
      projectsTarget: Math.min(projectsTarget, 100)
    };
  }, [analyticsData, userObjectives]);

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

            {/* Detailed Analytics Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 sm:mb-8"
            >
              <DetailedAnalyticsPanel data={detailedAnalyticsData} />
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {/* Revenue Forecasting */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RevenueChart data={revenueData} />
              </motion.div>

              {/* Conversion Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
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
              <MetricsProgress 
                metrics={currentMetrics}
                userObjectives={userObjectives}
                onUpdate={(objectives) => {
                  setUserObjectives(objectives);
                }}
              />
            </motion.div>
          </>
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

                <ExportControls 
                  analyticsData={analyticsData}
                  kpiData={kpiData}
                  detailedAnalyticsData={detailedAnalyticsData}
                  revenueData={revenueData}
                  conversionData={conversionData}
                  clientSegmentData={clientSegmentData}
                />
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
            </div>
          </motion.div>


          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;