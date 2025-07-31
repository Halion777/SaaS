import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import FilterToolbar from './components/FilterToolbar';
import { useScrollPosition } from '../../utils/useScrollPosition';

const FollowUpManagement = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    days: 'all'
  });
  const filterScrollRef = useScrollPosition('followup-filter-scroll');
  const [followUps, setFollowUps] = useState([
    {
      id: 1,
      name: 'Pierre Leblanc',
      project: 'DEV-2024-003 - Pose de parquet',
      daysAgo: 5,
      nextFollowUp: '2024-01-20',
      potentialRevenue: 2800,
      priority: 'high',
      status: 'pending',
      type: 'quote',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 2,
      name: 'Sophie Durand',
      project: 'DEV-2024-004 - Rénovation cuisine',
      daysAgo: 3,
      nextFollowUp: '2024-01-18',
      potentialRevenue: 8500,
      priority: 'high',
      status: 'scheduled',
      type: 'quote',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 3,
      name: 'Michel Bernard',
      project: 'DEV-2024-005 - Installation électrique',
      daysAgo: 8,
      nextFollowUp: '2024-01-22',
      potentialRevenue: 1200,
      priority: 'medium',
      status: 'pending',
      type: 'quote',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 4,
      name: 'Marie Dubois',
      project: 'FAC-2024-001 - Rénovation salle de bain',
      daysAgo: 2,
      nextFollowUp: '2024-01-15',
      potentialRevenue: 3200,
      priority: 'high',
      status: 'pending',
      type: 'invoice',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 5,
      name: 'Jean Martin',
      project: 'FAC-2024-002 - Peinture intérieure',
      daysAgo: 1,
      nextFollowUp: '2024-01-16',
      potentialRevenue: 1800,
      priority: 'medium',
      status: 'scheduled',
      type: 'invoice',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 6,
      name: 'Claire Moreau',
      project: 'DEV-2024-006 - Installation climatisation',
      daysAgo: 2,
      nextFollowUp: '2024-01-17',
      potentialRevenue: 4500,
      priority: 'medium',
      status: 'completed',
      type: 'quote',
      hasResponse: true,
      isPaid: false
    },
    {
      id: 7,
      name: 'Paul Durand',
      project: 'FAC-2024-003 - Électricité complète',
      daysAgo: 0,
      nextFollowUp: '2024-01-20',
      potentialRevenue: 2800,
      priority: 'low',
      status: 'completed',
      type: 'invoice',
      hasResponse: false,
      isPaid: true
    }
  ]);

  // Handle sidebar offset for responsive layout
  useEffect(() => {
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
        // On desktop, check localStorage for sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (!isMobile && !isTablet) {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    // Set initial view mode based on screen size
    const setInitialViewMode = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    setInitialViewMode();

    // Add event listeners
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);

    // Initial setup
    handleResize();

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Auto-switch view mode on resize
  useEffect(() => {
    const handleViewModeResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'table') {
        setViewMode('card');
      }
    };

    window.addEventListener('resize', handleViewModeResize);
    return () => window.removeEventListener('resize', handleViewModeResize);
  }, [viewMode]);

  // Filter to only show items that need follow-up (no response or not paid)
  const needsFollowUp = (followUp) => {
    if (followUp.type === 'quote') {
      return !followUp.hasResponse; // Quotes need follow-up if no response
    } else if (followUp.type === 'invoice') {
      return !followUp.isPaid; // Invoices need follow-up if not paid
    }
    return false;
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getDaysRange = (days) => {
    switch (days) {
      case '0-2': return [0, 2];
      case '3-5': return [3, 5];
      case '6-10': return [6, 10];
      case '10+': return [10, Infinity];
      default: return [0, Infinity];
    }
  };

  const filteredFollowUps = followUps.filter(followUp => {
    if (!needsFollowUp(followUp)) return false; // Only show items that need follow-up
    
    // Filter by active tab (all, quotes, invoices)
    if (activeFilter === 'quotes') return followUp.type === 'quote';
    if (activeFilter === 'invoices') return followUp.type === 'invoice';
    
    // Filter by type
    if (filters.type !== 'all' && followUp.type !== filters.type) return false;
    
    // Filter by priority
    if (filters.priority !== 'all' && followUp.priority !== filters.priority) return false;
    
    // Filter by status
    if (filters.status !== 'all' && followUp.status !== filters.status) return false;
    
    // Filter by days
    if (filters.days !== 'all') {
      const [minDays, maxDays] = getDaysRange(filters.days);
      if (followUp.daysAgo < minDays || followUp.daysAgo > maxDays) return false;
    }
    
    return true;
  });

  const quoteFollowUps = followUps.filter(f => f.type === 'quote' && !f.hasResponse);
  const invoiceFollowUps = followUps.filter(f => f.type === 'invoice' && !f.isPaid);
  const pendingCount = filteredFollowUps.filter(f => f.status === 'pending').length;
  const highPriorityCount = filteredFollowUps.filter(f => f.priority === 'high').length;
  const totalRevenue = filteredFollowUps.reduce((sum, f) => sum + f.potentialRevenue, 0);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-700 bg-red-100',
      medium: 'text-amber-700 bg-amber-100',
      low: 'text-blue-700 bg-blue-100'
    };
    return colors[priority] || colors.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-orange-700 bg-orange-100',
      scheduled: 'text-blue-700 bg-blue-100',
      completed: 'text-green-700 bg-green-100'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible'
    };
    return labels[priority] || 'Faible';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      scheduled: 'Programmée',
      completed: 'Terminée'
    };
    return labels[status] || 'En attente';
  };

  const getTypeLabel = (type) => {
    const labels = {
      quote: 'Devis',
      invoice: 'Facture'
    };
    return labels[type] || 'Devis';
  };

  const getTypeIcon = (type) => {
    return type === 'invoice' ? 'Receipt' : 'FileText';
  };

  const handleFollowUp = (id) => {
    console.log('Follow up for:', id);
  };

  const handleQuickAI = (id) => {
    console.log('Quick AI for:', id);
  };

  const renderTableView = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Projet</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Délai</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Prochaine relance</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Montant</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Réponse/Paiement</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Priorité</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFollowUps.map((followUp) => (
              <tr key={followUp.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="User" 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{followUp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate block">
                    {followUp.project}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <Icon 
                      name={getTypeIcon(followUp.type)} 
                      size={12} 
                      className="text-muted-foreground"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {getTypeLabel(followUp.type)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Il y a {followUp.daysAgo} jours
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {followUp.nextFollowUp}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm font-medium text-green-600">
                    +{followUp.potentialRevenue.toLocaleString()}€
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                    followUp.type === 'quote' 
                      ? (followUp.hasResponse ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100')
                      : (followUp.isPaid ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100')
                  }`}>
                    {followUp.type === 'quote' 
                      ? (followUp.hasResponse ? 'Répondu' : 'Pas de réponse')
                      : (followUp.isPaid ? 'Payé' : 'Non payé')
                    }
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                    {getPriorityLabel(followUp.priority)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleFollowUp(followUp.id)}
                      iconName="Mail"
                      iconPosition="left"
                      className="h-7 sm:h-8 text-xs"
                      title="Relancer"
                    >
                      Relancer
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleQuickAI(followUp.id)}
                      iconName="Zap"
                      iconPosition="left"
                      className="h-7 sm:h-8 text-xs"
                      title="IA Rapide"
                    >
                      IA
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {filteredFollowUps.map((followUp) => (
        <div key={followUp.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header with client info and tags */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name="User" 
                  size={16} 
                  className="sm:w-5 sm:h-5 text-blue-500"
                />
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{followUp.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-1 rounded-full text-xs font-medium text-center bg-blue-100 text-blue-800">
                  {getTypeLabel(followUp.type)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                  followUp.type === 'quote' 
                    ? (followUp.hasResponse ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100')
                    : (followUp.isPaid ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100')
                }`}>
                  {followUp.type === 'quote' 
                    ? (followUp.hasResponse ? 'Répondu' : 'Pas de réponse')
                    : (followUp.isPaid ? 'Payé' : 'Non payé')
                  }
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                  {getPriorityLabel(followUp.priority)}
                </span>
              </div>
            </div>

            {/* Project details */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="FileText" size={12} className="sm:w-3.5 sm:h-3.5 mt-0.5" />
                <span className="break-words">{followUp.project}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>Il y a {followUp.daysAgo} jours</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="Calendar" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>Prochaine relance: {followUp.nextFollowUp}</span>
              </div>
            </div>

            {/* Revenue and actions */}
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                +{followUp.potentialRevenue.toLocaleString()}€
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleFollowUp(followUp.id)}
                  iconName="Mail"
                  iconPosition="left"
                  className="h-8 sm:h-9"
                >
                  Relancer
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickAI(followUp.id)}
                  iconName="Zap"
                  iconPosition="left"
                  className="h-8 sm:h-9"
                >
                  IA Rapide
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="MessageCircle" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relances</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Relancez vos devis sans réponse et factures non payées
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                
              </div>
            </div>
          </header>

          {/* Filter Tabs */}
          <div ref={filterScrollRef} className="flex space-x-1 bg-muted/50 rounded-lg p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tous ({followUps.length})
            </button>
            <button
              onClick={() => setActiveFilter('quotes')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'quotes'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Devis ({quoteFollowUps.length})
            </button>
            <button
              onClick={() => setActiveFilter('invoices')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'invoices'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Factures ({invoiceFollowUps.length})
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Relances en attente</h3>
                <Icon name="Clock" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{pendingCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">À traiter</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Priorité haute</h3>
                <Icon name="MessageCircle" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Urgent</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">CA potentiel</h3>
                <Icon name="FileText" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">{totalRevenue.toLocaleString()}€</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {activeFilter === 'all' ? 'Total' : activeFilter === 'quotes' ? 'Devis' : 'Factures'}
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <FilterToolbar 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
            filteredCount={filteredFollowUps.length}
          />

          {/* Follow-up Items */}
          {filteredFollowUps.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Icon name="MessageCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune relance nécessaire</h3>
              <p className="text-muted-foreground">
                Tous vos devis ont reçu une réponse et toutes vos factures sont payées
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* View Toggle */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Vue:</span>
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        viewMode === 'table'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name="Table" size={14} className="mr-1" />
                      Tableau
                    </button>
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        viewMode === 'card'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name="Grid" size={14} className="mr-1" />
                      Cartes
                    </button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {filteredFollowUps.length} relance(s)
                </div>
              </div>

              {/* Content */}
              {viewMode === 'table' ? (
                renderTableView()
              ) : (
                renderCardView()
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FollowUpManagement;