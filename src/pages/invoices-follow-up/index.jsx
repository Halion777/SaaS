import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import FilterToolbar from '../follow-up-management/components/FilterToolbar';
import { useScrollPosition } from '../../utils/useScrollPosition';

const InvoicesFollowUp = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  const [activeFilter, setActiveFilter] = useState('invoices');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    days: 'all'
  });
  const filterScrollRef = useScrollPosition('followup-filter-scroll');
  const [followUps, setFollowUps] = useState([
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
      id: 7,
      name: 'Lucie Petit',
      project: 'FAC-2024-003 - Installation plomberie',
      daysAgo: 4,
      nextFollowUp: '2024-01-19',
      potentialRevenue: 2100,
      priority: 'high',
      status: 'pending',
      type: 'invoice',
      hasResponse: false,
      isPaid: false
    },
    {
      id: 8,
      name: 'Thomas Leroy',
      project: 'FAC-2024-004 - Électricité générale',
      daysAgo: 6,
      nextFollowUp: '2024-01-21',
      potentialRevenue: 3800,
      priority: 'medium',
      status: 'scheduled',
      type: 'invoice',
      hasResponse: false,
      isPaid: false
    }
  ]);

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const newOffset = e.detail.isCollapsed ? 80 : 288;
      setSidebarOffset(newOffset);
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        setSidebarOffset(savedCollapsed === 'true' ? 80 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      if (!isMobile && !isTablet) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        setSidebarOffset(savedCollapsed === 'true' ? 80 : 288);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isMobile, isTablet]);

  const setInitialViewMode = () => {
    const savedViewMode = localStorage.getItem('followup-view-mode');
    if (savedViewMode && ['table', 'card'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    } else {
      // Default to card view on mobile, table view on desktop
      const defaultViewMode = window.innerWidth < 768 ? 'card' : 'table';
      setViewMode(defaultViewMode);
    }
  };

  useEffect(() => {
    setInitialViewMode();
  }, []);

  const handleViewModeResize = () => {
    if (window.innerWidth < 768 && viewMode === 'table') {
      setViewMode('card');
      localStorage.setItem('followup-view-mode', 'card');
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleViewModeResize);
    return () => window.removeEventListener('resize', handleViewModeResize);
  }, [viewMode]);

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
    
    // Only show invoice follow-ups
    if (followUp.type !== 'invoice') return false;
    
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
    return labels[type] || 'Facture';
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
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Client</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Projet</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Jours</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Prochaine relance</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Montant</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Priorité</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Statut</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFollowUps.map((followUp) => (
              <tr key={followUp.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-primary">
                        {followUp.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{followUp.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-foreground">{followUp.project}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-foreground">{followUp.daysAgo}j</div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-foreground">{followUp.nextFollowUp}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm font-medium text-foreground">{followUp.potentialRevenue.toLocaleString()}€</div>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.priority)}`}>
                    {getPriorityLabel(followUp.priority)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                    {getStatusLabel(followUp.status)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollowUp(followUp.id)}
                      className="h-8 px-3"
                    >
                      <Icon name="MessageCircle" size={14} className="mr-1" />
                      Relancer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickAI(followUp.id)}
                      className="h-8 px-2"
                    >
                      <Icon name="Zap" size={14} />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredFollowUps.map((followUp) => (
        <div key={followUp.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-primary">
                  {followUp.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-foreground">{followUp.name}</div>
                <div className="text-xs text-muted-foreground">{followUp.project}</div>
              </div>
            </div>
            <Icon name={getTypeIcon(followUp.type)} size={16} className="text-muted-foreground" />
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jours écoulés:</span>
              <span className="font-medium">{followUp.daysAgo}j</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prochaine relance:</span>
              <span className="font-medium">{followUp.nextFollowUp}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant:</span>
              <span className="font-medium text-green-600">{followUp.potentialRevenue.toLocaleString()}€</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.priority)}`}>
              {getPriorityLabel(followUp.priority)}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
              {getStatusLabel(followUp.status)}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFollowUp(followUp.id)}
              className="flex-1"
            >
              <Icon name="MessageCircle" size={14} className="mr-1" />
              Relancer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAI(followUp.id)}
            >
              <Icon name="Zap" size={14} />
            </Button>
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
                  <Icon name="Bell" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relances factures</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Relancez vos factures non payées
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                
              </div>
            </div>
          </header>

          {/* Enhanced Filter Tabs */}
          <div ref={filterScrollRef} className="flex space-x-1 bg-muted/50 rounded-lg p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter('invoices')}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-md text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 flex items-center justify-center space-x-2 ${
                activeFilter === 'invoices'
                  ? 'bg-background text-foreground shadow-sm border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon name="Receipt" size={16} className="text-primary" />
              <span>Factures</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeFilter === 'invoices'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {invoiceFollowUps.length}
              </span>
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
                <Icon name="Bell" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Urgent</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">CA potentiel</h3>
                <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">{totalRevenue.toLocaleString()}€</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Factures
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
              <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune relance nécessaire</h3>
              <p className="text-muted-foreground">
                Toutes vos factures sont payées
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

export default InvoicesFollowUp; 