import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';

const FollowUpManagement = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
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
      type: 'client'
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
      type: 'client'
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
      type: 'client'
    },
    {
      id: 4,
      name: 'Fournitures BTP Plus',
      project: 'FAC-2024-001 - Matériaux construction',
      daysAgo: 2,
      nextFollowUp: '2024-01-15',
      potentialRevenue: -4500,
      priority: 'high',
      status: 'pending',
      type: 'supplier'
    },
    {
      id: 5,
      name: 'Électricité Pro',
      project: 'FAC-2024-002 - Composants électriques',
      daysAgo: 1,
      nextFollowUp: '2024-01-16',
      potentialRevenue: -1200,
      priority: 'medium',
      status: 'scheduled',
      type: 'supplier'
    }
  ]);

  // Handle sidebar offset for responsive layout
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    setSidebarOffset(isCollapsed ? 64 : 288);
    
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
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Normale';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'scheduled': return 'Programmée';
      case 'sent': return 'Envoyée';
      default: return 'Inconnu';
    }
  };

  const handleFollowUp = (id) => {
    console.log('Follow up for:', id);
    // Handle follow up action
  };

  const handleQuickAI = (id) => {
    console.log('Quick AI for:', id);
    // Handle AI quick action
  };

  const [activeFilter, setActiveFilter] = useState('all');
  
  const clientFollowUps = followUps.filter(fu => fu.type === 'client');
  const supplierFollowUps = followUps.filter(fu => fu.type === 'supplier');
  
  const filteredFollowUps = activeFilter === 'all' 
    ? followUps 
    : activeFilter === 'clients' 
    ? clientFollowUps 
    : supplierFollowUps;
  
  // Calculate metrics based on current filter
  const pendingCount = filteredFollowUps.filter(fu => fu.status === 'pending').length;
  const highPriorityCount = filteredFollowUps.filter(fu => fu.priority === 'high').length;
  const clientRevenue = filteredFollowUps.filter(fu => fu.type === 'client').reduce((sum, fu) => sum + fu.potentialRevenue, 0);
  const supplierPayments = Math.abs(filteredFollowUps.filter(fu => fu.type === 'supplier').reduce((sum, fu) => sum + fu.potentialRevenue, 0));

  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Icon name="MessageCircle" size={24} color="var(--color-primary)" />
              <h1 className="text-2xl font-bold text-foreground">Relances</h1>
            </div>
            <p className="text-muted-foreground">
              Relancez vos prospects automatiquement et intelligemment
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tous ({followUps.length})
            </button>
            <button
              onClick={() => setActiveFilter('clients')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'clients'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clients ({clientFollowUps.length})
            </button>
            <button
              onClick={() => setActiveFilter('suppliers')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'suppliers'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fournisseurs ({supplierFollowUps.length})
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Relances en attente</h3>
                <Icon name="Clock" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">À traiter</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Priorité haute</h3>
                <Icon name="MessageCircle" size={20} color="var(--color-muted-foreground)" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>

            {activeFilter !== 'suppliers' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">CA potentiel</h3>
                  <Icon name="FileText" size={20} color="var(--color-muted-foreground)" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{clientRevenue.toLocaleString()}€</div>
                <p className="text-sm text-muted-foreground">
                  {activeFilter === 'all' ? 'Clients' : 'Total'}
                </p>
              </div>
            )}

            {activeFilter !== 'clients' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Paiements à effectuer</h3>
                  <Icon name="DollarSign" size={20} color="var(--color-muted-foreground)" />
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">{supplierPayments.toLocaleString()}€</div>
                <p className="text-sm text-muted-foreground">
                  {activeFilter === 'all' ? 'Fournisseurs' : 'Total'}
                </p>
              </div>
            )}
          </div>

          {/* Follow-up Items */}
          <div className="space-y-4">
            {filteredFollowUps.map((followUp) => (
              <div key={followUp.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  {/* Left side - Client/Supplier info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon 
                          name={followUp.type === 'supplier' ? 'Truck' : 'User'} 
                          size={16} 
                          className={followUp.type === 'supplier' ? 'text-orange-500' : 'text-blue-500'} 
                        />
                        <h3 className="font-semibold text-foreground">{followUp.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          followUp.type === 'supplier' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {followUp.type === 'supplier' ? 'Fournisseur' : 'Client'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.priority)}`}>
                        {getPriorityLabel(followUp.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                        {getStatusLabel(followUp.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="FileText" size={14} />
                        <span>{followUp.project}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="Clock" size={14} />
                        <span>Il y a {followUp.daysAgo} jours</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="Calendar" size={14} />
                        <span>Prochaine relance: {followUp.nextFollowUp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Revenue/Amount and actions */}
                  <div className="flex flex-col items-end space-y-4">
                    <div className={`text-lg font-bold ${followUp.type === 'supplier' ? 'text-red-600' : 'text-green-600'}`}>
                      {followUp.type === 'supplier' ? '-' : '+'}{Math.abs(followUp.potentialRevenue).toLocaleString()}€
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFollowUp(followUp.id)}
                        iconName={followUp.type === 'supplier' ? 'DollarSign' : 'Mail'}
                        iconPosition="left"
                      >
                        {followUp.type === 'supplier' ? 'Payer' : 'Relancer'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAI(followUp.id)}
                        iconName="Zap"
                        iconPosition="left"
                      >
                        IA Rapide
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FollowUpManagement;